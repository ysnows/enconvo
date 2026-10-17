import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import ts from 'typescript'
const require = createRequire(import.meta.url)
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
async function load(path, mocks = {}) {
  const url = new URL(`../src/${path}`, import.meta.url)
  const source = await readFile(url, 'utf8')
  const module = { exports: {} }
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText
  new Function('require', 'module', 'exports', compiled)(name => mocks[name] ?? require(name), module, module.exports)
  return module.exports
}
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }
// Exercise async hook lifecycles without adding a second React or a DOM dependency.
function hooks() {
  const slots = []; let cursor = 0; let dirty = true; let render; let output; let effects = []
  const changed = (a, b) => !a || !b || a.length !== b.length || a.some((x, i) => !Object.is(x, b[i]))
  const api = { ...React,
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, next => { slots[i].value = typeof next === 'function' ? next(slots[i].value) : next; dirty = true }] },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial } },
    useCallback(fn, deps) { const i = cursor++; if (!slots[i] || changed(slots[i].deps, deps)) slots[i] = { value: fn, deps }; return slots[i].value },
    useEffect(fn, deps) { const i = cursor++; if (!slots[i] || changed(slots[i].deps, deps)) { const previous = slots[i]; slots[i] = { deps }; effects.push(() => { previous?.cleanup?.(); slots[i].cleanup = fn() }) } },
  }
  function flush() { for (let n = 0; dirty; n++) { assert.ok(n < 30, 'render loop'); dirty = false; cursor = 0; output = render(); const pending = effects; effects = []; pending.forEach(fn => fn()) } return output }
  return { api, mount(fn) { render = fn; return flush() }, flush, get value() { return output },
    async settle() { for (let i = 0; i < 6; i++) { await new Promise(setImmediate); flush() } return output },
    unmount() { slots.forEach(slot => slot.cleanup?.()) },
  }
}
const session = (id, token = id) => ({ user: { id, email: `${id}@example.test` }, access_token: token })
const ok = (status = 'approved') => ({ ok: true, data: { affiliate: { status, code: 'partner' }, program: {} } })
async function accountHarness(initial = null) {
  const h = hooks(); const requests = []; const initialRead = deferred(); let listener
  const auth = { getSession: () => initialRead.promise, onAuthStateChange(fn) { listener = fn; return { data: { subscription: { unsubscribe() { listener = null } } } } } }
  const { useAffiliateAccount } = await load('lib/use-affiliate-account.ts', {
    react: h.api, '@/lib/supabase': { supabase: { auth } },
    '@/lib/affiliate-program': { getAffiliateDashboard(token) { const result = deferred(); requests.push({ token, ...result }); return result.promise } },
  })
  h.mount(useAffiliateAccount)
  initialRead.resolve({ data: { session: initial } })
  await h.settle()
  return { h, requests, emit(event, next) { listener(event, next); h.flush() } }
}
{
  const { h } = await accountHarness()
  assert.equal(h.value.account.state, 'signed_out')
  h.unmount()
}
{
  const { h, requests, emit } = await accountHarness(session('first'))
  assert.equal(h.value.account.state, 'loading')
  emit('SIGNED_IN', session('second'))
  requests[1].resolve(ok('pending')); await h.settle()
  assert.equal(h.value.account.session.user.id, 'second')
  requests[0].resolve(ok('approved')); await h.settle()
  assert.equal(h.value.account.data.affiliate.status, 'pending', 'late old-account response is ignored')
  emit('TOKEN_REFRESHED', session('second', 'fresh-token')); await h.settle()
  assert.equal(requests.length, 2, 'token refresh does not reload a loaded dashboard')
  h.value.refresh(); assert.equal(requests[2].token, 'fresh-token')
  emit('SIGNED_OUT', null)
  requests[2].resolve(ok()); await h.settle()
  assert.equal(h.value.account.state, 'signed_out', 'sign-out invalidates in-flight responses')
  h.unmount()
}
{
  const { h, requests, emit } = await accountHarness(session('first'))
  requests[0].resolve(ok('pending')); await h.settle()
  const oldUpdate = h.value.updateAffiliate
  emit('SIGNED_IN', session('second'))
  requests[1].resolve(ok('rejected')); await h.settle()
  oldUpdate({ status: 'approved' }); h.flush()
  assert.equal(h.value.account.data.affiliate.status, 'rejected', 'old form submission cannot update another account')
  h.unmount()
}
{
  const { h, requests, emit } = await accountHarness(session('first', 'expired-token'))
  emit('TOKEN_REFRESHED', session('first', 'fresh-token'))
  requests[0].resolve({ ok: false, status: 401, message: 'expired' }); await h.settle()
  assert.equal(requests[1].token, 'fresh-token', 'a refreshed token retries an old 401')
  requests[1].resolve({ ok: false, status: 503, message: 'offline' }); await h.settle()
  assert.equal(h.value.account.state, 'error')
  h.value.refresh(); requests[2].resolve(ok()); await h.settle()
  assert.equal(h.value.account.state, 'loaded')
  h.unmount()
}
console.log('PASS: account restoration, stale response isolation, sign-out, token refresh, retry and stale form submission')

