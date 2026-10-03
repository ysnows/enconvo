// Financial regression checks with a fake Stripe client. No live objects,
// sessions, coupons, or charges are created by this script.
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
function load(relative, dependencies = {}, env = {}) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText
  const exports = {}
  const context = {
    exports,
    Error,
    ...env.globals,
    require(name) {
      if (!(name in dependencies))
        throw new Error(`Unexpected dependency: ${name}`)
      return dependencies[name]
    },
    process: { env },
    URL,
    URLSearchParams,
    Intl,
    console: { log() {} },
  }
  vm.runInNewContext(output, context, { filename: relative })
  return exports
}
const localeTools = load('src/i18n/locale.ts', {
  './config.json': JSON.parse(
    fs.readFileSync(path.join(root, 'src/i18n/config.json'), 'utf8')
  ),
})
const i18n = {
  useI18n: () => ({
    locale: 'en',
    t: (source, values) => localeTools.translate({}, source, values),
  }),
}
const i18nServer = {
  withI18nProps: (loader) => loader,
  getStaticProps: async () => ({ props: {} }),
  i18nStaticProps: () => async () => ({ props: {} }),
}
const data = load('src/data/ltdOffer.ts')
const checkout = load('src/lib/ltd-checkout.ts', { '../data/ltdOffer': data })
const clone = (value) => JSON.parse(JSON.stringify(value))

function fakeStripe(plan = data.ltdPlans[0], overrides = {}) {
  const calls = { price: [], coupon: [], promo: [], created: [], sessions: [] }
  const price = {
    active: true,
    type: 'one_time',
    currency: 'usd',
    unit_amount: plan.originalCents,
    product: 'product_license',
    ...overrides.price,
  }
  const coupon = {
    id: data.LTD_OFFER.couponId,
    valid: true,
    percent_off: data.LTD_OFFER.discountPercent,
    duration: 'once',
    applies_to: { products: ['product_license'] },
    ...overrides.coupon,
  }
  const promotionCode = {
    id: 'promo_kenmoo',
    code: data.LTD_OFFER.promotionCode,
    active: true,
    coupon,
    expires_at: null,
    max_redemptions: null,
    times_redeemed: 0,
    ...overrides.promotionCode,
  }
  const stripe = {
    prices: {
      async retrieve(id) {
        calls.price.push(id)
        return price
      },
    },
    coupons: {
      async retrieve(id, params) {
        calls.coupon.push(clone({ id, params }))
        if (overrides.retrieveError) throw overrides.retrieveError
        if (overrides.missing) throw { code: 'resource_missing' }
        return coupon
      },
      async create(params) {
        calls.created.push(clone(params))
        return coupon
      },
    },
    promotionCodes: {
      async list(params) {
        calls.promo.push(clone(params))
        if (overrides.listError) throw overrides.listError
        return { data: overrides.noPromotionCode ? [] : [promotionCode] }
      },
      async create(params) {
        calls.created.push(clone(params))
        return promotionCode
      },
    },
    checkout: {
      sessions: {
        async create(params) {
          calls.sessions.push(clone(params))
          if (overrides.sessionError) throw overrides.sessionError
          return {
            id: 'cs_test_a1b2c3d4e5f6g7h8',
            url: 'https://checkout.stripe.com/c/pay/test_session',
          }
        },
      },
    },
  }
  return { stripe, calls }
}

test('All offer amounts are 40% off the existing USD license prices', () => {
  assert.equal(data.LTD_OFFER.discountPercent, 40)
  assert.deepEqual(
    clone(data.ltdPlans.map((p) => data.ltdPriceCents(p, 'kenmoo'))),
    [2940, 5940, 8340]
  )
  assert.deepEqual(
    clone(
      data.ltdPlans.map((p) => data.formatUsd(data.ltdPriceCents(p, 'kenmoo')))
    ),
    ['$29.40', '$59.40', '$83.40']
  )
})

test('Sign-in return links retain the plan, offer route, and escaped affiliate reference', () => {
  for (const plan of data.ltdPlans) {
    const url = new URL(
      data.ltdLoginUrl(plan, 'partner&campaign=launch'),
      'https://www.enconvo.com'
    )
    const destination = new URL(url.searchParams.get('returnUrl'), url.origin)
    assert.equal(destination.pathname, '/ltd')
    assert.equal(destination.searchParams.get('plan'), plan.key)
    assert.equal(destination.searchParams.get('via'), 'partner&campaign=launch')
  }
})

test('Every offer uses one existing license price and applies the server-controlled KENMOO2026 promotion code', async () => {
  for (const plan of data.ltdPlans) {
    const { stripe, calls } = fakeStripe(plan)
    const params = await checkout.ltdCheckoutParams(stripe, {
      lookupKey: plan.key,
      via: 'kenmoo',
      unit_amount: 1,
      coupon: 'attacker_coupon',
      promotion_code: 'promo_attacker',
      email: 'attacker@example.com',
    })
    assert.deepEqual(clone(params), {
      line_items: [{ price: plan.priceId, quantity: 1 }],
      discounts: [{ promotion_code: 'promo_kenmoo' }],
    })
    assert.deepEqual(calls.coupon, [
      { id: 'KENMOO2026', params: { expand: ['applies_to'] } },
    ])
    assert.deepEqual(calls.promo, [
      { code: 'KENMOO2026', coupon: 'KENMOO2026', active: true, limit: 1 },
    ])
    assert.equal(calls.created.length, 0)
  }
})

