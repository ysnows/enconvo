import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

// Tests swap in a fake Worker; the analytics sink needs the real network.
const realFetch = globalThis.fetch

// Welcome offer (`/?offer=<slug>`, homepage only): cookie and slug rules, claim answers and
// the popup they open, the auto-claim flow and its analytics, and the sign-up return path.
// The Worker, Supabase and GA4 are local fakes; no real account or api.enconvo.com route is
// touched. The slug here is a made-up token; real ones are never written into the site.

async function loadTs(path, mocks = {}) {
  const url = new URL(path, import.meta.url)
  const { outputText } = ts.transpileModule(await readFile(url, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  })
  const module = { exports: {} }
  const requireFromFile = createRequire(url)
  new Function('require', 'module', 'exports', outputText)(
    (name) => (Object.hasOwn(mocks, name) ? mocks[name] : requireFromFile(name)),
    module,
    module.exports
  )
  return module.exports
}

const settle = async () => {
  for (let i = 0; i < 10; i++) await new Promise((resolve) => setImmediate(resolve))
}

/** A browser with a cookie jar, localStorage, the address bar's query and the tab's visibility. */
function browser({ search = '', cookie = '', dismissed = null, storageThrows = false, visibility = 'visible' } = {}) {
  const jar = new Map()
  const writes = []
  const visibilityListeners = new Set()
  globalThis.document = {
    visibilityState: visibility,
    addEventListener: (type, listener) => type === 'visibilitychange' && visibilityListeners.add(listener),
    removeEventListener: (type, listener) => visibilityListeners.delete(listener),
    get cookie() {
      return [...jar].map(([key, value]) => `${key}=${value}`).join('; ')
    },
    set cookie(value) {
      writes.push(value)
      const [pair, ...attributes] = value.split(';').map((part) => part.trim())
      const [key, ...rest] = pair.split('=')
      if (attributes.includes('Max-Age=0')) jar.delete(key)
      else jar.set(key, rest.join('='))
    },
  }
  if (cookie) document.cookie = cookie
  const storage = new Map(dismissed ? [['enconvo_welcome_offer_dismissed', JSON.stringify(dismissed)]] : [])
  globalThis.localStorage = {
    getItem: (key) => {
      if (storageThrows) throw new Error('blocked')
      return storage.has(key) ? storage.get(key) : null
    },
    setItem: (key, value) => {
      if (storageThrows) throw new Error('blocked')
      storage.set(key, String(value))
    },
  }
  globalThis.window = { location: { protocol: 'https:', search, pathname: '/' } }
  return {
    jar,
    writes,
    storage,
    /** The tab goes to the background or comes back. */
    setVisibility(state) {
      document.visibilityState = state
      visibilityListeners.forEach((listener) => listener())
    },
  }
}

/** The Web Locks API: one holder per name at a time, the others queue (shared by every tab). */
function installLocks() {
  const tails = new Map()
  const locks = {
    request(name, task) {
      const run = (tails.get(name) ?? Promise.resolve()).then(() => task({ name }))
      tails.set(name, run.catch(() => {}))
      return run
    },
  }
  Object.defineProperty(globalThis, 'navigator', { value: { locks }, configurable: true, writable: true })
  return () => Object.defineProperty(globalThis, 'navigator', { value: realNavigator, configurable: true, writable: true })
}
const realNavigator = globalThis.navigator

const INFO = {
  offer: 'fake0offer0token',
  status: 'active',
  valid: true,
  plan: 'plus',
  days: 14,
  points: 250000,
  usd: 5,
  ends_at: null,
}
// The Worker's answer before every account could claim: the extra field is ignored.
const LIVE_INFO = { ...INFO, signup_window_days: 7 }
const CLAIM = { offer: 'fake0offer0token', plan: 'plus', days: 14, points: 250000, usd: 5, balance: 250000, ends_at: '2026-11-02T08:00:00.000Z', already_claimed: false }

/** A Worker fake: `claim` is a list of [status, body] answers, the last one repeating. */
function worker({ info = [200, { code: 200, data: INFO }], claim = [[200, { code: 200, data: CLAIM }]], infoGate = null, claimGate = null } = {}) {
  const requests = []
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url, init })
    let answer
    if (url.includes('/api/welcome_offer/offer/')) {
      await infoGate
      answer = info
    }
    else if (url.endsWith('/api/welcome_offer/claim')) {
      answer = claim[Math.min(requests.filter((r) => r.url.endsWith('/claim')).length - 1, claim.length - 1)]
      await claimGate
    }
    if (answer === 'network') throw new TypeError('fetch failed')
    const [status, body] = answer ?? [404, {}]
    return { ok: status >= 200 && status < 300, status, json: async () => body }
  }
  return {
    requests,
    claims: () => requests.filter((request) => request.url.endsWith('/api/welcome_offer/claim')),
  }
}

const { locales } = JSON.parse(await readFile(new URL('../src/i18n/config.json', import.meta.url), 'utf8'))

async function loadOffer(events, analytics) {
  const workerApi = await loadTs('../src/lib/worker-api.ts')
  return loadTs('../src/lib/welcome-offer.ts', {
    '@/i18n/locale': { locales },
    '@/lib/analytics': analytics ?? { trackEvent: (...args) => events.push(args) },
    '@/lib/worker-api': workerApi,
  })
}

/** Next's singleton router, for its route-change events. */
function fakeRouter() {
  const listeners = []
  const router = { events: { on: (_, fn) => listeners.push(fn), off() {} } }
  return { router, listeners, module: { __esModule: true, default: router } }
}

/** The `_app` hook with a fake Supabase session, on the page whose address-bar path is `pathname`. */
async function loadFlow({ session = null, analytics, pathname = '/' } = {}) {
  window.location.pathname = pathname
  const events = []
  const offer = await loadOffer(events, analytics)
  const listeners = []
  const auth = { session }
  const supabase = {
    auth: {
      onAuthStateChange: (callback) => {
        listeners.push(callback)
        return { data: { subscription: { unsubscribe() {} } } }
      },
      getSession: async () => ({ data: { session: auth.session } }),
    },
  }
  const route = fakeRouter()
  const flow = await loadTs('../src/lib/welcome-offer-auto-claim.ts', {
    react: { useEffect: (effect) => effect() },
    'next/router': route.module,
    '@/lib/analytics': analytics ?? { trackEvent: (...args) => events.push(args) },
    '@/lib/welcome-offer': offer,
    '@/lib/supabase': { supabase },
  })
  return {
    offer,
    flow,
    events,
    auth,
    emit: (event, next) => {
      auth.session = next
      listeners.forEach((callback) => callback(event, next))
    },
    navigate: (search, path = '/') => {
      window.location.pathname = path
      window.location.search = search
      route.listeners.forEach((fn) => fn())
    },
  }
}

const user = (id, email = `${id}@example.test`) => ({ access_token: `token-${id}`, user: { id, email } })

