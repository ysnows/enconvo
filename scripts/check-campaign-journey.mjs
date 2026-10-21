// Campaign journey checks (CONTEXT.md "Campaign journey"): UTM values, the `enconvo_utm` cookie,
// the steps the website reports to the Worker, Checkout metadata and the cookie route. A fake
// fetch stands in for the Worker; nothing leaves this machine.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'
import { test } from 'node:test'

const root = path.resolve(
  import.meta.dirname || path.dirname(new URL(import.meta.url).pathname),
  '..'
)
const WORKER = 'https://api.enconvo.com'
const VISITOR = '0f6c2a8e3b1d4c5e9a7f1234567890ab'

function load(relative, dependencies = {}, globals = {}) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText
  const exports = {}
  vm.runInNewContext(
    output,
    {
      exports,
      require(name) {
        if (!(name in dependencies))
          throw new Error(`Unexpected dependency: ${name}`)
        return dependencies[name]
      },
      process: { env: {} },
      URL,
      URLSearchParams,
      TextEncoder,
      console: { log() {}, warn() {} },
      ...globals,
    },
    { filename: relative }
  )
  return exports
}

function storage() {
  const values = new Map()
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  }
}

const ok = (data = { recorded: true }) => async () => ({
  ok: true,
  status: 200,
  async json() {
    return { code: 200, data }
  },
})

/** A browser: cookie jar, storage, location and a fetch that records every call. */
function browser({ reply = ok(), cookie = '', pathname = '/', protocol = 'https:' } = {}) {
  let jar = cookie
  const calls = []
  const env = {
    calls,
    localStorage: storage(),
    sessionStorage: storage(),
    location: { protocol, pathname, search: '' },
    document: {
      get cookie() {
        return jar
      },
      set cookie(value) {
        jar = value
      },
      referrer: 'https://github.com/someone/project',
    },
    get jar() {
      return jar
    },
    reply,
    fetch: async (url, init = {}) => {
      calls.push({ url, init: { ...init, signal: undefined }, signal: init.signal })
      // The website's own cookie route answers 204 on the page's origin.
      if (url === '/api/campaign/journey') return { ok: true, status: 204, async json() { return null } }
      return env.reply(url, init)
    },
  }
  const globals = {
    fetch: (...args) => env.fetch(...args),
    AbortSignal,
    JSON,
    Array,
    Uint8Array,
    Date,
    crypto: globalThis.crypto,
    localStorage: env.localStorage,
    sessionStorage: env.sessionStorage,
    location: env.location,
    document: env.document,
  }
  const workerApi = load('src/lib/worker-api.ts', {}, globals)
  env.lib = load('src/lib/campaign-journey.ts', { './worker-api': workerApi }, globals)
  env.globals = globals
  env.worker = (route) => calls.filter((call) => call.url === `${WORKER}${route}`)
  env.body = (route, index = 0) => JSON.parse(env.worker(route)[index].init.body)
  return env
}

test('UTM values are trimmed and lowercased; anything else is left out, and a link needs a source', () => {
  const { lib } = browser()
  assert.equal(lib.utmValue('  GitHub '), 'github')
  assert.equal(lib.utmValue('Sponsor-ProjectX'), 'sponsor-projectx')
  assert.equal(lib.utmValue('赞助 项目'), '赞助 项目')
  assert.equal(lib.utmValue('a/b:c+d_e.f'), 'a/b:c+d_e.f')
  assert.equal(lib.utmValue('x'.repeat(100)), 'x'.repeat(100))
  for (const bad of ['', '   ', '-leading', 'a<b', 'a"b', 'x'.repeat(101), 42, null, undefined])
    assert.equal(lib.utmValue(bad), null, `${bad} is left out`)
  assert.deepEqual(
    { ...lib.campaignUtm(new URLSearchParams('utm_source=GitHub&utm_medium=Sponsorship&utm_campaign=sponsor-x&utm_content=README&utm_term=a<b')) },
    { source: 'github', medium: 'sponsorship', campaign: 'sponsor-x', content: 'readme', term: null }
  )
  assert.equal(lib.campaignUtm(new URLSearchParams('utm_campaign=sponsor-x')), null)
  assert.equal(lib.campaignUtm(new URLSearchParams('utm_source=%3Cscript%3E')), null)
})