test('Cloud subscriptions, points topups, extra seats, quantities, and invalid plans cannot get this offer', async () => {
  const inputs = [
    null,
    {},
    { lookupKey: 'monthly' },
    { lookupKey: '250000_points' },
    { lookupKey: 'teams_seat' },
    { lookupKey: 'standard', quantity: 2 },
    { lookupKey: 'standard', seats: 5 },
    { lookupKey: 'teams', seats: 6 },
    { lookupKey: 'teams', seats: '5' },
    { lookupKey: '__proto__' },
  ]
  for (const input of inputs) {
    const { stripe, calls } = fakeStripe()
    await assert.rejects(
      checkout.ltdCheckoutParams(stripe, input),
      (error) => error.statusCode === 400
    )
    assert.equal(calls.price.length, 0)
    assert.equal(calls.created.length, 0)
  }
})

test('Changed price, currency, recurring price, and inactive price fail before coupon or payment creation', async () => {
  for (const price of [
    { unit_amount: 5900 },
    { currency: 'eur' },
    { type: 'recurring' },
    { active: false },
  ]) {
    const { stripe, calls } = fakeStripe(undefined, { price })
    await assert.rejects(
      checkout.ltdCheckoutParams(stripe, {
        lookupKey: 'standard',
        via: 'kenmoo',
      }),
      (error) => error.statusCode === 503
    )
    assert.equal(calls.coupon.length, 0)
    assert.equal(calls.sessions.length, 0)
  }
})

test('Expired, changed, or inapplicable coupons never fall back to a full-price checkout', async () => {
  for (const coupon of [
    { valid: false },
    { percent_off: 25 },
    { duration: 'forever' },
    { applies_to: { products: ['another_product'] } },
    { applies_to: undefined },
  ]) {
    const { stripe } = fakeStripe(undefined, { coupon })
    await assert.rejects(
      checkout.ltdCheckoutParams(stripe, {
        lookupKey: 'standard',
        via: 'kenmoo',
      }),
      (error) => error.statusCode === 503
    )
  }
})

test('Checkout never creates the coupon or code; a missing coupon is unavailable and a deactivated, expired, or used-up code ends the offer', async () => {
  const { stripe: missingStripe, calls: missingCalls } = fakeStripe(undefined, {
    missing: true,
  })
  await assert.rejects(
    checkout.ltdCheckoutParams(missingStripe, {
      lookupKey: 'standard',
      via: 'kenmoo',
    }),
    (error) => error.statusCode === 503
  )
  assert.equal(missingCalls.promo.length + missingCalls.created.length, 0)
  for (const overrides of [
    { noPromotionCode: true },
    { promotionCode: { expires_at: Math.floor(Date.now() / 1000) - 60 } },
    { promotionCode: { max_redemptions: 10, times_redeemed: 10 } },
  ]) {
    const { stripe, calls } = fakeStripe(undefined, overrides)
    await assert.rejects(
      checkout.ltdCheckoutParams(stripe, {
        lookupKey: 'standard',
        via: 'kenmoo',
      }),
      (error) => error.statusCode === 410 && /ended/.test(error.message)
    )
    assert.equal(calls.created.length, 0)
  }
  const { stripe } = fakeStripe(undefined, {
    promotionCode: {
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      max_redemptions: 10,
      times_redeemed: 9,
    },
  })
  assert.deepEqual(
    clone(
      (
        await checkout.ltdCheckoutParams(stripe, {
          lookupKey: 'standard',
          via: 'kenmoo',
        })
      ).discounts
    ),
    [{ promotion_code: 'promo_kenmoo' }]
  )
})

test('Stripe failures propagate without a checkout fallback', async () => {
  for (const overrides of [
    { retrieveError: { code: 'api_connection_error' } },
    { listError: { code: 'api_connection_error' } },
  ]) {
    const { stripe, calls } = fakeStripe(undefined, overrides)
    await assert.rejects(
      checkout.ltdCheckoutParams(stripe, {
        lookupKey: 'standard',
        via: 'kenmoo',
      })
    )
    assert.equal(calls.sessions.length, 0)
  }
})

function affiliateJourneyLib(
  fetch = async () => {
    throw new Error('No Worker call expected')
  }
) {
  const globals = { fetch, AbortSignal, JSON }
  const workerApi = load('src/lib/worker-api.ts', {}, { globals })
  return load(
    'src/lib/affiliate-journey.ts',
    { './worker-api': workerApi },
    { globals }
  )
}
function handlerFor(stripe, route = 'ltd_checkout', env = {}, fetch) {
  const auth = load(
    'src/utils/auth.ts',
    {
      '@supabase/supabase-js': {
        createClient: () => ({
          auth: {
            async getUser(token) {
              return token === 'verified_token'
                ? {
                    data: {
                      user: { id: 'user_1', email: 'verified@example.com' },
                    },
                  }
                : { error: new Error('Invalid token') }
            },
          },
        }),
      },
    },
    {
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test_key',
    }
  )
  function Stripe() {
    return stripe
  }
  const prices = load('src/lib/stripe-prices.ts')
  const discount = load(
    'src/lib/affiliate-discount.ts',
    { './stripe-prices': prices },
    { globals: { Date, Promise } }
  )
  return load(
    `src/pages/api/subscription/${route}.ts`,
    {
      stripe: Stripe,
      '@/utils/auth': auth,
      '@/i18n/locale': localeTools,
      '@/data/ltdOffer': data,
      '@/lib/ltd-checkout': checkout,
      '@/lib/affiliate-journey': affiliateJourneyLib(fetch),
      '@/lib/affiliate-discount': discount,
      '@/lib/stripe-prices': prices,
    },
    { NODE_ENV: 'production', STRIPE_SECRET_KEY: 'test_key', ...env }
  ).default
}
function response() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(k, v) {
      this.headers[k] = v
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(value) {
      this.body = clone(value)
      return this
    },
    end(value) {
      if (value !== undefined) this.body = value
      return this
    },
  }
}
function request(body = {}, options = {}) {
  return {
    method: 'POST',
    body,
    cookies: { 'sb-uihahglfncxadigplxnw-auth-token': '[]' },
    headers: {
      authorization: 'Bearer verified_token',
      origin: 'https://attacker.example',
      host: 'attacker.example',
    },
    ...options,
  }
}