test('slugs, return paths and the offer query', async () => {
  const offer = await loadOffer([])
  for (const [raw, slug] of [
    ['fake0offer0token', 'fake0offer0token'],
    [' Fake0Offer0Token ', 'fake0offer0token'],
    ['spring-2027_b', 'spring-2027_b'],
    ['a', ''],
    ['-welcome', ''],
    ['fake0offer0token/../x', ''],
    ['fake offer', ''],
    ['x'.repeat(49), ''],
    [null, ''],
    [['fake0offer0token'], ''],
  ])
    assert.equal(offer.normalizeOfferSlug(raw), slug, String(raw))
  assert.equal(offer.offerFromSearch('?utm_source=x&offer=FAKE0OFFER0TOKEN'), 'fake0offer0token')
  assert.equal(offer.offerFromSearch('?returnUrl=%2F%3Foffer%3Dfake0offer0token'), '')
  assert.equal(offer.offerFromSearch(''), '')
  // Only the homepage takes the link, so sign-up returns only there.
  for (const path of ['/?offer=fake0offer0token', '/?utm_source=x&offer=fake0offer0token#pricing'])
    assert.equal(offer.offerReturnPath(path), path)
  for (const path of ['/use-cases?a=1&offer=fake0offer0token', '/ja/changelog?offer=spring-2027', '//evil.example/?offer=fake0offer0token', 'https://evil.example/?offer=fake0offer0token', '/\\evil.example?offer=fake0offer0token', '/?offer=', '/?offer=a', '/account', '/?x=\n&offer=fake0offer0token', '/#offer=fake0offer0token', undefined, ['/?offer=fake0offer0token']])
    assert.equal(offer.offerReturnPath(path), null, String(path))
  assert.equal(offer.offerHomePath('fake0offer0token'), '/?offer=fake0offer0token')
  // The homepage in every language takes the link; no other page does.
  for (const pathname of ['/', '/ja', '/zh-CN', '/zh-cn', '/zh-TW/', '/en', '/pl'])
    assert.equal(offer.isOfferLanding(pathname), true, pathname)
  for (const pathname of ['/pricing', '/blog/x', '/ja/pricing', '/ja/blog/x', '/use-cases', '/register', '/login', '/404', '/jabber', '/zh', '/en/cloud-pricing'])
    assert.equal(offer.isOfferLanding(pathname), false, pathname)
})

test('the cookie is first-party, 7 days, SameSite=Lax, and clears', async () => {
  const offer = await loadOffer([])
  const { writes } = browser()
  assert.equal(offer.readOfferCookie(), '')
  offer.writeOfferCookie('fake0offer0token')
  assert.equal(writes.at(-1), 'enconvo_offer=fake0offer0token; Path=/; Max-Age=604800; SameSite=Lax; Secure')
  assert.equal(offer.readOfferCookie(), 'fake0offer0token')
  offer.writeOfferCookie('../bad slug')
  assert.equal(writes.length, 1, 'an invalid slug is never written')
  offer.clearOfferCookie()
  assert.equal(writes.at(-1), 'enconvo_offer=; Path=/; Max-Age=0; SameSite=Lax; Secure')
  assert.equal(offer.readOfferCookie(), '')
  browser({ cookie: 'enconvo_offer=%E0%A4%A' })
  assert.equal(offer.readOfferCookie(), '', 'a malformed cookie reads as none')
  browser({ cookie: 'enconvo_offer=FAKE0OFFER0TOKEN' })
  assert.equal(offer.readOfferCookie(), 'fake0offer0token')
  window.location.protocol = 'http:'
  offer.writeOfferCookie('fake0offer0token')
  assert.doesNotMatch(document.cookie, /Secure/)
})

test('dismissals are per slug and survive blocked storage', async () => {
  const offer = await loadOffer([])
  const { storage } = browser()
  assert.equal(offer.isOfferDismissed('fake0offer0token'), false)
  offer.dismissOffer('fake0offer0token')
  offer.dismissOffer('spring')
  offer.dismissOffer('fake0offer0token')
  assert.deepEqual(JSON.parse(storage.get('enconvo_welcome_offer_dismissed')), ['fake0offer0token', 'spring'])
  assert.equal(offer.isOfferDismissed('fake0offer0token'), true)
  assert.equal(offer.isOfferDismissed('other'), false)
  for (let i = 0; i < 30; i++) offer.dismissOffer(`slug-${i}`)
  assert.equal(JSON.parse(storage.get('enconvo_welcome_offer_dismissed')).length, 20)
  browser({ storageThrows: true })
  assert.equal(offer.isOfferDismissed('fake0offer0token'), false)
  assert.doesNotThrow(() => offer.dismissOffer('fake0offer0token'))
  browser()
  localStorage.setItem('enconvo_welcome_offer_dismissed', '{not json')
  assert.equal(offer.isOfferDismissed('fake0offer0token'), false)
})

test('claim answers map to the popup step', async () => {
  const offer = await loadOffer([])
  browser()
  const cases = [
    [[200, { code: 200, data: CLAIM }], { step: 'claimed', claim: CLAIM }],
    [[401, { code: 401, reason: 'unauthorized', message: 'Sign in' }], { step: 'failed', signIn: true }],
    [[500, { code: 500, reason: 'server_error', message: 'x' }], { step: 'failed', signIn: false }],
    [[502, '<html>'], { step: 'failed', signIn: false }],
    [[429, { code: 429, reason: 'rate_limited', message: 'x' }], { step: 'failed', signIn: false }],
    ['network', { step: 'failed', signIn: false }],
    [[404, {}], { step: 'failed', signIn: false }],
    [[404, { code: 404, reason: 'offer_not_found', message: 'x' }], { step: 'refused', reason: 'offer_not_found' }],
    [[403, { code: 403, reason: 'offer_not_started', message: 'x' }], { step: 'refused', reason: 'offer_not_started' }],
    [[410, { code: 410, reason: 'offer_ended', message: 'x' }], { step: 'refused', reason: 'offer_ended' }],
    // Account-age and earlier-trial refusals are retired; an older Worker's answer reads as unavailable.
    [[403, { code: 403, reason: 'not_new_account', message: 'x' }], { step: 'refused', reason: 'unavailable' }],
    [[409, { code: 409, reason: 'already_used_one', message: 'x' }], { step: 'refused', reason: 'unavailable' }],
    [[409, { code: 409, reason: 'already_subscribed', message: 'x' }], { step: 'refused', reason: 'already_subscribed' }],
    [[409, { code: 409, reason: 'other_code_open', message: 'x' }], { step: 'refused', reason: 'other_code_open' }],
    [[403, { code: 403, reason: 'brand_new_reason', message: 'x' }], { step: 'refused', reason: 'unavailable' }],
  ]
  for (const [answer, view] of cases) {
    worker({ claim: [answer] })
    assert.deepEqual(offer.claimView(await offer.postWelcomeOfferClaim('token', 'fake0offer0token')), view, JSON.stringify(answer))
  }
  assert.deepEqual(offer.REFUSAL_REASONS, ['already_subscribed', 'offer_ended', 'offer_not_found', 'offer_not_started', 'other_code_open'])
  for (const reason of [...offer.REFUSAL_REASONS, 'unavailable']) {
    const copy = offer.refusalCopy(reason)
    assert.ok(copy.title && copy.body, reason)
    // Every account may claim once, so no refusal speaks of new accounts.
    assert.doesNotMatch(`${copy.title} ${copy.body}`, /new account|newly|created|\{days\}/i, reason)
  }
})