test('A UTM visit starts the cookie, keeps its visitor on the next link, and reports only the path and referrer', async () => {
  const env = browser({ pathname: '/' })
  env.location.search = '?utm_source=github&utm_content=readme&token=secret'
  assert.equal(await env.lib.recordCampaignVisit(null), null)
  assert.equal(env.calls.length, 0)

  const utm = env.lib.campaignUtm(new URLSearchParams(env.location.search))
  const visitor = await env.lib.recordCampaignVisit(utm)
  assert.match(visitor, /^[0-9a-f]{32}$/)
  assert.equal(env.jar, `enconvo_utm=${visitor}; Max-Age=7776000; Path=/; SameSite=Lax; Secure`)
  assert.equal(env.calls[0].url, '/api/campaign/journey')
  assert.equal(env.calls[0].init.credentials, 'same-origin')
  assert.deepEqual(env.body('/api/campaign/visit'), {
    visitor,
    source: 'github',
    content: 'readme',
    path: '/',
    referrer: 'https://github.com/someone/project',
  })
  assert.equal(env.localStorage.values.size, 0, 'a recorded visit leaves nothing waiting')

  env.document.cookie = `other=1; enconvo_utm=${visitor}`
  const next = await env.lib.recordCampaignVisit({ source: 'x.com', medium: null, campaign: 'launch', content: null, term: null }, '/use-cases')
  assert.equal(next, visitor, 'the visitor stays across links')
  assert.deepEqual(env.body('/api/campaign/visit', 1), { visitor, source: 'x.com', campaign: 'launch', path: '/use-cases', referrer: 'https://github.com/someone/project' })

  const plain = browser({ protocol: 'http:' })
  await plain.lib.recordCampaignVisit({ source: 'github', medium: null, campaign: null, content: null, term: null })
  assert.doesNotMatch(plain.jar, /Secure/)
})

test('A visit that does not reach the Worker waits and is sent again, until it gets through, is refused, or goes stale', async () => {
  const env = browser({ reply: async () => { throw new Error('offline') } })
  const visitor = await env.lib.recordCampaignVisit({ source: 'github', medium: null, campaign: 'sponsor-x', content: null, term: null })
  const pending = JSON.parse(env.localStorage.getItem('enconvo_utm:pending'))
  assert.equal(pending.visitor, visitor)
  assert.equal(pending.tries, 1)
  assert.equal(pending.campaign, 'sponsor-x')

  env.document.cookie = `enconvo_utm=${visitor}`
  env.reply = ok()
  assert.equal(await env.lib.retryPendingCampaignVisit(), true)
  assert.equal(env.worker('/api/campaign/visit').length, 2)
  assert.equal(env.localStorage.getItem('enconvo_utm:pending'), null)
  assert.equal(await env.lib.retryPendingCampaignVisit(), false, 'nothing left to send')

  // A refusal the Worker explains is final.
  env.reply = async () => { throw new Error('offline') }
  await env.lib.recordCampaignVisit({ source: 'github', medium: null, campaign: null, content: null, term: null })
  env.reply = async () => ({ ok: false, status: 400, async json() { return { code: 400, reason: 'invalid_visit', message: 'no' } } })
  assert.equal(await env.lib.retryPendingCampaignVisit(), false)
  assert.equal(env.localStorage.getItem('enconvo_utm:pending'), null)

  // Stale, tried out, or for another visitor: dropped without a call.
  for (const stale of [
    { visitor, at: Date.now() - 49 * 60 * 60 * 1000, tries: 1 },
    { visitor, at: Date.now(), tries: 10 },
    { visitor: '1'.repeat(32), at: Date.now(), tries: 1 },
  ]) {
    const before = env.calls.length
    env.localStorage.setItem('enconvo_utm:pending', JSON.stringify({ source: 'github', medium: null, campaign: null, content: null, term: null, path: '/', referrer: '', ...stale }))
    env.reply = ok()
    assert.equal(await env.lib.retryPendingCampaignVisit(), false)
    assert.equal(env.calls.length, before)
    assert.equal(env.localStorage.getItem('enconvo_utm:pending'), null)
  }
})