test('The API rejects missing or forged authentication without touching Stripe', async () => {
  for (const authorization of [undefined, 'Bearer forged_token']) {
    const { stripe, calls } = fakeStripe()
    const res = response()
    await handlerFor(stripe)(
      request({ lookupKey: 'standard' }, { headers: { authorization } }),
      res
    )
    assert.equal(res.statusCode, 401)
    assert.equal(calls.price.length, 0)
    assert.equal(calls.sessions.length, 0)
  }
})

test('The API preserves fulfillment identity, Stripe tax, and invoices; ignores client redirects and identity', async () => {
  for (const plan of data.ltdPlans) {
    const { stripe, calls } = fakeStripe(plan)
    const res = response()
    await handlerFor(stripe)(
      request({
        lookupKey: plan.key,
        via: 'kenmoo',
        email: 'attacker@example.com',
        returnUrl: 'https://attacker.example',
        endorsely_referral: 'partner',
      }),
      res
    )
    assert.equal(res.statusCode, 200)
    const params = calls.sessions[0]
    assert.equal(params.mode, 'payment')
    assert.equal(params.client_reference_id, 'verified@example.com')
    assert.equal(params.customer_email, 'verified@example.com')
    assert(
      params.success_url.startsWith('https://www.enconvo.com/pay_success?')
    )
    assert.equal(
      params.cancel_url,
      `https://www.enconvo.com/ltd?canceled=true&plan=${plan.key}&via=kenmoo`
    )
    assert.equal(params.allow_promotion_codes, undefined)
    assert.deepEqual(params.automatic_tax, { enabled: true })
    assert.deepEqual(params.invoice_creation, { enabled: true })
    assert.equal(
      params.metadata.endorsely_referral,
      undefined,
      'Endorsely is retired (ADR 0090)'
    )
    assert.equal(params.metadata.campaign, data.LTD_OFFER.couponId)
  }
})

test('Wrong HTTP method, invalid plan, coupon failure, and session failure return recoverable errors', async () => {
  for (const scenario of [
    { options: { method: 'GET' }, status: 405 },
    { body: { lookupKey: 'monthly' }, status: 400 },
    { overrides: { coupon: { percent_off: 20 } }, status: 503 },
    { overrides: { noPromotionCode: true }, status: 410 },
    {
      overrides: { sessionError: new Error('Stripe unavailable') },
      status: 503,
    },
  ]) {
    const { stripe } = fakeStripe(undefined, scenario.overrides)
    const res = response()
    await handlerFor(stripe)(
      request(
        scenario.body || { lookupKey: 'standard', via: 'kenmoo' },
        scenario.options
      ),
      res
    )
    assert.equal(res.statusCode, scenario.status)
    assert.equal(typeof res.body.error, 'string')
  }
})

const VISITOR = '0f6c2a8e3b1d4c5e9a7f1234567890ab'
function workerFetch(
  reply = async () => ({
    ok: true,
    status: 200,
    async json() {
      return { code: 200, data: { recorded: true } }
    },
  })
) {
  const calls = []
  return {
    calls,
    fetch: async (url, init) => {
      calls.push({
        url,
        init: { ...init, signal: undefined },
        signal: init.signal,
      })
      return reply(url, init)
    },
  }
}
const withJourney = (body, cookie = `${VISITOR}.kenmoo`) =>
  request(body, {
    cookies: {
      'sb-uihahglfncxadigplxnw-auth-token': '[]',
      enconvo_via: cookie,
    },
  })

test('Both checkouts name the Affiliate journey in Stripe metadata and record the Checkout step with the verified token', async () => {
  for (const route of ['ltd_checkout', 'checkout_sessions']) {
    const { stripe, calls } = fakeStripe()
    const worker = workerFetch()
    const res = response()
    await handlerFor(
      stripe,
      route,
      {},
      worker.fetch
    )(withJourney({ lookupKey: 'standard', via: 'kenmoo' }), res)
    assert.equal(res.statusCode, 200)
    assert.equal(calls.sessions[0].metadata.via, 'kenmoo')
    assert.equal(calls.sessions[0].metadata.via_visitor, VISITOR)
    const steps = worker.calls.filter(
      (call) => call.url === 'https://api.enconvo.com/api/affiliate/checkout'
    )
    assert.equal(steps.length, 1)
    assert.equal(steps[0].init.headers.accessToken, 'verified_token')
    assert.deepEqual(JSON.parse(steps[0].init.body), {
      visitor: VISITOR,
      session: 'cs_test_a1b2c3d4e5f6g7h8',
      plan: 'standard',
    })
    assert(steps[0].signal, 'the Worker call is bounded by a timeout')
  }
})

test('A checkout without a valid journey cookie adds no journey metadata and calls no Worker', async () => {
  for (const route of ['ltd_checkout', 'checkout_sessions']) {
    for (const cookie of [
      undefined,
      'not-a-journey',
      `${VISITOR}.ken moo`,
      `short.kenmoo`,
    ]) {
      const { stripe, calls } = fakeStripe()
      const worker = workerFetch()
      const res = response()
      const req =
        cookie === undefined
          ? request({ lookupKey: 'standard', via: 'kenmoo' })
          : withJourney({ lookupKey: 'standard', via: 'kenmoo' }, cookie)
      await handlerFor(stripe, route, {}, worker.fetch)(req, res)
      assert.equal(res.statusCode, 200)
      assert.equal(calls.sessions[0].metadata.via, undefined)
      assert.equal(calls.sessions[0].metadata.via_visitor, undefined)
      assert.equal(worker.calls.length, 0)
    }
  }
})