test('claims share one request, clear the cookie only on a final answer, and record it once', async () => {
  const events = []
  const offer = await loadOffer(events)
  browser({ cookie: 'enconvo_offer=fake0offer0token' })
  const api = worker()
  const [first, second] = await Promise.all([offer.claimOffer('token-a', 'fake0offer0token', 'auto'), offer.claimOffer('token-a', 'fake0offer0token', 'auto')])
  assert.equal(first, second)
  assert.equal(api.claims().length, 1)
  const [{ init }] = api.claims()
  assert.equal(init.method, 'POST')
  assert.equal(init.headers.accessToken, 'token-a')
  assert.deepEqual(JSON.parse(init.body), { offer: 'fake0offer0token' })
  assert.ok(init.signal instanceof AbortSignal, 'the claim gives up after a while')
  assert.equal(offer.readOfferCookie(), '')
  assert.equal(offer.isOfferDismissed('fake0offer0token'), true)
  assert.equal(offer.hasClaimOutcome('fake0offer0token'), true)
  assert.deepEqual(events, [['welcome_offer_claimed', { offer: 'fake0offer0token', already_claimed: false, trigger: 'auto' }, { includePagePath: false }]])

  for (const [answer, kept] of [
    [[500, { code: 500, reason: 'server_error', message: 'x' }], true],
    ['network', true],
    [[401, { code: 401, reason: 'unauthorized', message: 'x' }], true],
    [[409, { code: 409, reason: 'already_subscribed', message: 'x' }], false],
  ]) {
    events.length = 0
    const fresh = await loadOffer(events)
    browser({ cookie: 'enconvo_offer=fake0offer0token' })
    worker({ claim: [answer] })
    await fresh.claimOffer('token-a', 'fake0offer0token', 'button')
    assert.equal(fresh.readOfferCookie() === 'fake0offer0token', kept, JSON.stringify(answer))
    assert.equal(fresh.hasClaimOutcome('fake0offer0token'), !kept)
    assert.deepEqual(events, kept ? [] : [['welcome_offer_refused', { offer: 'fake0offer0token', reason: 'already_subscribed', trigger: 'button' }, { includePagePath: false }]])
  }
})

test('a signed-out visit keeps the slug and offers sign-up; a real sign-in claims it', async () => {
  browser({ search: '?offer=Fake0Offer0Token' })
  const api = worker()
  const { offer, flow, events, emit } = await loadFlow()
  flow.useWelcomeOfferAutoClaim()
  await settle()
  assert.equal(offer.readOfferCookie(), 'fake0offer0token')
  assert.deepEqual(offer.getWelcomeOfferState(), { slug: 'fake0offer0token', info: INFO, signedIn: false, email: null, view: { step: 'offer' } })
  assert.deepEqual(events, [['welcome_offer_viewed', { offer: 'fake0offer0token', signed_in: false }, { includePagePath: false }]])
  assert.equal(api.claims().length, 0)

  // The page closes it for sign-up, then the sign-in arrives.
  flow.leaveWelcomeOffer()
  emit('SIGNED_IN', user('new'))
  await settle()
  assert.equal(api.claims().length, 1)
  assert.equal(api.claims()[0].init.headers.accessToken, 'token-new')
  const state = offer.getWelcomeOfferState()
  assert.equal(state.view.step, 'claimed')
  assert.equal(state.email, 'new@example.test')
  assert.equal(offer.readOfferCookie(), '')
  assert.deepEqual(events.at(-1), ['welcome_offer_claimed', { offer: 'fake0offer0token', already_claimed: false, trigger: 'auto' }, { includePagePath: false }])

  // Back on the campaign link after the sign-in: the answer stays, no second claim or view.
  emit('SIGNED_IN', user('new'))
  await settle()
  assert.equal(api.claims().length, 1)
})

test('a visitor already signed in gets one Claim click, not an automatic claim', async () => {
  browser({ search: '?offer=fake0offer0token' })
  const api = worker()
  const { offer, flow, events, emit } = await loadFlow({ session: user('old') })
  flow.useWelcomeOfferAutoClaim()
  await settle()
  assert.equal(offer.getWelcomeOfferState().view.step, 'offer')
  assert.equal(offer.getWelcomeOfferState().signedIn, true)
  assert.deepEqual(events, [['welcome_offer_viewed', { offer: 'fake0offer0token', signed_in: true }, { includePagePath: false }]])
  // supabase-js repeats SIGNED_IN on load and tab focus for the same account.
  emit('SIGNED_IN', user('old'))
  await settle()
  assert.equal(api.claims().length, 0)

  worker({ claim: [[409, { code: 409, reason: 'already_subscribed', message: 'x' }]] })
  const claiming = flow.claimFromPopup()
  assert.equal(offer.getWelcomeOfferState().view.step, 'claiming')
  await claiming
  assert.deepEqual(offer.getWelcomeOfferState().view, { step: 'refused', reason: 'already_subscribed' })
  assert.deepEqual(events.at(-1), ['welcome_offer_refused', { offer: 'fake0offer0token', reason: 'already_subscribed', trigger: 'button' }, { includePagePath: false }])
  assert.equal(offer.readOfferCookie(), '')
  flow.closeWelcomeOffer()
  assert.equal(offer.getWelcomeOfferState(), null)
})

test('a signed-in visitor saying no clears the cookie; a signed-out one keeps it', async () => {
  browser({ search: '?offer=fake0offer0token' })
  worker()
  let loaded = await loadFlow({ session: user('old') })
  loaded.flow.useWelcomeOfferAutoClaim()
  await settle()
  loaded.flow.closeWelcomeOffer()
  assert.equal(loaded.offer.readOfferCookie(), '')
  assert.equal(loaded.offer.isOfferDismissed('fake0offer0token'), true)

  browser({ search: '?offer=fake0offer0token' })
  loaded = await loadFlow()
  loaded.flow.useWelcomeOfferAutoClaim()
  await settle()
  loaded.flow.closeWelcomeOffer()
  assert.equal(loaded.offer.readOfferCookie(), 'fake0offer0token')
  assert.equal(loaded.offer.isOfferDismissed('fake0offer0token'), true)
})

test('back signed in with an earlier cookie, the claim happens without asking', async () => {
  browser({ search: '?offer=fake0offer0token', cookie: 'enconvo_offer=fake0offer0token' })
  const api = worker({ claim: [[200, { code: 200, data: { ...CLAIM, already_claimed: true, balance: null } }]] })
  const { offer, flow, events } = await loadFlow({ session: user('new') })
  flow.useWelcomeOfferAutoClaim()
  await settle()
  assert.equal(api.claims().length, 1)
  assert.equal(offer.getWelcomeOfferState().view.claim.already_claimed, true)
  assert.deepEqual(events, [['welcome_offer_claimed', { offer: 'fake0offer0token', already_claimed: true, trigger: 'auto' }, { includePagePath: false }]])
})

test('a page load with a waiting cookie claims for the existing session; a failure retries quietly off the link', async () => {
  browser({ cookie: 'enconvo_offer=fake0offer0token' })
  const server = [500, { code: 500, reason: 'server_error', message: 'x' }]
  const api = worker({ claim: [server, server, server, [200, { code: 200, data: CLAIM }]] })
  // Every later page load on any page tries again, without the blocking popup.
  for (const pathname of ['/account', '/pricing']) {
    const { offer, flow, events } = await loadFlow({ session: user('new'), pathname })
    flow.useWelcomeOfferAutoClaim()
    await settle()
    assert.equal(offer.getWelcomeOfferState(), null, pathname)
    assert.equal(offer.readOfferCookie(), 'fake0offer0token')
    assert.deepEqual(events, [])
  }
  assert.equal(api.claims().length, 2)

  // On the offer link the failure shows, with Try again.
  window.location.search = '?offer=fake0offer0token'
  const { offer, flow, events } = await loadFlow({ session: user('new') })
  flow.useWelcomeOfferAutoClaim()
  await settle()
  assert.deepEqual(offer.getWelcomeOfferState().view, { step: 'failed', signIn: false })
  assert.equal(offer.getWelcomeOfferState().info.days, 14, 'terms are fetched alongside an automatic claim')
  assert.deepEqual(events, [])
  await flow.claimFromPopup()
  assert.equal(api.claims().length, 4)
  assert.equal(offer.getWelcomeOfferState().view.step, 'claimed')
  assert.equal(offer.readOfferCookie(), '')
})

