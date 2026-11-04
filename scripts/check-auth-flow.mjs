import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const source = await readFile(new URL('../src/lib/auth-flow.ts', import.meta.url), 'utf8')
const module = { exports: {} }
new Function('module', 'exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(module, module.exports)
const { authFlowHref, oauthCallbackUrl, affiliateReturnPath, emailLinkDestination } = module.exports
const query = { from: 'app', source: 'companion', handoff: 'a+b&c', language: 'zh-CN', returnUrl: '/account?a=b', access_token: 'secret', irrelevant: 'omit' }
for (const path of ['/login', '/register', '/reset_password_send']) {
  const url = new URL(authFlowHref(path, query), 'https://enconvo.com')
  assert.equal(url.pathname, path)
  for (const key of ['from', 'source', 'handoff', 'language', 'returnUrl']) assert.equal(url.searchParams.get(key), query[key])
  assert.equal(url.searchParams.has('access_token'), false)
  assert.equal(url.searchParams.has('irrelevant'), false)
}
assert.equal(authFlowHref('/login', {}), '/login')
// Google comes back to /auth/callback with the app to open, so the iPhone sign-in returns to the app.
const callback = new URL(oauthCallbackUrl('https://www.enconvo.com', { ...query, source: ['companion', 'desktop'] }, 'ja'))
assert.equal(callback.origin + callback.pathname, 'https://www.enconvo.com/auth/callback')
assert.equal(callback.searchParams.get('language'), 'ja')
for (const key of ['from', 'source', 'handoff', 'returnUrl']) assert.equal(callback.searchParams.get(key), query[key])
assert.equal(callback.searchParams.has('access_token'), false)
assert.equal(new URL(oauthCallbackUrl('https://www.enconvo.com', { returnUrl: 'https://evil.example' }, 'en')).searchParams.has('returnUrl'), false)
assert.equal(oauthCallbackUrl('https://www.enconvo.com', {}, 'en'), 'https://www.enconvo.com/auth/callback?language=en')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
let router = { isReady: true, query: { source: 'companion' } }
async function loadForm(name) {
  const source = await readFile(new URL(`../src/pages/components/${name}.tsx`, import.meta.url), 'utf8')
  const module = { exports: {} }
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const passthrough = ({ children }) => React.createElement('div', {}, children)
  const mocks = {
    'next/router': { useRouter: () => router },
    'next/head': { default: passthrough, __esModule: true },
    'next/link': { default: passthrough, __esModule: true },
    '@/i18n/I18nProvider': { useI18n: () => ({ t: s => s, locale: 'en' }) },
    '@/i18n/server': { i18nStaticProps: () => ({}) },
    '@/components/ui/input': { Input: ({type, name, placeholder}) => React.createElement('input', {type, name, placeholder}) },
    '@/lib/auth-flow': { authFlowHref, oauthCallbackUrl, affiliateReturnPath },
    '@supabase/auth-helpers-nextjs': { createClientComponentClient: () => ({ auth: {} }) },
  }
  new Function('require', 'module', 'exports', compiled)(name => mocks[name] ?? (name.startsWith('@/') ? new Proxy({}, { get: () => passthrough }) : require(name)), module, module.exports)
  return module.exports.default
}
for (const name of ['LoginForm', 'RegisterForm']) {
  const Form = await loadForm(name)
  for (const state of [{ isReady: false, query: {} }, { isReady: true, query: { source: 'companion' } }, { isReady: true, query: { source: 'desktop' } }, { isReady: true, query: { returnUrl: '/affiliate/dashboard' } }]) {
    router = state
    const html = renderToStaticMarkup(React.createElement(Form, { loginState: '', setLoginState() {}, setUser() {}, email: '', setEmail() {} }))
    // Google sign-in is offered everywhere, the iPhone and Android apps included.
    assert.equal(html.includes('Continue with Google'), true, `${name} Google availability`)
    // The login page offers Apple above Google (ADR 0216).
    if (name === 'LoginForm') assert.ok(html.indexOf('Continue with Apple') >= 0 && html.indexOf('Continue with Apple') < html.indexOf('Continue with Google'), 'Apple above Google')
    assert.match(html, /email/i)
    if (name === 'LoginForm' && state.query.returnUrl) {
      assert.match(html, /Affiliate sign in/)
      assert.match(html, /same password/)
    }
  }
}
for (const path of ['/affiliate', '/affiliate#apply', '/affiliate/dashboard', '/affiliate/dashboard?tab=commissions'])
  assert.equal(affiliateReturnPath({ returnUrl: path }), path)
for (const path of ['//evil.example', '/affiliate-evil', '/affiliate/terms', '/affiliate/dashboard/evil', '/\\evil.example', '/affiliate?x=\n', 'https://evil.example/affiliate'])
  assert.equal(affiliateReturnPath({ returnUrl: path }), null)
assert.equal(affiliateReturnPath({ returnUrl: ['/affiliate/dashboard', 'https://evil.example'] }), '/affiliate/dashboard')
// The email link (/auth/confirm) continues to the redirect the sign-up asked for, on this site only.
const site = 'https://www.enconvo.com'
const appLogin = `${site}/login?from=app&source=guide&handoff=exchange&language=de`
const encoded = `?token_hash=pkce_abc&type=signup&redirect_to=${encodeURIComponent(appLogin)}`
assert.equal(emailLinkDestination(encoded, site), '/login?from=app&source=guide&handoff=exchange&language=de')
// Pasted from the email's text, the redirect's query arrives unescaped and split into the link's own.
assert.equal(emailLinkDestination(`?token_hash=pkce_abc&type=signup&redirect_to=${appLogin}`, site), '/login?from=app&source=guide&handoff=exchange&language=de')
const offer = `${site}/auth/callback?returnUrl=%2Fltd%3Fplan%3Dpro&language=ja`
assert.equal(new URL(emailLinkDestination(`?type=signup&redirect_to=${encodeURIComponent(offer)}`, site), site).searchParams.get('returnUrl'), '/ltd?plan=pro')
assert.equal(emailLinkDestination(`?type=recovery&redirect_to=${encodeURIComponent(`${site}/reset_password?language=fr`)}`, site), '/reset_password?language=fr')
for (const redirect of ['https://evil.example/login', '//evil.example/login', '/\\evil.example', `${site}//evil.example/login`, `${site}/\\evil.example`, 'javascript:alert(1)', site, `${site}/`, ''])
  assert.equal(emailLinkDestination(`?token_hash=x&type=signup&redirect_to=${encodeURIComponent(redirect)}`, site), '/login')
assert.equal(emailLinkDestination('?token_hash=x&type=recovery&redirect_to=https%3A%2F%2Fevil.example', site), '/reset_password')
assert.equal(emailLinkDestination('', site), '/login')
// A sign-up the app opened keeps its hand-off through the email: RegisterForm's emailRedirectTo
// becomes {{ .RedirectTo }}, which Supabase percent-encodes into the link's redirect_to.
const appSignup = { from: 'app', source: 'settings', handoff: 'exchange', version: '2.5.11', client_id: 'device' }
const redirectTo = `${site}${authFlowHref('/login', { ...appSignup, language: 'ko' })}`
const landing = new URL(emailLinkDestination(`?token_hash=pkce_abc&type=signup&redirect_to=${encodeURIComponent(redirectTo)}`, site), site)
assert.equal(landing.pathname, '/login')
for (const [key, value] of Object.entries({ from: 'app', source: 'settings', handoff: 'exchange', language: 'ko' })) assert.equal(landing.searchParams.get(key), value)
// A sign-up made on the website alone is not sent to the app.
assert.equal(new URL(`${site}${authFlowHref('/login', { language: 'en' })}`).searchParams.has('from'), false)
// Sign in with Apple (lib/apple-sign-in): the login page's query waits in the tab while Apple's
// page is open, and the handoff code is redeemed once with only itself in the request.
const appleSource = await readFile(new URL('../src/lib/apple-sign-in.ts', import.meta.url), 'utf8')
const apple = { exports: {} }
new Function('require', 'module', 'exports', ts.transpileModule(appleSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(
  name => name === '@/lib/worker-api' ? { WORKER_API_ORIGIN: 'https://api.enconvo.com' } : require(name), apple, apple.exports)
const { appleStartUrl, saveAppleSignInContext, readAppleSignInContext, clearAppleSignInContext, appleContextQuery, appleLoginPath, appleSignInProblem, redeemAppleHandoff, deleteNewAppleAccount, appleReturnParams } = apple.exports
assert.equal(appleStartUrl(), 'https://api.enconvo.com/auth/v1/apple/start?to=web')
// The Worker's answer comes in the fragment, which no server logs; the query still reads for the old return.
for (const [search, hash, handoff, error] of [['', '#handoff=abc', 'abc', null], ['?handoff=old', '', 'old', null], ['', '#error=cancelled', null, 'cancelled'], ['?error=failed', '#handoff=new', 'new', 'failed']]) {
  globalThis.window = { location: { search, hash } }
  const params = appleReturnParams()
  assert.equal(params.get('handoff'), handoff, search + hash)
  assert.equal(params.get('error'), error, search + hash)
}
delete globalThis.window
const tab = new Map()
globalThis.sessionStorage = { getItem: k => tab.get(k) ?? null, setItem: (k, v) => tab.set(k, String(v)), removeItem: k => tab.delete(k) }
const appSearch = '?from=app&source=companion&handoff=exchange&prompt=select_account&returnUrl=%2Faccount'
saveAppleSignInContext(appSearch, 'ja', 1_000_000)
const saved = readAppleSignInContext(1_000_000 + 60_000)
assert.deepEqual(saved, { search: appSearch, locale: 'ja', startedAt: 1_000_000 })
assert.deepEqual(appleContextQuery(saved), { from: 'app', source: 'companion', handoff: 'exchange', prompt: 'select_account', returnUrl: '/account' })
assert.equal(appleLoginPath(saved), `/login${appSearch}`)
assert.equal(appleLoginPath(null), '/login')
assert.deepEqual(appleContextQuery(null), {})
// Another visit's context, or none, restores nothing.
assert.equal(readAppleSignInContext(1_000_000 + 31 * 60_000), null)
clearAppleSignInContext()
assert.equal(readAppleSignInContext(1_000_000), null)
tab.set('enconvo:apple-sign-in', '{not json')
assert.equal(readAppleSignInContext(), null)
saveAppleSignInContext('', 'en', 5)
assert.equal(appleLoginPath(readAppleSignInContext(10)), '/login')
globalThis.sessionStorage = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') }, removeItem() { throw new Error('blocked') } }
saveAppleSignInContext(appSearch, 'en')
assert.equal(readAppleSignInContext(), null)
clearAppleSignInContext()
delete globalThis.sessionStorage
for (const [reason, problem] of [['cancelled', 'cancelled'], ['unavailable', 'unavailable'], ['signin_unavailable', 'unavailable'], ['account_blocked', 'blocked'], ['handoff_invalid', 'expired'],
  ['failed', 'failed'], ['token_invalid', 'failed'], ['nonce_mismatch', 'failed'], ['email_unverified', 'failed'], ['account_unavailable', 'failed'], ['network_error', 'failed'], ['', 'failed']])
  assert.equal(appleSignInProblem(reason), problem, reason)
const code = 'A'.repeat(43)
const requests = []
const answer = (status, body) => async (url, init) => { requests.push({ url, init }); return { ok: status < 300, status, json: async () => body } }
const fetchBefore = globalThis.fetch
try {
  globalThis.fetch = answer(200, { accessToken: 'access', refreshToken: 'refresh', created: true, hiddenEmail: true })
  assert.deepEqual(await redeemAppleHandoff(code, true), { ok: true, session: { accessToken: 'access', refreshToken: 'refresh', created: true, hiddenEmail: true } })
  assert.equal(requests[0].url, 'https://api.enconvo.com/auth/v1/handoff')
  assert.equal(requests[0].init.method, 'POST')
  assert.deepEqual(JSON.parse(requests[0].init.body), { code })
  assert.equal('analytics' in requests[0].init.headers, false)
  globalThis.fetch = answer(410, { error: 'this sign-in expired; sign in again', code: 'handoff_invalid' })
  assert.deepEqual(await redeemAppleHandoff(code, false), { ok: false, reason: 'handoff_invalid' })
  assert.equal(requests[1].init.headers.analytics, 'off')
  globalThis.fetch = answer(200, { accessToken: 'access' })
  assert.deepEqual(await redeemAppleHandoff(code, true), { ok: false, reason: 'failed' })
  globalThis.fetch = async () => { throw new TypeError('offline') }
  assert.deepEqual(await redeemAppleHandoff(code, true), { ok: false, reason: 'network_error' })
  // "Use my existing account" removes the new account through the Worker's deletion, confirmed and signed.
  requests.length = 0
  globalThis.fetch = answer(200, { deleted: true })
  assert.equal(await deleteNewAppleAccount('access'), true)
  assert.equal(requests[0].url, 'https://api.enconvo.com/user/account/delete')
  assert.equal(requests[0].init.method, 'POST')
  assert.deepEqual(JSON.parse(requests[0].init.body), { confirmation: 'DELETE' })
  assert.equal(requests[0].init.headers.Authorization, 'Bearer access')
  assert.deepEqual(Object.keys(requests[0].init.headers).sort(), ['Authorization', 'Content-Type'])
  globalThis.fetch = answer(200, {})
  assert.equal(await deleteNewAppleAccount('access'), false)
  globalThis.fetch = answer(401, { error: 'Sign in again to delete your account.' })
  assert.equal(await deleteNewAppleAccount('access'), false)
  globalThis.fetch = async () => { throw new TypeError('offline') }
  assert.equal(await deleteNewAppleAccount('access'), false)
} finally {
  globalThis.fetch = fetchBefore
}
console.log('PASS: Google auth on iPhone and desktop, OAuth callback keeps the app return, email links continue on this site, native return navigation and token omission, Apple above Google with its sign-in context, single handoff and new-account removal')