test('A failing or refusing Worker never blocks the Checkout', async () => {
  for (const reply of [
    async () => {
      throw new Error('network down')
    },
    async () => ({
      ok: false,
      status: 500,
      async json() {
        throw new Error('not json')
      },
    }),
    async () => ({
      ok: false,
      status: 400,
      async json() {
        return { code: 400, reason: 'invalid_checkout', message: 'no' }
      },
    }),
  ]) {
    for (const route of ['ltd_checkout', 'checkout_sessions']) {
      const { stripe } = fakeStripe()
      const res = response()
      await handlerFor(
        stripe,
        route,
        {},
        workerFetch(reply).fetch
      )(withJourney({ lookupKey: 'standard', via: 'kenmoo' }), res)
      assert.equal(res.statusCode, 200)
      assert.equal(
        res.body.url,
        'https://checkout.stripe.com/c/pay/test_session'
      )
    }
  }
})

test('A ?via visit starts a journey cookie, keeps its visitor across codes, and reports only path and referrer', async () => {
  const worker = workerFetch()
  let jar = ''
  const document = {
    get cookie() {
      return jar
    },
    set cookie(value) {
      jar = value.split(';')[0]
    },
    referrer: 'https://www.kenmoo.com/deals/enconvo',
  }
  const workerApi = load(
    'src/lib/worker-api.ts',
    {},
    { globals: { fetch: worker.fetch, JSON } }
  )
  const lib = load(
    'src/lib/affiliate-journey.ts',
    { './worker-api': workerApi },
    {
      globals: {
        fetch: worker.fetch,
        JSON,
        document,
        crypto: globalThis.crypto,
        Uint8Array,
        Array,
        location: { protocol: 'https:', pathname: '/ltd' },
      },
    }
  )
  const visits = () =>
    worker.calls.filter(
      (call) => call.url === 'https://api.enconvo.com/api/affiliate/visit'
    )
  const first = await lib.recordAffiliateVisit('kenmoo')
  assert.match(first.visitor, /^[0-9a-f]{32}$/)
  assert.equal(jar, `enconvo_via=${first.visitor}.kenmoo`)
  assert.deepEqual(JSON.parse(visits()[0].init.body), {
    visitor: first.visitor,
    via: 'kenmoo',
    path: '/ltd',
    referrer: 'https://www.kenmoo.com/deals/enconvo',
  })
  const second = await lib.recordAffiliateVisit('another-partner')
  assert.equal(second.visitor, first.visitor)
  assert.equal(lib.readAffiliateJourney().via, 'another-partner')
  assert.equal(await lib.recordAffiliateVisit('bad code'), null)
  assert.equal(visits().length, 2)
})

test('Regular checkout remains full price and uses the same license IDs required by fulfillment', async () => {
  for (const plan of data.ltdPlans) {
    const { stripe, calls } = fakeStripe(plan)
    const res = response()
    await handlerFor(stripe, 'checkout_sessions')(
      request({ lookupKey: plan.key }),
      res
    )
    assert.equal(res.statusCode, 200)
    assert.deepEqual(calls.sessions[0].line_items, [
      { price: plan.priceId, quantity: 1 },
    ])
    assert.equal(calls.sessions[0].discounts, undefined)
    assert.equal(calls.sessions[0].allow_promotion_codes, true)
  }
})