test('a closed failure popup keeps the cookie and the link working; later retries stay quiet', async () => {
  browser({ search: '?offer=fake0offer0token', cookie: 'enconvo_offer=fake0offer0token' })
  const api = worker({ claim: ['network', 'network', [200, { code: 200, data: CLAIM }]] })
  let loaded = await loadFlow({ session: user('new') })
  loaded.flow.useWelcomeOfferAutoClaim()
  await settle()
  assert.deepEqual(loaded.offer.getWelcomeOfferState().view, { step: 'failed', signIn: false })
  loaded.flow.closeWelcomeOffer()
  assert.equal(loaded.offer.getWelcomeOfferState(), null)
  assert.equal(loaded.offer.readOfferCookie(), 'fake0offer0token')
  assert.equal(loaded.offer.isOfferDismissed('fake0offer0token'), false)
  // The next page view elsewhere retries without a popup; the one after that succeeds and shows it.
  window.location.search = ''
  loaded = await loadFlow({ session: user('new'), pathname: '/use-cases' })
  loaded.flow.useWelcomeOfferAutoClaim()
  await settle()
  assert.equal(loaded.offer.getWelcomeOfferState(), null)
  loaded = await loadFlow({ session: user('new'), pathname: '/use-cases' })
  loaded.flow.useWelcomeOfferAutoClaim()
  await settle()
  assert.equal(loaded.offer.getWelcomeOfferState().view.step, 'claimed')
  assert.equal(api.claims().length, 3)
})

test('an automatic claim the Worker refuses as signed out stays quiet and keeps the cookie', async () => {
  browser({ cookie: 'enconvo_offer=fake0offer0token' })
  worker({ claim: [[401, { code: 401, reason: 'unauthorized', message: 'x' }]] })
  const { offer, flow } = await loadFlow({ session: user('stale') })
  flow.useWelcomeOfferAutoClaim()
  await settle()
  assert.equal(offer.getWelcomeOfferState(), null)
  assert.equal(offer.readOfferCookie(), 'fake0offer0token')
})

test('only the homepage takes the link; other pages ignore it entirely', async () => {
  browser({ search: '?offer=fake0offer0token' })
  const api = worker()
  const { offer, flow, events, navigate } = await loadFlow({ pathname: '/pricing' })
  flow.useWelcomeOfferAutoClaim()
  await settle()
  for (const path of ['/blog/x', '/ja/pricing', '/use-cases', '/register', '/login']) {
    navigate('?offer=fake0offer0token', path)
    await settle()
  }
  assert.equal(offer.readOfferCookie(), '', 'no cookie')
  assert.equal(api.requests.length, 0, 'no request')
  assert.equal(offer.getWelcomeOfferState(), null, 'no popup')
  assert.deepEqual(events, [])
  // A language's homepage does take it.
  navigate('?offer=fake0offer0token', '/ja')
  await settle()
  assert.equal(offer.readOfferCookie(), 'fake0offer0token')
  assert.equal(offer.getWelcomeOfferState().view.step, 'offer')
  assert.deepEqual(events, [['welcome_offer_viewed', { offer: 'fake0offer0token', signed_in: false }, { includePagePath: false }]])
})

test('an automatic claim of an offer that is gone shows the refusal without stale terms', async () => {
  browser({ cookie: 'enconvo_offer=fake0offer0token' })
  worker({
    info: [200, { code: 200, data: { offer: 'fake0offer0token', status: 'not_found', valid: false } }],
    claim: [[404, { code: 404, reason: 'offer_not_found', message: 'x' }]],
  })
  const { offer, flow } = await loadFlow({ session: user('new'), pathname: '/account' })
  flow.useWelcomeOfferAutoClaim()
  await settle()
  assert.deepEqual(offer.getWelcomeOfferState().view, { step: 'refused', reason: 'offer_not_found' })
  assert.equal(offer.getWelcomeOfferState().info, null)
  assert.equal(offer.readOfferCookie(), '')
})

test('ended, unknown, not-yet-started and unreachable offers open no popup', async () => {
  for (const [info, cookieKept] of [
    [[200, { code: 200, data: { ...INFO, status: 'ended', valid: false } }], false],
    [[200, { code: 200, data: { offer: 'fake0offer0token', status: 'not_found', valid: false } }], false],
    // Not started yet: nothing is kept, so the link works once it starts.
    [[200, { code: 200, data: { ...INFO, status: 'not_started', valid: false } }], false],
    ['network', true],
  ]) {
    browser({ search: '?offer=fake0offer0token' })
    const api = worker({ info })
    const { offer, flow, events } = await loadFlow()
    flow.useWelcomeOfferAutoClaim()
    await settle()
    assert.equal(offer.getWelcomeOfferState(), null, JSON.stringify(info))
    assert.equal(offer.readOfferCookie() === 'fake0offer0token', cookieKept, JSON.stringify(info))
    assert.deepEqual(events, [])
    assert.equal(api.claims().length, 0)
  }
})

test('a dismissed offer stays closed, but a signed-out visitor still gets the claim after sign-up', async () => {
  browser({ search: '?offer=fake0offer0token', dismissed: ['fake0offer0token'] })
  worker()
  let loaded = await loadFlow()
  loaded.flow.useWelcomeOfferAutoClaim()
  await settle()
  assert.equal(loaded.offer.getWelcomeOfferState(), null)
  assert.equal(loaded.offer.readOfferCookie(), 'fake0offer0token')

  browser({ search: '?offer=fake0offer0token', dismissed: ['fake0offer0token'] })
  const api = worker()
  loaded = await loadFlow({ session: user('old') })
  loaded.flow.useWelcomeOfferAutoClaim()
  await settle()
  assert.equal(loaded.offer.getWelcomeOfferState(), null)
  assert.equal(loaded.offer.readOfferCookie(), '', 'a signed-in visitor who closed it gets no cookie')
  assert.equal(api.claims().length, 0)
})

test('pages without an offer never load Supabase; a later link on client navigation does', async () => {
  browser()
  const api = worker()
  let loaded = false
  const offer = await loadOffer([])
  const route = fakeRouter('/')
  const flow = await loadTs('../src/lib/welcome-offer-auto-claim.ts', {
    react: { useEffect: (effect) => effect() },
    'next/router': route.module,
    '@/lib/analytics': { trackEvent() {} },
    '@/lib/welcome-offer': offer,
    get '@/lib/supabase'() {
      loaded = true
      return { supabase: { auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }), getSession: async () => ({ data: { session: null } }) } } }
    },
  })
  flow.useWelcomeOfferAutoClaim()
  await settle()
  assert.equal(loaded, false)
  assert.equal(api.requests.length, 0)
  window.location.search = '?offer=fake0offer0token'
  route.listeners.forEach((fn) => fn())
  await settle()
  assert.equal(loaded, true)
  assert.equal(offer.getWelcomeOfferState().view.step, 'offer')
})