const { authFlowHref, affiliateReturnPath } = await load('lib/auth-flow.ts')
const { trackEvent } = await load('lib/analytics.ts')
const access = await load('lib/affiliate-access.ts', { '@/lib/analytics': { trackEvent }, '@/lib/auth-flow': { authFlowHref } })
const component = name => ({ children }) => React.createElement('div', { 'data-component': name }, children)
const terms = { commission_rate: 20, minimum_payout: 5000, hold_days: 30, cookie_days: 90 }
const auth = { async signOut() { return { error: null } } }
let account; let routes; let events
async function portal(page) {
  const h = hooks(); routes = []; events = []
  const router = { isReady: true, replace(path) { routes.push(path); return Promise.resolve(true) } }
  const { AffiliatePortal } = await load('components/affiliate/AffiliatePortal.tsx', {
    react: h.api, 'next/router': { useRouter: () => router },
    'next/head': { __esModule: true, default: component('head') },
    'next/link': { __esModule: true, default: ({ href, children }) => React.createElement('a', { href }, children) },
    '@/i18n/locale': { canonicalUrl: path => `https://www.enconvo.com${path}` },
    '@/i18n/I18nProvider': { useI18n: () => ({ t: s => s, locale: 'en' }) },
    '@/components/Footer': { Footer: component('footer') }, '@/components/SiteNav': { SiteNav: component('nav') },
    '@/components/landing-styles': { primaryButton: '' },
    '@/lib/affiliate-program': { DEFAULT_TERMS: terms, fetchProgramTerms: async () => ({ ok: true, data: terms }) },
    '@/lib/affiliate-access': { ...access, trackAffiliateAction: (...args) => events.push(args) },
    '@/lib/use-affiliate-account': { useAffiliateAccount: () => ({ account, refresh() {}, updateAffiliate() {} }) },
    '@/lib/supabase': { supabase: { auth } },
    './AffiliateDashboard': { AffiliateDashboard: component('dashboard') },
    './AffiliateLanding': Object.fromEntries(['AffiliateFaq', 'AffiliateHero', 'EarningsCalculator', 'HowItWorks', 'TermsCards'].map(name => [name, component(name)])),
    './ApplicationForm': { ApplicationForm: component('application') },
    './ApplicationStatus': { PendingApplication: component('pending'), RejectedNotice: component('rejected') },
    './Announcement': { TeamMessage: component('message') }, './ui': { card: '', Notice: component('notice') },
  })
  h.mount(() => AffiliatePortal({ page })); await h.settle()
  return { html: renderToStaticMarkup(h.value), h }
}
account = { state: 'loading' }
assert.ok(!(await portal('program')).html.includes('data-component="AffiliateHero"'), 'no promotion flash while restoring a session')
account = { state: 'signed_out' }
let view = await portal('program')
assert.match(view.html, /Already applied\?/)
assert.match(view.html, /href="\/login\?returnUrl=%2Faffiliate%2Fdashboard"/)
assert.match(view.html, /reset_password_send\?returnUrl=%2Faffiliate%2Fdashboard/)
await portal('dashboard'); assert.deepEqual(routes, [access.AFFILIATE_LOGIN])
for (const status of ['approved', 'suspended', 'pending', 'rejected']) {
  account = { state: 'loaded', session: session('partner'), data: { affiliate: { status }, program: terms } }
  view = await portal('program')
  assert.deepEqual(routes, ['/affiliate/dashboard'], status)
  assert.ok(!view.html.includes('data-component="AffiliateHero"'), status)
  view = await portal('dashboard')
  assert.deepEqual(routes, [], status)
  assert.match(view.html, new RegExp(`data-component="${status === 'pending' ? 'pending' : status === 'rejected' ? 'rejected' : 'dashboard'}"`))
  assert.deepEqual(events, [['portal_opened', status]])
  view.h.flush(); assert.equal(events.length, 1, 'rerender does not double-count open')
}
account = { state: 'loaded', session: session('newcomer'), data: { affiliate: null, program: terms } }
await portal('dashboard'); assert.deepEqual(routes, ['/affiliate#apply'])
view = await portal('program'); assert.deepEqual(routes, []); assert.match(view.html, /data-component="application"/)
account = { state: 'error', message: 'offline', expired: false }
view = await portal('program'); assert.ok(!view.html.includes('data-component="AffiliateHero"'))
console.log('PASS: prominent login/reset links, no marketing flash, all four applicant states, direct dashboard access, new applicants and errors')