// useState call order in LtdPage, so a test can render a later UI state.
const PAGE_STATE = { loadingPlan: 0, error: 1, claimed: 2, fit: 3 }
function pageFor({
  state = {},
  session = null,
  sessionError = null,
  status = 200,
  result = { url: 'https://checkout.stripe.com/c/pay/test_session' },
  query = { via: 'kenmoo' },
  isReady = true,
  initialAffiliateCode = typeof query.via === 'string' ? query.via : null,
} = {}) {
  const calls = { pushes: [], fetches: [], redirects: [], states: [] }
  const router = {
    isReady,
    query,
    async push(url) {
      calls.pushes.push(url)
    },
  }
  const jsx = (type, props) => ({ type, props })
  const i18nText = load('src/i18n/I18nText.tsx', {
    'react/jsx-runtime': { jsx, jsxs: jsx },
    react: { Fragment: 'fragment' },
    './I18nProvider': i18n,
  })
  const initial = Object.fromEntries(
    Object.entries(state).map(([name, value]) => [PAGE_STATE[name], value])
  )
  let hook = 0
  const pageModule = load(
    'src/pages/ltd.tsx',
    {
      'react/jsx-runtime': { jsx, jsxs: jsx },
      '@/i18n/locale': localeTools,
      '@/i18n/I18nProvider': i18n,
      '@/i18n/server': i18nServer,
      '@/i18n/I18nText': i18nText,
      react: {
        useEffect() {},
        useRef: (value) => ({ current: value }),
        useState: (value) => {
          const index = hook++
          return [
            index in initial ? initial[index] : value,
            (next) => calls.states.push(next),
          ]
        },
      },
      'next/head': () => null,
      'next/image': () => null,
      'next/link': () => null,
      'next/router': { useRouter: () => router },
      '@radix-ui/react-icons': Object.fromEntries(
        [
          'ArrowRightIcon',
          'CheckIcon',
          'CounterClockwiseClockIcon',
          'Cross2Icon',
          'DownloadIcon',
          'LaptopIcon',
          'LightningBoltIcon',
          'LockClosedIcon',
          'ReaderIcon',
          'ReloadIcon',
          'VideoIcon',
        ].map((name) => [name, () => null])
      ),
      '@/components/HeroShowcase': { HeroShowcase: () => null },
      '@/components/home/HeroLayout': { HeroLayout: () => null },
      '@/lib/analytics': { trackEvent() {} },
      '@/lib/ltd-confetti': {
        burstConfetti() {
          calls.confetti = (calls.confetti || 0) + 1
        },
      },
      '@/data/ltdOffer': data,
      '@/styles/Ltd.module.css': {},
      '@/styles/Home.module.css': {},
      '@/lib/supabase': {
        supabase: {
          auth: {
            async getSession() {
              return { data: { session }, error: sessionError }
            },
          },
        },
      },
    },
    {
      globals: {
        window: { location: { assign: (url) => calls.redirects.push(url) } },
        fetch: async (url, options) => {
          calls.fetches.push({ url, ...clone(options) })
          return {
            status,
            ok: status >= 200 && status < 300,
            async json() {
              return result
            },
          }
        },
      },
    }
  )
  // Checkout buttons in page order: the returning buyer's continue button, then one per plan.
  const buttons = []
  const tickets = []
  function visit(node) {
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    if (!node || typeof node !== 'object') return
    if (node.type === 'button' && node.props?.['data-checkout'])
      buttons.push(node)
    if (node.type === 'button' && node.props?.['data-ticket'])
      tickets.push(node)
    visit(node.props?.children)
  }
  const tree = pageModule.default({ initialAffiliateCode })
  visit(tree)
  return {
    calls,
    buttons,
    tickets,
    tree,
    getServerSideProps: pageModule.getServerSideProps,
  }
}

test('Purchase buttons send signed-out buyers back to the selected discounted offer after sign-in', async () => {
  for (let index = 0; index < data.ltdPlans.length; index++) {
    const { calls, buttons } = pageFor()
    await buttons[index].props.onClick()
    assert.equal(
      calls.pushes[0],
      data.ltdLoginUrl(data.ltdPlans[index], 'kenmoo')
    )
    assert.equal(calls.fetches.length, 0)
    assert.equal(calls.redirects.length, 0)
  }
})

test('Signed-in purchases use the dedicated offer endpoint, verified token, and only one in-flight request', async () => {
  const { calls, buttons } = pageFor({
    session: { access_token: 'verified_token' },
  })
  await Promise.all([buttons[1].props.onClick(), buttons[1].props.onClick()])
  assert.equal(calls.fetches.length, 1)
  assert.equal(calls.fetches[0].url, '/api/subscription/ltd_checkout')
  assert.equal(calls.fetches[0].headers.Authorization, 'Bearer verified_token')
  assert.deepEqual(JSON.parse(calls.fetches[0].body), {
    lookupKey: 'premium',
    via: 'kenmoo',
    locale: 'en',
  })
  assert.deepEqual(calls.redirects, [
    'https://checkout.stripe.com/c/pay/test_session',
  ])
})

test('Expired sign-in returns to the same offer; unavailable checkout and unsafe redirects show an error', async () => {
  const expired = pageFor({ session: { access_token: 'expired' }, status: 401 })
  await expired.buttons[2].props.onClick()
  assert.equal(
    expired.calls.pushes[0],
    data.ltdLoginUrl(data.ltdPlans[2], 'kenmoo')
  )
  for (const scenario of [
    { sessionError: new Error('Sign-in service unavailable') },
    {
      status: 503,
      result: { error: 'This offer is temporarily unavailable.' },
    },
    { result: { url: 'https://attacker.example/checkout' } },
  ]) {
    const { calls, buttons } = pageFor({
      session: { access_token: 'verified_token' },
      ...scenario,
    })
    await buttons[0].props.onClick()
    assert.equal(calls.redirects.length, 0)
    assert(
      calls.states.some(
        (state) =>
          state?.plan === 'standard' && typeof state.message === 'string'
      )
    )
    assert.equal(calls.states.at(-1), null)
  }
})

test('A KenMoo buyer goes straight to checkout without waiting for a tracking script, and cancel keeps the public code', async () => {
  const { calls, buttons } = pageFor({
    session: { access_token: 'verified_token' },
  })
  await buttons[0].props.onClick()
  assert.deepEqual(JSON.parse(calls.fetches[0].body), {
    lookupKey: 'standard',
    via: 'kenmoo',
    locale: 'en',
  })
  for (const plan of data.ltdPlans) {
    const { stripe, calls } = fakeStripe(plan)
    const res = response()
    await handlerFor(stripe)(
      request({
        lookupKey: plan.key,
        endorsely_referral: 'visit_kenmoo_123',
        via: 'kenmoo',
      }),
      res
    )
    assert.equal(res.statusCode, 200)
    assert.equal(calls.sessions[0].metadata.endorsely_referral, undefined)
    assert.deepEqual(calls.sessions[0].discounts, [
      { promotion_code: 'promo_kenmoo' },
    ])
    const cancel = new URL(calls.sessions[0].cancel_url)
    assert.equal(cancel.searchParams.get('via'), 'kenmoo')
    assert.equal(cancel.searchParams.get('plan'), plan.key)
    assert.equal(cancel.searchParams.has('referral'), false)
  }
})