test('Page and download steps go once per tab session and need the cookie; the landing page is the visit', async () => {
  const none = browser()
  none.lib.reportCampaignPage('/pricing')
  none.lib.reportCampaignDownload()
  assert.equal(none.calls.length, 0)

  const env = browser({ pathname: '/' })
  const visitor = await env.lib.recordCampaignVisit({ source: 'github', medium: null, campaign: null, content: null, term: null }, '/')
  env.document.cookie = `enconvo_utm=${visitor}`
  env.lib.reportCampaignPage('/')
  assert.equal(env.worker('/api/campaign/page').length, 0, 'the landing page is counted by its visit')
  env.lib.reportCampaignPage('/pricing')
  env.lib.reportCampaignPage('/pricing')
  env.lib.reportCampaignPage('/use-cases')
  assert.deepEqual(env.worker('/api/campaign/page').map((call) => JSON.parse(call.init.body)), [
    { visitor, path: '/pricing' },
    { visitor, path: '/use-cases' },
  ])
  assert.equal(env.worker('/api/campaign/page')[0].init.keepalive, true)

  env.lib.reportCampaignDownload()
  env.lib.reportCampaignDownload()
  assert.equal(env.worker('/api/campaign/download').length, 1)
  assert.deepEqual(env.body('/api/campaign/download'), { visitor })
  assert.equal(env.worker('/api/campaign/download')[0].init.keepalive, true)
})

test('A session is reported with the access token until the Worker joins it to a visit', async () => {
  const env = browser({ cookie: `enconvo_utm=${VISITOR}`, reply: ok({ recorded: false, joined: false }) })
  await env.lib.reportCampaignSignIn(undefined, 'user-1')
  await env.lib.reportCampaignSignIn('token', undefined)
  assert.equal(env.calls.length, 0)

  await env.lib.reportCampaignSignIn('token', 'user-1')
  await env.lib.reportCampaignSignIn('token', 'user-1')
  assert.equal(env.worker('/api/campaign/sign_in').length, 2, 'not joined yet: reported again')
  assert.equal(env.worker('/api/campaign/sign_in')[0].init.headers.accessToken, 'token')
  assert.deepEqual(env.body('/api/campaign/sign_in'), { visitor: VISITOR })

  env.reply = ok({ recorded: true, event: 'signup', joined: true })
  await env.lib.reportCampaignSignIn('token', 'user-1')
  await env.lib.reportCampaignSignIn('token', 'user-1')
  assert.equal(env.worker('/api/campaign/sign_in').length, 3, 'joined: once per tab session and account')
  await env.lib.reportCampaignSignIn('token', 'user-2')
  assert.equal(env.worker('/api/campaign/sign_in').length, 4)

  const without = browser()
  await without.lib.reportCampaignSignIn('token', 'user-1')
  assert.equal(without.calls.length, 0)
})