test('analytics payloads carry only the slug and enums, never page URLs or identity', async () => {
  const payloads = []
  const sink = createServer((request, response) => {
    let body = ''
    request.on('data', (part) => (body += part))
    request.on('end', () => {
      payloads.push(JSON.parse(body))
      response.end('ok')
    })
  })
  await new Promise((resolve) => sink.listen(0, '127.0.0.1', resolve))
  const pending = []
  browser({ search: '?offer=fake0offer0token&utm_source=newsletter' })
  window.gtag = (...args) =>
    pending.push(fetch(`http://127.0.0.1:${sink.address().port}`, { method: 'POST', body: JSON.stringify(args) }))
  const analytics = await loadTs('../src/lib/analytics.ts')
  worker()
  const workerFetch = globalThis.fetch
  globalThis.fetch = (url, init) => (String(url).startsWith('http://127.0.0.1') ? realFetch(url, init) : workerFetch(url, init))
  const { flow, emit } = await loadFlow({ analytics })
  flow.useWelcomeOfferAutoClaim()
  await settle()
  // The sign-in lands on the OAuth callback page, whose address must not reach GA4 either.
  window.location.pathname = '/auth/callback'
  window.location.search = '?code=secret-oauth-code'
  emit('SIGNED_IN', user('new', 'private@example.test'))
  await settle()
  await Promise.all(pending)
  sink.close()
  globalThis.fetch = realFetch
  assert.deepEqual(payloads.map((event) => event[1]), ['welcome_offer_viewed', 'welcome_offer_claimed'])
  const allowed = { welcome_offer_viewed: ['offer', 'signed_in'], welcome_offer_claimed: ['already_claimed', 'offer', 'trigger'] }
  for (const [kind, name, payload] of payloads) {
    assert.equal(kind, 'event')
    assert.deepEqual(Object.keys(payload).sort(), [...allowed[name], 'page_location', 'page_referrer', 'page_title', 'transport_type'].sort())
    assert.equal(payload.page_location, 'https://www.enconvo.com/')
    assert.equal(payload.page_referrer, '')
    assert.doesNotMatch(JSON.stringify(payload), /private@|token-|utm_source|callback|secret-oauth-code/)
  }
})

test('registering from an offer link confirms the email back on the website', async () => {
  const authFlow = await loadTs('../src/lib/auth-flow.ts')
  const offer = await loadOffer([])
  let router
  let signUp
  const passthrough = ({ children }) => React.createElement('div', {}, children)
  const RegisterForm = (
    await loadTs('../src/pages/components/RegisterForm.tsx', {
      react: { ...React, useState: (value) => [value, () => {}], useEffect() {} },
      'next/router': { useRouter: () => router },
      'next/head': { default: passthrough, __esModule: true },
      'next/link': { default: passthrough, __esModule: true },
      '@/i18n/I18nProvider': { useI18n: () => ({ t: (s) => s, locale: 'ja' }) },
      '@/i18n/server': { i18nStaticProps: () => ({}) },
      '@/lib/auth-flow': authFlow,
      '@/lib/welcome-offer': offer,
      '@/lib/email-preferences-client': { saveRegistrationEmailPreference() {}, syncCurrentEmailPreference: async () => {} },
      '@supabase/auth-helpers-nextjs': {
        createClientComponentClient: () => ({
          auth: {
            signUp: async (credentials) => {
              signUp = credentials
              return { data: { session: null }, error: null }
            },
          },
        }),
      },
      '@/components/ui/button': { Button: passthrough },
      '@/components/ui/input': { Input: () => null },
      '@/components/ui/alert': { Alert: passthrough, AlertDescription: passthrough, AlertTitle: passthrough },
      '@/components/Logo': { Logo: () => null },
    })
  ).default
  const find = (node, test) => {
    if (!node || typeof node !== 'object') return null
    if (test(node)) return node
    const children = node.props?.children
    return (Array.isArray(children) ? children : [children]).map((child) => find(child, test)).find(Boolean) ?? null
  }
  globalThis.window = { location: { origin: 'https://www.enconvo.com' } }
  for (const [returnUrl, expected] of [
    ['/?offer=fake0offer0token', 'https://www.enconvo.com/auth/callback?returnUrl=%2F%3Foffer%3Dfake0offer0token&language=ja'],
    ['/?utm_source=x&offer=fake0offer0token', 'https://www.enconvo.com/auth/callback?returnUrl=%2F%3Futm_source%3Dx%26offer%3Dfake0offer0token&language=ja'],
    ['/use-cases?offer=fake0offer0token', 'https://www.enconvo.com/login?from=app&returnUrl=%2Fuse-cases%3Foffer%3Dfake0offer0token&language=ja'],
    ['/ltd', 'https://www.enconvo.com/auth/callback?returnUrl=%2Fltd&language=ja'],
    ['/account', 'https://www.enconvo.com/login?from=app&returnUrl=%2Faccount&language=ja'],
    ['//evil.example/?offer=fake0offer0token', 'https://www.enconvo.com/login?from=app&returnUrl=%2F%2Fevil.example%2F%3Foffer%3Dfake0offer0token&language=ja'],
  ]) {
    router = { isReady: true, query: { returnUrl } }
    signUp = null
    const tree = RegisterForm({ loginState: 'register', setLoginState() {}, email: 'new@example.test', setEmail() {} })
    const button = find(tree, (node) => node.props?.children?.includes?.('Create account'))
    await button.props.onClick()
    assert.equal(signUp.options.emailRedirectTo, expected, returnUrl)
  }
})