test('Plain visitors buy without a code and keep the normal five-device fulfillment', async () => {
  const plain = pageFor({
    session: { access_token: 'verified_token' },
    query: {},
  })
  await plain.buttons[2].props.onClick()
  const body = JSON.parse(plain.calls.fetches[0].body)
  assert.deepEqual(body, { lookupKey: 'teams', locale: 'en' })
  const { stripe, calls: stripeCalls } = fakeStripe(data.ltdPlans[2])
  const res = response()
  await handlerFor(stripe)(request(body), res)
  assert.equal(res.statusCode, 200)
  assert.equal(stripeCalls.sessions[0].discounts, undefined)
})

test('The regular checkout no longer sends Endorsely attribution to Stripe', async () => {
  const { stripe, calls } = fakeStripe()
  const res = response()
  await handlerFor(stripe, 'checkout_sessions')(
    request({ lookupKey: 'standard', endorsely_referral: 'visit_kenmoo_123' }),
    res
  )
  assert.equal(res.statusCode, 200)
  assert.deepEqual(calls.sessions[0].metadata, {})
})

const nonKenmooCodes = [
  undefined,
  null,
  '',
  'another-partner',
  'KenMoo',
  'KENMOO',
  'kenmoo ',
  ['kenmoo'],
  ['kenmoo', 'another-partner'],
  { via: 'kenmoo' },
]

test('Only the exact KenMoo code grants the discount; attribution and client coupon fields cannot grant it', async () => {
  for (const via of nonKenmooCodes) {
    assert.equal(data.isLtdOfferEligible(via), false)
    for (const plan of data.ltdPlans) {
      assert.equal(data.ltdPriceCents(plan, via), plan.originalCents)
      const { stripe, calls } = fakeStripe(plan, {
        missing: true,
        coupon: { valid: false },
      })
      const res = response()
      await handlerFor(stripe)(
        request({
          lookupKey: plan.key,
          via,
          coupon: data.LTD_OFFER.couponId,
          discountPercent: 50,
        }),
        res
      )
      assert.equal(res.statusCode, 200)
      assert.deepEqual(calls.sessions[0].line_items, [
        { price: plan.priceId, quantity: 1 },
      ])
      assert.equal(calls.sessions[0].discounts, undefined)
      assert.equal(calls.sessions[0].metadata.campaign, 'enconvo-ltd')
      assert.equal(
        calls.coupon.length + calls.promo.length + calls.created.length,
        0
      )
    }
  }
})

function nodesIn(tree) {
  const result = []
  function visit(node) {
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    if (node == null || typeof node === 'boolean') return
    if (typeof node?.type === 'function' && node.type.name === 'I18nText') {
      visit(node.type(node.props))
      return
    }
    result.push(node)
    if (typeof node === 'object') visit(node.props?.children)
  }
  visit(tree)
  return result
}

test('Displayed prices, community icon, copy, and sharing links match eligibility for every entry code', () => {
  for (const via of ['kenmoo', ...nonKenmooCodes]) {
    const eligible = via === 'kenmoo'
    const { tree } = pageFor({ query: { via } })
    const nodes = nodesIn(tree)
    const text = nodes.filter((n) => typeof n === 'string').join('')
    assert.equal(
      nodes.some((n) => n.props?.src === data.LTD_OFFER.communityIcon),
      eligible
    )
    assert.equal(
      nodes.some((n) => n.props?.href === data.LTD_OFFER.communityUrl),
      eligible
    )
    assert.equal(
      nodes
        .filter((n) => n.type === 'article')
        .flatMap(nodesIn)
        .filter((n) => n.type === 's').length,
      eligible ? 3 : 0
    )
    assert.equal(
      nodes.some((n) => n.type === 's'),
      eligible
    )
    assert.equal(text.includes('Half the price.'), false)
    assert.equal(
      nodes.some((n) => n.props?.['data-ticket']),
      eligible
    )
    assert.equal(text.includes('Your KenMoo 40% discount'), eligible)
    const priceNodes = nodes
      .filter((n) => n.type === 'article')
      .map((article) =>
        nodesIn(article)
          .filter((n) => typeof n === 'string')
          .join(' ')
      )
    for (const [index, plan] of data.ltdPlans.entries()) {
      const price = eligible ? plan.originalCents * 0.6 : plan.originalCents
      assert(priceNodes[index].includes(data.formatUsd(price)))
      if (!eligible)
        assert(
          !priceNodes[index].includes(data.formatUsd(plan.originalCents * 0.6))
        )
    }
    const sharedUrl = nodes.find((n) => n.props?.property === 'og:url').props
      .content
    assert.equal(
      new URL(sharedUrl).searchParams.get('via'),
      eligible ? 'kenmoo' : null
    )
    for (const node of nodes.filter((n) => n.props?.content)) {
      if (!eligible)
        assert(!/40%|\$29\.40|\$59\.40|\$83\.40/.test(node.props.content))
      else if (
        node.props.name === 'description' ||
        node.props.property === 'og:description'
      )
        assert(
          /40% off.*\$29\.40, \$59\.40, and \$83\.40.*30-day money-back guarantee/.test(
            node.props.content
          )
        )
    }
  }
})

test('Server-rendered offers have the correct branding and price before hydration and cannot accept duplicate via parameters', async () => {
  const module = pageFor()
  for (const via of [
    'kenmoo',
    undefined,
    'another-partner',
    ['kenmoo', 'kenmoo'],
  ]) {
    const { props } = await module.getServerSideProps({ query: { via } })
    const { tree, buttons } = pageFor({ isReady: false, query: {}, ...props })
    const nodes = nodesIn(tree)
    assert.equal(
      nodes.some((n) => n.props?.src === data.LTD_OFFER.communityIcon),
      via === 'kenmoo'
    )
    const text = nodes.filter((n) => typeof n === 'string').join(' ')
    assert.equal(text.includes('$29.40'), via === 'kenmoo')
    assert(buttons.every((button) => button.props.disabled))
  }
})