test('Checkout metadata names a valid visitor only, and the Checkout step never throws or outlasts its timeout', async () => {
  const { lib } = browser()
  assert.equal(lib.campaignJourneyFrom({ enconvo_utm: VISITOR }), VISITOR)
  for (const cookies of [undefined, {}, { enconvo_utm: 'short' }, { enconvo_utm: `${VISITOR}.via` }, { enconvo_utm: 'a b'.repeat(8) }])
    assert.equal(lib.campaignJourneyFrom(cookies), null)
  assert.deepEqual({ ...lib.campaignMetadata(VISITOR) }, { utm_visitor: VISITOR })
  assert.deepEqual({ ...lib.campaignMetadata(null) }, {})

  const env = browser({ reply: ok({ queued: true }) })
  await env.lib.reportCampaignCheckout('token', null, 'cs_test_1', 'standard')
  await env.lib.reportCampaignCheckout(undefined, VISITOR, 'cs_test_1', 'standard')
  await env.lib.reportCampaignCheckout('token', VISITOR, undefined, 'standard')
  assert.equal(env.calls.length, 0)

  await env.lib.reportCampaignCheckout('token', VISITOR, 'cs_test_1', 'premium')
  assert.deepEqual(env.body('/api/campaign/checkout'), { visitor: VISITOR, session: 'cs_test_1', plan: 'premium' })
  assert.equal(env.worker('/api/campaign/checkout')[0].init.headers.accessToken, 'token')
  assert(env.worker('/api/campaign/checkout')[0].signal, 'bounded by a timeout')

  env.reply = async () => { throw new Error('down') }
  await env.lib.reportCampaignCheckout('token', VISITOR, 'cs_test_2', 'standard')

  // A Worker that never answers: the abort signal ends the wait.
  env.reply = (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason)))
  // AbortSignal.timeout's timer doesn't hold the event loop open, so this one does.
  const keepAlive = setTimeout(() => {}, 5000)
  const started = Date.now()
  await env.lib.reportCampaignCheckout('token', VISITOR, 'cs_test_3', 'standard', 50)
  clearTimeout(keepAlive)
  assert(Date.now() - started < 1000)
})

test('The cookie route sets only a valid visitor again, for 90 days, and answers POST only', () => {
  const lib = browser().lib
  const route = load('src/pages/api/campaign/journey.ts', { '@/lib/campaign-journey': lib })
  const response = () => ({
    headers: {},
    statusCode: 200,
    setHeader(key, value) { this.headers[key] = value },
    status(code) { this.statusCode = code; return this },
    end() { return this },
  })
  const secure = response()
  route.default({ method: 'POST', cookies: { enconvo_utm: VISITOR }, headers: { 'x-forwarded-proto': 'https' } }, secure)
  assert.equal(secure.statusCode, 204)
  assert.equal(secure.headers['Set-Cookie'], `enconvo_utm=${VISITOR}; Max-Age=7776000; Path=/; SameSite=Lax; Secure`)
  assert.equal(secure.headers['Cache-Control'], 'no-store')

  const invalid = response()
  route.default({ method: 'POST', cookies: { enconvo_utm: 'nope; Domain=evil' }, headers: {} }, invalid)
  assert.equal(invalid.statusCode, 204)
  assert.equal(invalid.headers['Set-Cookie'], undefined)

  const get = response()
  route.default({ method: 'GET', cookies: { enconvo_utm: VISITOR }, headers: {} }, get)
  assert.equal(get.statusCode, 405)
})

/** Mount the hook once with a fake React and router, on `url` (pathname + search) of route `pattern`. */
async function mountHook(env, url, pattern) {
  const [pathname, search = ''] = url.split('?')
  env.location.pathname = pathname
  env.location.search = search ? `?${search}` : ''
  const singleton = { pathname: pattern ?? pathname }
  const handlers = {}
  const listeners = { window: {}, document: {} }
  const auth = { listeners: [], session: null }
  const supabase = {
    auth: {
      onAuthStateChange(callback) {
        auth.listeners.push(callback)
        return { data: { subscription: { unsubscribe() {} } } }
      },
      async getSession() {
        return { data: { session: auth.session } }
      },
    },
  }
  const isAppDownloadLink = (href) => href === `${WORKER}/app/download`
  class Element {}
  const hook = load(
    'src/lib/campaign-journey-tracking.ts',
    {
      react: { useEffect: (effect) => { effect() } },
      'next/router': {
        __esModule: true,
        default: singleton,
        useRouter: () => ({ events: { on: (name, fn) => (handlers[name] = fn), off() {} } }),
      },
      '@/lib/affiliate-journey': { isAppDownloadLink },
      '@/lib/campaign-journey': env.lib,
      '@/lib/supabase': { __esModule: true, supabase },
    },
    {
      ...env.globals,
      Promise,
      Element,
      window: {
        location: env.location,
        addEventListener: (name, fn) => (listeners.window[name] = fn),
        removeEventListener() {},
      },
      document: Object.assign(env.document, {
        addEventListener: (name, fn) => (listeners.document[name] = fn),
        removeEventListener() {},
      }),
    }
  )
  hook.useCampaignJourney()
  // Let the visit, the Supabase import and the session report settle.
  const settle = async () => {
    for (let i = 0; i < 20; i++) await new Promise((resolve) => setImmediate(resolve))
  }
  await settle()
  return {
    singleton,
    auth,
    settle,
    navigate: async (next, nextPattern) => {
      const [p, s = ''] = next.split('?')
      env.location.pathname = p
      env.location.search = s ? `?${s}` : ''
      singleton.pathname = nextPattern ?? p
      handlers.routeChangeComplete(next)
      await settle()
    },
    click: (href) => {
      const link = new Element()
      link.getAttribute = () => href
      const target = new Element()
      target.closest = () => link
      listeners.document.click({ target })
    },
  }
}