test('every popup step renders its copy and actions', async () => {
  const translate = (source, values = {}) => source.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`))
  const i18n = { useI18n: () => ({ t: translate, locale: 'en' }) }
  const element = (tag) => React.forwardRef(({ children, initialFocus, onClose, open, ...props }, ref) => React.createElement(tag, { ...props, ref }, children))
  const Dialog = Object.assign(element('div'), { Panel: element('section'), Title: element('h2') })
  const workerApi = await loadTs('../src/lib/worker-api.ts')
  const invite = await loadTs('../src/lib/invite.ts', { '@/lib/codes': { normalizeCode: (v) => v }, '@/lib/worker-api': workerApi })
  const offer = await loadOffer([])
  const { default: WelcomeOfferDialog } = await loadTs('../src/components/WelcomeOfferDialog.tsx', {
    // The popup renders only in the browser; its layout effect (the height morph) has no server form.
    react: { ...React, useLayoutEffect() {} },
    '@headlessui/react': { Dialog },
    'next/link': { __esModule: true, default: React.forwardRef(({ href, children, ...props }, ref) => React.createElement('a', { href, ref, ...props }, children)) },
    '@/i18n/I18nProvider': i18n,
    '@/i18n/I18nText': await loadTs('../src/i18n/I18nText.tsx', { './I18nProvider': i18n }),
    '@/components/landing-styles': await loadTs('../src/components/landing-styles.ts'),
    '@/lib/analytics': { trackEvent() {} },
    '@/lib/invite': invite,
    '@/lib/ltd-confetti': { burstConfetti() {} },
    '@/lib/welcome-offer': offer,
    '@/lib/welcome-offer-auto-claim': { claimFromPopup() {}, closeWelcomeOffer() {}, leaveWelcomeOffer() {} },
    // CSS module class names render as their own names.
    '@/styles/WelcomeOffer.module.css': new Proxy({}, { get: (_, key) => (key === '__esModule' ? false : String(key)) }),
  })
  const render = (state) => renderToStaticMarkup(React.createElement(WelcomeOfferDialog, { state: { slug: 'fake0offer0token', info: INFO, signedIn: false, email: null, ...state } }))
  const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ')
  const home = '%2F%3Foffer%3Dfake0offer0token'

  // The gift: hero line, the plan as the centrepiece, the points chip and one line on cost.
  const signedOut = render({ view: { step: 'offer' } })
  assert.match(text(signedOut), /A gift for you 14 days of Plus Cloud \$5 of AI points included Free, no card needed\. It ends on its own\./)
  assert.match(text(signedOut), /One per account\. The points end with the plan\./)
  // Every account may claim once: nothing speaks of new accounts, with the old answer or the new.
  for (const info of [INFO, LIVE_INFO]) {
    const html = text(render({ view: { step: 'offer' }, info }))
    assert.equal(html, text(signedOut))
    assert.doesNotMatch(html, /new account|created in|7 days|trial/i)
  }
  assert.match(signedOut, /class="gift /, 'the gift mark')
  assert.match(signedOut, /class="sweep"/, 'the arrival sweep')
  // Sign-up and sign-in return to the homepage link; the copy never shows the slug.
  assert.match(signedOut, new RegExp(`href="/register\\?returnUrl=${home}"`))
  assert.match(signedOut, new RegExp(`href="/login\\?returnUrl=${home}"`))
  assert.doesNotMatch(text(signedOut), /fake0offer0token/)
  assert.doesNotMatch(text(signedOut), /Claim by/)
  assert.match(text(render({ view: { step: 'offer' }, info: { ...INFO, ends_at: '2026-12-31T12:00:00Z' } })), /Claim by December 31, 2026\./)
  assert.doesNotMatch(text(render({ view: { step: 'offer' }, info: { ...INFO, usd: 0 } })), /of AI points included/)

  const signedIn = render({ view: { step: 'offer' }, signedIn: true })
  assert.match(text(signedIn), / Claim /)
  assert.match(text(signedIn), /Not now/)
  assert.doesNotMatch(signedIn, /\/register/)

  // Opening straight into a claim (an automatic one): the gift, the plan and what to do next.
  const claimed = render({ view: { step: 'claimed', claim: CLAIM }, signedIn: true, email: 'new@example.test' })
  assert.match(text(claimed), /Offer claimed Your 14-day Plus Cloud plan is active/)
  assert.match(text(claimed), /Active until Nov 2, 2026 AI points 250,000 \(\$5\) The points end with the plan\./)
  assert.match(text(claimed), /Open it and sign in as new@example\.test ?\./)
  assert.match(claimed, /class="gift /)
  assert.doesNotMatch(claimed, /class="sweep"/, 'no arrival sweep on a claim')
  assert.match(claimed, /href="https:\/\/api\.enconvo\.com\/app\/download\?arch=arm64&amp;platform=darwin"/)
  assert.match(claimed, /href="https:\/\/api\.enconvo\.com\/app\/download\?arch=x64&amp;platform=darwin"/)
  // A re-claim answers balance: null; nothing shows the balance.
  const later = { ...CLAIM, already_claimed: true, balance: null, ends_at: '2099-01-02T08:00:00.000Z' }
  assert.match(text(render({ view: { step: 'claimed', claim: later }, signedIn: true })), /Already claimed Your 14-day Plus Cloud plan is active Active until .*sign in with this account/)
  // Claimed long ago: the plan has ended (or the Worker no longer says when), so nothing reads as active.
  for (const ends_at of [null, '2020-01-01T00:00:00.000Z', 'soon']) {
    const html = text(render({ view: { step: 'claimed', claim: { ...later, ends_at } }, signedIn: true, email: 'new@example.test' }))
    assert.match(html, /Welcome offer You've already claimed this offer It was added to your account earlier\. Download for Mac Done/, String(ends_at))
    assert.doesNotMatch(html, /is active|Active until|AI points|Next steps|Already claimed/, String(ends_at))
  }
  assert.equal(offer.claimEnded({ ...later, ends_at: '2026-10-20T00:00:00.000Z' }, Date.parse('2026-10-20T00:00:01.000Z')), true)
  assert.equal(offer.claimEnded(later, Date.parse('2026-10-20T00:00:00.000Z')), false)
  assert.doesNotMatch(text(render({ view: { step: 'claimed', claim: { ...CLAIM, ends_at: 'soon' } }, signedIn: true })), /Active until/)

  const expected = {
    already_subscribed: [/already have a Cloud plan/, /nothing to add/, ['/account', '/cloud-pricing']],
    offer_ended: [/This offer has ended/, /no longer accepts/, ['/cloud-pricing']],
    offer_not_found: [/isn't available/, /mistyped/, ['/cloud-pricing']],
    offer_not_started: [/hasn't started yet/, /once it starts/, []],
    other_code_open: [/trial checkout open/, /30 minutes/, []],
    unavailable: [/isn't available for your account/, /Nothing was changed/, ['/cloud-pricing']],
  }
  for (const [reason, [title, body, links]] of Object.entries(expected)) {
    const html = render({ view: { step: 'refused', reason }, signedIn: true })
    assert.match(text(html), title, reason)
    assert.match(text(html), body, reason)
    assert.deepEqual([...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]), links, reason)
    assert.doesNotMatch(html, /class="gift /, `${reason}: a refusal is no gift`)
  }

  const retry = render({ view: { step: 'failed', signIn: false }, signedIn: true })
  assert.match(text(retry), /We couldn't claim your offer .*Try again/)
  const signIn = render({ view: { step: 'failed', signIn: true }, signedIn: true })
  assert.match(text(signIn), /Sign in again to claim/)
  assert.match(signIn, new RegExp(`href="/login\\?returnUrl=${home}"`))

  // Every step's title can take focus when a click brings the popup to it, and a polite live
  // region reads out the claim; it starts empty, so an arrival is announced by its title alone.
  const refused = render({ view: { step: 'refused', reason: 'other_code_open' }, signedIn: true })
  for (const html of [signedOut, signedIn, claimed, refused, retry, signIn]) {
    assert.equal(html.match(/<h2 [^>]*tabindex="-1"[^>]*data-step-title="true"/g)?.length, 1, text(html).slice(0, 40))
    assert.match(html, /<p role="status" aria-live="polite" class="sr-only"><\/p>/)
  }
  // Nothing in the popup is disabled: Close, X and Not now work while a claim runs, and a busy
  // Claim or Try again button keeps focus.
  for (const html of [signedIn, retry]) assert.doesNotMatch(html, /disabled=""/)
})

test('every popup message exists in all catalogs with intact placeholders', async () => {
  // Every t('…') literal, I18nText source and link label in the popup, plus each refusal's copy.
  const keys = new Set()
  const path = new URL('../src/components/WelcomeOfferDialog.tsx', import.meta.url)
  const source = ts.createSourceFile(path.pathname, await readFile(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const visit = (node) => {
    if (ts.isCallExpression(node) && node.expression.getText(source) === 't' && node.arguments[0] && ts.isStringLiteral(node.arguments[0]))
      keys.add(node.arguments[0].text)
    if (ts.isJsxAttribute(node) && node.name.getText(source) === 'source' && ts.isJsxExpression(node.initializer) && ts.isStringLiteral(node.initializer.expression))
      keys.add(node.initializer.expression.text)
    if (ts.isPropertyAssignment(node) && node.name.getText(source) === 'label' && ts.isStringLiteral(node.initializer))
      keys.add(node.initializer.text)
    ts.forEachChild(node, visit)
  }
  visit(source)
  const offer = await loadOffer([])
  for (const reason of [...offer.REFUSAL_REASONS, 'unavailable']) {
    const copy = offer.refusalCopy(reason)
    keys.add(copy.title)
    keys.add(copy.body)
  }
  assert.ok(keys.size >= 40, `found ${keys.size} messages`)
  const placeholders = (text) => (text.match(/\{\w+\}/g) ?? []).sort()
  for (const locale of ['zh-CN', 'zh-TW', 'ja', 'ko', 'es', 'de', 'fr', 'it', 'pt', 'nl', 'pl']) {
    const messages = JSON.parse(await readFile(new URL(`../src/i18n/messages/${locale}.json`, import.meta.url), 'utf8'))
    for (const key of keys) {
      assert.ok(messages[key], `${locale}: ${key}`)
      assert.deepEqual(placeholders(messages[key]), placeholders(key), `${locale}: ${key}`)
    }
  }
})

// Regression tests for the review fixes after launch.

const findNode = (node, match) => {
  if (!node || typeof node !== 'object') return null
  if (match(node)) return node
  const children = node.props?.children
  return (Array.isArray(children) ? children : [children]).map((child) => findNode(child, match)).find(Boolean) ?? null
}

test('a password sign-in from the offer never opens the app; Google returns through the callback to the offer', async () => {
  const authFlow = await loadTs('../src/lib/auth-flow.ts')
  const offer = await loadOffer([])
  const passthrough = ({ children }) => React.createElement('div', {}, children)
  const opened = []
  const LoginForm = (
    await loadTs('../src/pages/components/LoginForm.tsx', {
      // Every empty field reads as filled in.
      react: { ...React, useState: (value) => [value === '' ? 'person@example.test' : value, () => {}], useEffect() {} },
      'next/router': { useRouter: () => ({ query: {} }) },
      'next/head': { default: passthrough, __esModule: true },
      'next/link': { default: passthrough, __esModule: true },
      '@/i18n/I18nProvider': { useI18n: () => ({ t: (s) => s, locale: 'en' }) },
      '@/i18n/server': { i18nStaticProps: () => ({}) },
      '@/lib/auth-flow': authFlow,
      '@/lib/welcome-offer': offer,
      '@/lib/email-preferences-client': { syncCurrentEmailPreference: async () => {} },
      '@/utils/app/native_router': {
        NativeRouter: {
          openApp: async (...args) => {
            opened.push(args)
            return 'opened'
          },
        },
      },
      '@supabase/auth-helpers-nextjs': {
        createClientComponentClient: () => ({
          auth: {
            signInWithPassword: async () => ({ data: { user: { id: 'u' }, session: { access_token: 'a', refresh_token: 'r' } }, error: null }),
            setSession: async () => ({}),
          },
        }),
      },
      '@/components/ui/button': { Button: passthrough },
      '@/components/ui/input': { Input: () => null },
      '@/components/ui/alert': { Alert: passthrough, AlertDescription: passthrough, AlertTitle: passthrough },
      '@/components/Logo': { Logo: () => null },
    })
  ).default
  for (const [query, opens] of [
    [{ returnUrl: '/?offer=fake0offer0token' }, false],
    [{ returnUrl: '/?utm_source=x&offer=fake0offer0token' }, false],
    [{ returnUrl: '/ja?offer=fake0offer0token' }, false],
    [{ returnUrl: ['/?offer=fake0offer0token'] }, false],
    // The app asked for this sign-in; any other return still opens the app as before.
    [{ returnUrl: '/?offer=fake0offer0token', from: 'app' }, true],
    [{ returnUrl: '/use-cases?offer=fake0offer0token' }, true],
    [{ returnUrl: '/account' }, true],
    [{}, true],
  ]) {
    opened.length = 0
    const states = []
    const tree = LoginForm({ loginState: 'login', setLoginState: (state) => states.push(state), setUser() {}, router: { isReady: true, query } })
    findNode(tree, (node) => node.type === 'form').props.onSubmit({ preventDefault() {} })
    await settle()
    assert.equal(opened.length, opens ? 1 : 0, JSON.stringify(query))
    assert.deepEqual(states, ['success'], JSON.stringify(query))
  }

  // Google: the callback carries the offer link and goes straight back to it, never via /login.
  const callbackUrl = new URL(authFlow.oauthCallbackUrl('https://www.enconvo.com', { returnUrl: '/?offer=fake0offer0token' }, 'ja'))
  assert.equal(callbackUrl.searchParams.get('returnUrl'), '/?offer=fake0offer0token')
  const callbackPath = new URL('../src/pages/auth/callback.ts', import.meta.url)
  assert.doesNotMatch(await readFile(callbackPath, 'utf8'), /native_router|openApp|enconvo:\/\//)
  const pushes = []
  const AuthCallback = (
    await loadTs('../src/pages/auth/callback.ts', {
      react: { ...React, useEffect: (effect) => effect() },
      'next/router': {
        useRouter: () => ({ isReady: true, locale: 'ja', query: Object.fromEntries(callbackUrl.searchParams), push: async (...args) => pushes.push(args) }),
      },
      '@/i18n/server': { i18nStaticProps: () => ({}) },
      '@/i18n/locale': { getLocale: (locale) => locale },
      '@/lib/email-preferences-client': {
        consumeRegistrationEmailPreference: () => null,
        syncCurrentEmailPreference: async () => {},
        updateCurrentEmailPreference: async () => {},
      },
      '@supabase/auth-helpers-nextjs': {
        createClientComponentClient: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: 'a' } }, error: null }) } }),
      },
    })
  ).default
  AuthCallback()
  await settle()
  assert.deepEqual(pushes, [['/?offer=fake0offer0token', undefined, { locale: 'ja' }]])
})

test('a refusal that ends with time leaves the link working for a later visit', async () => {
  for (const [status, reason] of [
    [409, 'other_code_open'],
    [403, 'offer_not_started'],
  ]) {
    browser({ cookie: 'enconvo_offer=fake0offer0token' })
    const api = worker({ claim: [[status, { code: status, reason, message: 'x' }], [200, { code: 200, data: CLAIM }]] })
    // Back from the OAuth callback: the claim runs there, then the page moves on to the link.
    let loaded = await loadFlow({ session: user('new'), pathname: '/auth/callback' })
    loaded.flow.useWelcomeOfferAutoClaim()
    await settle()
    loaded.navigate('?offer=fake0offer0token')
    await settle()
    assert.deepEqual(loaded.offer.getWelcomeOfferState().view, { step: 'refused', reason }, `${reason}: the answer stays on screen`)
    assert.deepEqual(loaded.events, [['welcome_offer_refused', { offer: 'fake0offer0token', reason, trigger: 'auto' }, { includePagePath: false }]])
    assert.equal(loaded.offer.readOfferCookie(), '', `${reason}: no automatic retry on every page`)
    assert.equal(loaded.offer.hasClaimOutcome('fake0offer0token'), false, reason)
    loaded.flow.closeWelcomeOffer()
    assert.equal(loaded.offer.isOfferDismissed('fake0offer0token'), false, reason)
    // Opened again later, the link offers the claim and it goes through.
    loaded = await loadFlow({ session: user('new') })
    loaded.flow.useWelcomeOfferAutoClaim()
    await settle()
    assert.equal(loaded.offer.getWelcomeOfferState().view.step, 'offer', reason)
    await loaded.flow.claimFromPopup()
    assert.equal(loaded.offer.getWelcomeOfferState().view.step, 'claimed', reason)
    assert.equal(api.claims().length, 2, reason)
  }
})

test('a sign-in that reaches several open tabs claims once; a Claim click still claims', async () => {
  const restore = installLocks()
  try {
    browser({ cookie: 'enconvo_offer=fake0offer0token' })
    const api = worker()
    const tabs = []
    for (const pathname of ['/register', '/auth/callback']) {
      const tab = await loadFlow({ pathname })
      tab.flow.useWelcomeOfferAutoClaim()
      await settle()
      tabs.push(tab)
    }
    // gotrue sends one sign-in to every open tab.
    tabs.forEach((tab) => tab.emit('SIGNED_IN', user('new')))
    await settle()
    assert.equal(api.claims().length, 1)
    const shown = tabs.filter((tab) => tab.offer.getWelcomeOfferState())
    assert.equal(shown.length, 1, 'one popup')
    assert.equal(shown[0].offer.getWelcomeOfferState().view.claim.already_claimed, false)
    assert.deepEqual(
      tabs.flatMap((tab) => tab.events),
      [['welcome_offer_claimed', { offer: 'fake0offer0token', already_claimed: false, trigger: 'auto' }, { includePagePath: false }]]
    )

    browser({ search: '?offer=fake0offer0token' })
    const clicked = worker()
    const tab = await loadFlow({ session: user('old') })
    tab.flow.useWelcomeOfferAutoClaim()
    await settle()
    await tab.flow.claimFromPopup()
    assert.equal(tab.offer.getWelcomeOfferState().view.step, 'claimed')
    assert.equal(clicked.claims().length, 1)
  } finally {
    restore()
  }
})

test('a tab in the background claims once it is looked at, and not after another tab claimed', async () => {
  for (const claimedElsewhere of [false, true]) {
    const { setVisibility } = browser({ cookie: 'enconvo_offer=fake0offer0token' })
    const api = worker()
    const tab = await loadFlow({ pathname: '/register' })
    tab.flow.useWelcomeOfferAutoClaim()
    await settle()
    setVisibility('hidden')
    // The sign-up page moves to the offer link on the sign-in, behind the confirmation tab.
    tab.emit('SIGNED_IN', user('new'))
    tab.navigate('?offer=fake0offer0token')
    await settle()
    assert.equal(api.requests.length, 0, 'a hidden tab neither claims nor asks for the terms')
    if (claimedElsewhere) {
      tab.offer.clearOfferCookie()
      tab.offer.dismissOffer('fake0offer0token')
    }
    setVisibility('visible')
    await settle()
    assert.equal(api.claims().length, claimedElsewhere ? 0 : 1, String(claimedElsewhere))
    assert.equal(tab.offer.getWelcomeOfferState()?.view.step, claimedElsewhere ? undefined : 'claimed', String(claimedElsewhere))
    assert.equal(tab.events.length, claimedElsewhere ? 0 : 1, 'no view of an offer claimed elsewhere')
  }
})

test('a signed-in visit writes no cookie, so a reload or a later page asks again instead of claiming', async () => {
  const { writes } = browser({ search: '?offer=fake0offer0token' })
  const api = worker()
  let loaded = await loadFlow({ session: user('old') })
  loaded.flow.useWelcomeOfferAutoClaim()
  await settle()
  assert.deepEqual(writes, [])
  loaded = await loadFlow({ session: user('old') })
  loaded.flow.useWelcomeOfferAutoClaim()
  await settle()
  assert.equal(loaded.offer.getWelcomeOfferState().view.step, 'offer', 'a reload shows Claim again')
  window.location.search = ''
  loaded = await loadFlow({ session: user('old'), pathname: '/pricing' })
  loaded.flow.useWelcomeOfferAutoClaim()
  await settle()
  assert.equal(loaded.offer.getWelcomeOfferState(), null)
  assert.equal(api.claims().length, 0)
})

test('a session the Worker refuses: the offer waits, and signing in again as the same account claims it', async () => {
  browser({ search: '?offer=fake0offer0token' })
  const api = worker({ claim: [[401, { code: 401, reason: 'unauthorized', message: 'x' }], [200, { code: 200, data: CLAIM }]] })
  const { offer, flow, events, emit } = await loadFlow({ session: user('old') })
  flow.useWelcomeOfferAutoClaim()
  await settle()
  await flow.claimFromPopup()
  assert.deepEqual(offer.getWelcomeOfferState().view, { step: 'failed', signIn: true })
  assert.equal(offer.readOfferCookie(), 'fake0offer0token', 'kept for after Sign in again')
  flow.leaveWelcomeOffer()
  // The refused session coming back with the tab is no sign-in.
  emit('SIGNED_IN', user('old'))
  await settle()
  assert.equal(api.claims().length, 1)
  // Signing in again as the same account brings a new session, which claims.
  emit('SIGNED_IN', { ...user('old'), access_token: 'token-old-again' })
  await settle()
  assert.equal(api.claims().length, 2)
  assert.equal(api.claims()[1].init.headers.accessToken, 'token-old-again')
  assert.equal(offer.getWelcomeOfferState().view.step, 'claimed')
  assert.deepEqual(events.at(-1), ['welcome_offer_claimed', { offer: 'fake0offer0token', already_claimed: false, trigger: 'auto' }, { includePagePath: false }])
})

test('back on the link after leaving for sign-up opens the popup again', async () => {
  browser({ search: '?offer=fake0offer0token' })
  worker()
  const { offer, flow, events, navigate } = await loadFlow()
  flow.useWelcomeOfferAutoClaim()
  await settle()
  flow.leaveWelcomeOffer()
  navigate('?returnUrl=%2F%3Foffer%3Dfake0offer0token', '/register')
  await settle()
  navigate('?offer=fake0offer0token')
  await settle()
  assert.equal(offer.getWelcomeOfferState().view.step, 'offer')
  assert.equal(events.filter(([name]) => name === 'welcome_offer_viewed').length, 2)
})

test('a claim that hangs times out as a retryable failure', async () => {
  const offer = await loadOffer([])
  browser()
  globalThis.fetch = (url, init) =>
    new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason)))
  assert.equal(offer.CLAIM_TIMEOUT_MS, 15000)
  // Node doesn't wait on AbortSignal.timeout's timer; this one keeps the test alive meanwhile.
  const alive = setTimeout(() => {}, 5000)
  assert.deepEqual(offer.claimView(await offer.postWelcomeOfferClaim('token', 'fake0offer0token', 20)), { step: 'failed', signIn: false })
  clearTimeout(alive)
})

test('closing the popup while a claim runs lets it finish in the background', async () => {
  browser({ search: '?offer=fake0offer0token' })
  let answer
  worker({ claimGate: new Promise((resolve) => (answer = resolve)) })
  const { offer, flow, events } = await loadFlow({ session: user('old') })
  flow.useWelcomeOfferAutoClaim()
  await settle()
  const claiming = flow.claimFromPopup()
  await settle()
  assert.equal(offer.getWelcomeOfferState().view.step, 'claiming')
  flow.closeWelcomeOffer()
  assert.equal(offer.getWelcomeOfferState(), null)
  answer()
  await claiming
  assert.equal(offer.getWelcomeOfferState(), null, 'the popup stays closed')
  assert.equal(offer.hasClaimOutcome('fake0offer0token'), true)
  assert.equal(offer.isOfferDismissed('fake0offer0token'), true)
  assert.deepEqual(events.at(-1), ['welcome_offer_claimed', { offer: 'fake0offer0token', already_claimed: false, trigger: 'button' }, { includePagePath: false }])
})

test('the popup opens only while the visitor is still on a homepage', async () => {
  for (const [path, opens] of [
    ['/pricing', false],
    ['/ja', true],
  ]) {
    browser({ search: '?offer=fake0offer0token' })
    let release
    worker({ infoGate: new Promise((resolve) => (release = resolve)) })
    const { offer, flow, events } = await loadFlow()
    flow.useWelcomeOfferAutoClaim()
    await settle()
    // Moved on while the terms loaded (a language switch keeps it on a homepage).
    window.location.pathname = path
    release()
    await settle()
    assert.equal(offer.getWelcomeOfferState()?.view.step, opens ? 'offer' : undefined, path)
    assert.equal(events.length, opens ? 1 : 0, path)
    assert.equal(offer.readOfferCookie(), 'fake0offer0token', `${path}: still kept for after sign-up`)
  }
})