test('Full-price returns retain the affiliate attribution and never silently regain the KenMoo discount', async () => {
  const { calls, buttons } = pageFor({ query: { via: 'another-partner' } })
  await buttons[1].props.onClick()
  const login = new URL(calls.pushes[0], 'https://www.enconvo.com')
  const back = new URL(login.searchParams.get('returnUrl'), login.origin)
  assert.equal(back.searchParams.get('via'), 'another-partner')
  assert.equal(
    data.ltdPriceCents(data.ltdPlans[1], back.searchParams.get('via')),
    9900
  )
})

test('Sign-in and registration return to the offer with its plan and public code', () => {
  for (const code of ['kenmoo', undefined]) {
    const login = new URL(
      data.ltdLoginUrl(data.ltdPlans[1], code),
      'https://www.enconvo.com'
    )
    const offer = new URL(login.searchParams.get('returnUrl'), login.origin)
    assert.equal(offer.pathname, data.LTD_OFFER.path)
    assert.equal(offer.searchParams.get('plan'), 'premium')
    assert.equal(offer.searchParams.get('via'), code || null)
    assert.equal(offer.searchParams.has('referral'), false)
  }
})

test('Email registration confirmation retains the LTD plan and affiliate, and preserves existing native signup', async () => {
  for (const returnUrl of [
    '/ltd?plan=premium&via=kenmoo&referral=visit_kenmoo_123',
    ['/ltd?plan=teams&referral=visit_from_homepage'],
    undefined,
  ]) {
    const calls = []
    const jsx = (type, props) => ({ type, props })
    const noop = () => null
    const react = { useState: (value) => [value, noop] }
    const register = load(
      'src/pages/components/RegisterForm.tsx',
      {
        'react/jsx-runtime': { jsx, jsxs: jsx },
        '@/i18n/locale': localeTools,
        '@/i18n/I18nProvider': i18n,
        '@/i18n/server': i18nServer,
        react,
        'next/head': noop,
        'next/link': noop,
        '@radix-ui/react-icons': {
          ReloadIcon: noop,
          ArrowTopRightIcon: noop,
          ExclamationTriangleIcon: noop,
        },
        '@/components/ui/button': { Button: noop },
        '@/components/ui/input': { Input: noop },
        '@/components/Logo': { Logo: noop },
        '@/components/ui/alert': {
          Alert: noop,
          AlertDescription: noop,
          AlertTitle: noop,
        },
        '@/lib/email-preferences-client': {
          saveRegistrationEmailPreference: noop,
          syncCurrentEmailPreference: noop,
        },
        'next/router': { useRouter: () => ({ query: { returnUrl } }) },
        '@supabase/auth-helpers-nextjs': {
          createClientComponentClient: () => ({
            auth: {
              async signUp(params) {
                calls.push(params)
                return { data: {} }
              },
            },
          }),
        },
      },
      {
        globals: {
          window: { location: { origin: 'https://www.enconvo.com' } },
        },
      }
    ).default
    let signup
    function visit(node) {
      if (Array.isArray(node)) {
        node.forEach(visit)
        return
      }
      if (!node || typeof node !== 'object') return
      if (node.props?.onClick?.name === 'signUp') signup = node.props.onClick
      visit(node.props?.children)
    }
    visit(
      register({
        email: 'buyer@example.com',
        setEmail: noop,
        setLoginState: noop,
      })
    )
    assert(signup, 'The registration button must use the verified signup flow')
    await signup()
    const destination = new URL(calls[0].options.emailRedirectTo)
    if (returnUrl) {
      assert.equal(destination.pathname, '/auth/callback')
      assert.equal(
        destination.searchParams.get('returnUrl'),
        Array.isArray(returnUrl) ? returnUrl[0] : returnUrl
      )
      assert.equal(destination.searchParams.has('from'), false)
    } else {
      assert.equal(destination.pathname, '/login')
      assert.equal(destination.searchParams.get('from'), 'app')
    }
  }
})

test('Buyers returning with a selected plan can continue straight to checkout for that plan', async () => {
  for (const canceled of [false, true]) {
    const { calls, buttons } = pageFor({
      query: {
        via: 'kenmoo',
        plan: 'teams',
        ...(canceled ? { canceled: 'true' } : {}),
      },
    })
    assert.equal(buttons.length, data.ltdPlans.length + 1)
    const label = nodesIn(buttons[0])
      .filter((n) => typeof n === 'string')
      .join(' ')
    assert(
      label.includes(canceled ? 'Return to checkout' : 'Continue to checkout')
    )
    await buttons[0].props.onClick()
    assert.equal(calls.pushes[0], data.ltdLoginUrl(data.ltdPlans[2], 'kenmoo'))
  }
  assert.equal(
    pageFor({ query: { via: 'kenmoo', plan: 'lifetime' } }).buttons.length,
    data.ltdPlans.length
  )
})

test('Multi-Mac plans show the per-Mac price of the amount the buyer will actually pay', () => {
  const expected = {
    kenmoo: { premium: '$19.80', teams: '$16.68' },
    'another-partner': { premium: '$33.00', teams: '$27.80' },
  }
  for (const [via, perMac] of Object.entries(expected)) {
    const articles = nodesIn(pageFor({ query: { via } }).tree).filter(
      (n) => n.type === 'article'
    )
    for (const [index, plan] of data.ltdPlans.entries()) {
      const text = nodesIn(articles[index])
        .filter((n) => typeof n === 'string')
        .join(' ')
      if (perMac[plan.key])
        assert(
          text.includes(`${perMac[plan.key]} per Mac`),
          `${via} ${plan.key}: ${text}`
        )
      else assert(!text.includes('per Mac'))
    }
  }
})