function nodes(node) {
  if (!node || typeof node !== 'object') return []
  return [node, ...React.Children.toArray(node.props?.children).flatMap(nodes)]
}
const pageRouter = { pathname: '/affiliate' }
const pageModule = await load('pages/affiliate/index.tsx', {
  '@/i18n/server': { withI18nProps: loader => loader },
  '@/components/affiliate/AffiliatePortal': { AffiliatePortal: component('portal') },
  'next/router': { useRouter: () => pageRouter },
})
const dashboardModule = await load('pages/affiliate/dashboard.tsx', {
  '@/i18n/server': { i18nStaticProps() {} }, './index': pageModule,
})
assert.equal(dashboardModule.default, pageModule.default, 'redirect preserves the React component and its loaded account')
const staticPage = await pageModule.getStaticProps()
assert.equal(staticPage.revalidate, 3600, 'license prices in the page refresh hourly')
assert.ok(staticPage.props.renderedAt > 0)
const programPage = pageModule.default(staticPage.props)
assert.equal(programPage.props.page, 'program')
assert.equal(programPage.props.renderedAt, staticPage.props.renderedAt, 'server prices and hydration use the same instant')
pageRouter.pathname = '/affiliate/dashboard'
assert.equal(dashboardModule.default({}).props.page, 'dashboard')
console.log('PASS: automatic redirect retains the loaded portal instead of mounting a second account request')