test('The hook records a UTM landing, then page steps by route pattern, downloads and the session', async () => {
  const env = browser({ reply: ok({ recorded: true, joined: true }) })
  // The page wrote the cookie as a browser would keep it: name=value only.
  const write = Object.getOwnPropertyDescriptor(env.document, 'cookie').set
  Object.defineProperty(env.document, 'cookie', {
    get: () => env.jar.split(';')[0],
    set: write,
  })
  const page = await mountHook(env, '/?utm_source=GitHub&utm_campaign=Sponsor-X&utm_content=readme')
  const visitor = env.body('/api/campaign/visit').visitor
  assert.deepEqual(env.body('/api/campaign/visit'), {
    visitor,
    source: 'github',
    campaign: 'sponsor-x',
    content: 'readme',
    path: '/',
    referrer: 'https://github.com/someone/project',
  })
  assert.equal(env.worker('/api/campaign/page').length, 0)

  page.auth.session = { access_token: 'token', user: { id: 'user-1' } }
  await page.navigate('/pricing')
  // The same route again in this tab, and a dynamic route that carries a code.
  await page.navigate('/pricing')
  await page.navigate('/redeem/SECRET-CODE', '/redeem/[code]')
  assert.deepEqual(env.worker('/api/campaign/page').map((call) => JSON.parse(call.init.body).path), ['/pricing', '/redeem/[code]'])
  assert.equal(JSON.stringify(env.calls).includes('SECRET-CODE'), false)

  page.auth.listeners[0]('SIGNED_IN', { access_token: 'token', user: { id: 'user-1' } })
  await page.settle()
  assert.equal(env.worker('/api/campaign/sign_in').length, 1)

  page.click(`${WORKER}/app/download`)
  page.click('https://www.enconvo.com/pricing')
  assert.equal(env.worker('/api/campaign/download').length, 1)
})

test('The hook records no visit on sign-in and private pages, but still reports the session there', async () => {
  const env = browser({ cookie: `enconvo_utm=${VISITOR}`, reply: ok({ recorded: true, joined: true }) })
  const page = await mountHook(env, '/login?from=app&utm_source=app')
  assert.equal(env.worker('/api/campaign/visit').length, 0)
  assert.deepEqual(env.worker('/api/campaign/page').map((call) => JSON.parse(call.init.body).path), ['/login'])
  page.auth.listeners[0]('SIGNED_IN', { access_token: 'token', user: { id: 'user-9' } })
  await page.settle()
  assert.deepEqual(env.body('/api/campaign/sign_in'), { visitor: VISITOR })

  for (const url of ['/zh-CN/register?utm_source=x', '/auth/callback?utm_source=x', '/share/abc?utm_source=x']) {
    const fresh = browser()
    await mountHook(fresh, url)
    assert.equal(fresh.calls.length, 0, `${url} starts no journey`)
  }

  // A browser without a journey loads nothing and reports nothing.
  const plain = browser()
  await mountHook(plain, '/pricing')
  assert.equal(plain.calls.length, 0)
})