const textOf = (tree) =>
  nodesIn(tree)
    .filter((n) => typeof n === 'string')
    .join('')

test('Only the KenMoo offer shows the claimable ticket, and claiming it never gates the discount', () => {
  assert.equal(pageFor({ query: { via: 'another-partner' } }).tickets.length, 0)
  const { calls, tickets, tree } = pageFor()
  assert.equal(tickets.length, 1)
  assert.equal(tickets[0].props['aria-pressed'], false)
  // Prices are already discounted before the ticket is claimed.
  const prices = nodesIn(tree)
    .filter((n) => n.type === 'article')
    .map(textOf)
  data.ltdPlans.forEach((plan, index) =>
    assert(
      prices[index].includes(data.formatUsd(data.ltdPriceCents(plan, 'kenmoo')))
    )
  )
  tickets[0].props.onClick({
    currentTarget: {
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 300,
        height: 400,
      }),
    },
  })
  assert.equal(calls.confetti, 1)
  assert.deepEqual(calls.states, [true])
  assert.equal(
    pageFor({ state: { claimed: true } }).tickets[0].props['aria-pressed'],
    true
  )
  assert.equal(
    pageFor({ query: { via: 'kenmoo', plan: 'premium' } }).tickets[0].props[
      'aria-pressed'
    ],
    true
  )
})

test('The Mac-count finder matches each answer to the right plan at the price the buyer will pay', () => {
  const fits = {
    standard: ['$29.40 once.', 'You save $19.60.'],
    premium: ['$59.40 once ($19.80 per Mac).', 'You save $39.60.'],
    teams: ['$83.40 once ($16.68 per Mac).', 'You save $55.60.'],
  }
  for (const [plan, phrases] of Object.entries(fits)) {
    const { tree } = pageFor({ state: { fit: plan } })
    const nodes = nodesIn(tree)
    const radios = nodes.filter(
      (n) => n.type === 'input' && n.props.type === 'radio'
    )
    assert.deepEqual(
      clone(radios.map((radio) => radio.props.checked)),
      clone(data.ltdPlans.map((p) => p.key === plan))
    )
    assert.deepEqual(
      nodes
        .filter((n) => n.type === 'article' && n.props['data-fit'])
        .map((n) => n.props.id),
      [`deal-${plan}`]
    )
    const text = textOf(tree)
    for (const phrase of phrases)
      assert(text.includes(phrase), `${plan}: ${phrase}`)
  }
  const fullPrice = textOf(
    pageFor({ query: {}, state: { fit: 'premium' } }).tree
  )
  assert(fullPrice.includes('$99.00 once ($33.00 per Mac).'))
  assert(!fullPrice.includes('You save'))
})

test('Every plan shows the 30-day money-back guarantee and the page never invents urgency', () => {
  for (const query of [{ via: 'kenmoo' }, {}]) {
    const { tree } = pageFor({ query })
    const articles = nodesIn(tree).filter((n) => n.type === 'article')
    assert.equal(articles.length, 3)
    for (const article of articles)
      assert(textOf(article).includes('30-day money-back guarantee'))
    const text = textOf(tree)
    assert(
      !/limited time|ends (soon|in|on)|only \d+ left|spots left|hurry|countdown|expires/i.test(
        text
      )
    )
  }
})

test('Both checkout routes preserve every supported language in return URLs without changing the license or price', async () => {
  for (const locale of localeTools.locales) {
    for (const route of ['ltd_checkout', 'checkout_sessions']) {
      const { stripe, calls } = fakeStripe()
      const res = response()
      await handlerFor(stripe, route)(
        request(
          { lookupKey: 'standard', via: 'kenmoo', locale },
          {
            headers: {
              authorization: 'Bearer verified_token',
              origin: 'https://www.enconvo.com',
            },
          }
        ),
        res
      )
      assert.equal(res.statusCode, 200)
      const params = calls.sessions[0]
      const success = new URL(params.success_url)
      const cancel = new URL(params.cancel_url)
      assert.equal(
        success.pathname,
        localeTools.localizePath('/pay_success', locale)
      )
      assert.equal(
        cancel.pathname,
        localeTools.localizePath(
          route === 'ltd_checkout' ? '/ltd' : '/pay_success',
          locale
        )
      )
      assert.equal(params.line_items[0].price, data.ltdPlans[0].priceId)
      assert.equal(params.customer_email, 'verified@example.com')
      assert.equal(params.mode, 'payment')
    }
  }
})

test('Billing portal returns to the selected language and invalid language input falls back to English', async () => {
  for (const locale of [...localeTools.locales, '//external.example']) {
    let observed
    const stripe = {
      customers: {
        async list() {
          return { data: [{ id: 'cus_verified' }] }
        },
      },
      billingPortal: {
        sessions: {
          async create(params) {
            observed = params
            return { url: 'https://billing.stripe.com/test' }
          },
        },
      },
    }
    const res = response()
    await handlerFor(stripe, 'billing_portal')(
      request(
        { locale },
        {
          headers: {
            authorization: 'Bearer verified_token',
            origin: 'https://www.enconvo.com',
          },
        }
      ),
      res
    )
    assert.equal(res.statusCode, 200)
    assert.equal(observed.customer, 'cus_verified')
    assert.equal(
      new URL(observed.return_url).pathname,
      localeTools.localizePath('/account', localeTools.getLocale(locale))
    )
  }
})