// Existing browser sessions must enter the portal; native account selection remains intact.
for (const query of [{ returnUrl: '/affiliate/dashboard' }, { from: 'app', source: 'companion' }, { from: 'app', prompt: 'select_account' }]) {
  const h = hooks(); const navigations = []; let opened = 0
  const router = { isReady: true, query, replace(path) { navigations.push(path); return Promise.resolve(true) } }
  const { default: Login } = await load('pages/login.tsx', {
    react: h.api, 'next/router': { useRouter: () => router },
    '@/i18n/server': { i18nStaticProps() {} },
    '@/i18n/I18nProvider': { useI18n: () => ({ t: s => s, locale: 'en' }) },
    '@/lib/auth-flow': { affiliateReturnPath },
    '@/lib/supabase': { supabase: { auth: {
      getSession: async () => ({ data: { session: session('partner') } }),
      getUser: async () => ({ data: { user: session('partner').user } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    } } },
    './components/LoginForm': { __esModule: true, default: component('login') },
    '@/pages/components/LoginSuccess': { __esModule: true, default: component('success') },
    '@/components/LoginAccountChooser': { LoginAccountChooser: component('chooser') },
    '@/utils/app/native_router': { NativeRouter: { async openApp() { opened++; return 'opened' } } },
  })
  h.mount(Login); await h.settle()
  assert.deepEqual(navigations, query.returnUrl ? ['/affiliate/dashboard'] : [])
  assert.equal(opened, query.from === 'app' && !query.prompt ? 1 : 0)
  h.unmount()
}
// Password recovery returns to the portal only after updateUser has succeeded.
for (const fromApp of [false, true]) {
  const h = hooks(); const navigations = []
  const router = { isReady: true, query: { returnUrl: '/affiliate/dashboard', ...(fromApp ? { from: 'app' } : {}) }, replace(path) { navigations.push(path); return Promise.resolve(true) } }
  const ResetForm = component('reset')
  const Login = component('login')
  const { default: Reset } = await load('pages/reset_password.tsx', {
    react: h.api, 'next/router': { useRouter: () => router },
    'next/link': { __esModule: true, default: component('link') },
    '@/i18n/server': { i18nStaticProps() {} },
    '@/i18n/I18nProvider': { useI18n: () => ({ t: s => s }) },
    '@/lib/auth-flow': { affiliateReturnPath },
    './components/ResetPwdForm': { __esModule: true, default: ResetForm },
    './login': { __esModule: true, default: Login },
  })
  h.mount(Reset); assert.deepEqual(navigations, [])
  h.value.props.setLoginState('success'); await h.settle()
  assert.deepEqual(navigations, fromApp ? [] : ['/affiliate/dashboard'])
  if (fromApp) assert.equal(h.value.type, Login)
  h.unmount()
}
console.log('PASS: existing-session portal login, native companion handoff, native account choice and password-reset return')

const { GettingStarted } = await load('components/affiliate/GettingStarted.tsx', {
  '@/i18n/I18nProvider': { useI18n: () => ({ t: s => typeof s === 'string' ? s : String(s), locale: 'en' }) },
  '@/lib/affiliate-program': { formatCents: () => '$50', PAYOUT_METHOD_LABEL: { paypal: 'PayPal', wise: 'Wise' } },
  './ui': { card: '' },
})
const setup = renderToStaticMarkup(React.createElement(GettingStarted, { data: {
  affiliate: { commission_rate: 20 }, program: terms,
}, termsAccepted: true }))
assert.match(setup, /href="#payout"/)
assert.match(setup, /href="#affiliate-kit"/)
assert.ok(!setup.includes('[object Object]'))
console.log('PASS: first steps preserve interactive payout and promotion-kit links')

// A browser-style gtag sink verifies the actual analytics payload, not a mocked capture helper.
const received = []
const server = createServer(async (req, res) => { let body = ''; for await (const part of req) body += part; received.push(JSON.parse(body)); res.end('ok') })
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const pending = []
globalThis.window = { location: { pathname: '/private-partner-email' }, gtag: (...args) => pending.push(fetch(`http://127.0.0.1:${server.address().port}`, { method: 'POST', body: JSON.stringify(args) })) }
for (const action of ['sign_in_clicked', 'password_reset_clicked', 'password_reset_requested', 'password_changed', 'account_switched']) access.trackAffiliateAction(action)
access.trackAffiliateAction('portal_opened', 'approved')
await Promise.all(pending)
assert.equal(received.length, 6)
for (const [type, name, properties] of received) {
  assert.equal(type, 'event'); assert.equal(name, 'website_affiliate_action')
  assert.equal(properties.page_location, 'https://www.enconvo.com/')
  assert.equal(properties.page_title, 'Enconvo'); assert.equal(properties.page_referrer, '')
  assert.equal(properties.page_path, undefined)
  assert.ok(!JSON.stringify(properties).includes('private-partner-email'))
  assert.deepEqual(Object.keys(properties).sort(), ['action', 'page_location', 'page_referrer', 'page_title', 'transport_type', ...(properties.status ? ['status'] : [])].sort())
}
delete globalThis.window
await new Promise(resolve => server.close(resolve))
assert.equal(affiliateReturnPath({ returnUrl: '/affiliate/dashboard' }), '/affiliate/dashboard')
console.log('PASS: six Affiliate analytics actions reach the wire with enums only and no account or URL context')
