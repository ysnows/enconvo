import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import React from 'react'
import ts from 'typescript'

// Password sign-in through the Worker (lib/password-sign-in): a linked sign-in email signs in, the
// Worker's tokens become the browser's session, its refusals show their own message, and only a
// Worker that can't answer sends the sign-in to Supabase directly. No request leaves this process.

async function loadTs(path, mocks = {}) {
  const url = new URL(path, import.meta.url)
  const { outputText } = ts.transpileModule(await readFile(url, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  })
  const module = { exports: {} }
  const requireFromFile = createRequire(url)
  new Function('require', 'module', 'exports', outputText)(
    (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name]
      if (name.startsWith('@/')) throw new Error(`unmocked ${name} in ${path}`)
      return requireFromFile(name)
    },
    module,
    module.exports
  )
  return module.exports
}

const settle = async () => {
  for (let i = 0; i < 20; i++) await new Promise((resolve) => setImmediate(resolve))
}

const SIGNIN_URL = 'https://api.enconvo.com/auth/v1/password/signin'
const workerApi = await loadTs('../src/lib/worker-api.ts')
const lib = await loadTs('../src/lib/password-sign-in.ts', { '@/lib/worker-api': workerApi })

/** Replaces fetch for one test: `answers` maps a URL part to a response or a function of the request. */
function stubFetch(answers) {
  const requests = []
  const before = globalThis.fetch
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url, init })
    const key = Object.keys(answers).find((part) => url.includes(part))
    if (!key) throw new Error(`unexpected fetch ${url}`)
    const answer = typeof answers[key] === 'function' ? answers[key](url, init) : answers[key]
    if (answer instanceof Error) throw answer
    const { status = 200, body } = answer
    return {
      ok: status >= 200 && status < 300,
      status,
      // No body: a page that isn't JSON, such as the edge's error page.
      json: async () => {
        if (body === undefined) throw new SyntaxError('not JSON')
        return body
      },
    }
  }
  return { requests, restore: () => (globalThis.fetch = before) }
}

/** A Supabase client with one session, as the shared browser client keeps it. */
function supabaseClient({ setSessionError = null, password = null } = {}) {
  const calls = []
  const events = []
  let session = null
  const user = { id: 'user-1', email: 'hidden@privaterelay.appleid.com' }
  const save = (access, refresh) => {
    session = { access_token: access, refresh_token: refresh, expires_at: Math.floor(Date.now() / 1000) + 3600, user }
    events.push('SIGNED_IN')
    return session
  }
  const client = {
    calls,
    events,
    get session() {
      return session
    },
    auth: {
      async setSession(tokens) {
        calls.push(['setSession', tokens])
        if (setSessionError) return { data: { session: null, user: null }, error: setSessionError }
        return { data: { session: save(tokens.access_token, tokens.refresh_token), user }, error: null }
      },
      async signInWithPassword(credentials) {
        calls.push(['signInWithPassword', credentials])
        if (password?.error) return { data: { session: null, user: null }, error: password.error }
        return { data: { session: save('supabase-access', 'supabase-refresh'), user }, error: null }
      },
      async getSession() {
        return { data: { session } }
      },
      async getUser() {
        return { data: { user: session ? user : null }, error: null }
      },
      async refreshSession() {
        return { data: { session }, error: null }
      },
      async signOut() {
        session = null
        return { error: null }
      },
    },
  }
  return client
}

test('the Worker is asked with the email, password and platform, and analytics off without consent', async () => {
  const fetch = stubFetch({ '/auth/v1/password/signin': { body: { accessToken: 'a', refreshToken: 'r' } } })
  try {
    assert.deepEqual(await lib.requestPasswordSignIn('linked@example.test', 'pw', false), { kind: 'tokens', accessToken: 'a', refreshToken: 'r' })
    assert.equal(fetch.requests[0].url, SIGNIN_URL)
    assert.equal(fetch.requests[0].init.method, 'POST')
    assert.equal(fetch.requests[0].init.cache, 'no-store')
    assert.deepEqual(JSON.parse(fetch.requests[0].init.body), { email: 'linked@example.test', password: 'pw', platform: 'web' })
    assert.deepEqual(fetch.requests[0].init.headers, { 'Content-Type': 'application/json', analytics: 'off' })
    await lib.requestPasswordSignIn('linked@example.test', 'pw', true)
    assert.deepEqual(fetch.requests[1].init.headers, { 'Content-Type': 'application/json' })
  } finally {
    fetch.restore()
  }
})

test('each Worker refusal has its own problem, and is final', async () => {
  for (const [status, code, problem] of [
    [401, 'invalid_credentials', 'invalid_credentials'],
    [403, 'email_unconfirmed', 'email_unconfirmed'],
    [403, 'account_blocked', 'account_blocked'],
    [403, 'account_unavailable', 'account_unavailable'],
    [429, 'too_many_tries', 'too_many_tries'],
    [400, 'invalid_email', 'invalid_email'],
    [400, 'bad_request', 'password_missing'],
    [409, 'something_new', 'failed'],
  ]) {
    const fetch = stubFetch({ '/auth/v1/password/signin': { status, body: { error: 'x', code, ...(status === 429 ? { retryAfter: 120 } : {}) } } })
    const supabase = supabaseClient()
    try {
      assert.deepEqual(await lib.requestPasswordSignIn('a@example.test', 'pw', true), { kind: 'refused', problem }, code)
      const result = await lib.signInWithPassword(supabase, 'a@example.test', 'pw', true)
      assert.deepEqual(result, { ok: false, problem, message: '' }, code)
      // A refusal never falls back to Supabase, which would sidestep the Worker's limits and checks.
      assert.deepEqual(supabase.calls, [], code)
    } finally {
      fetch.restore()
    }
  }
})

test('a Worker that can not answer sends the sign-in to Supabase directly', async () => {
  for (const [label, answer] of [
    ['network error', new TypeError('Failed to fetch')],
    ['5xx with a code', { status: 503, body: { error: 'couldn’t sign in right now', code: 'signin_failed' } }],
    ['502 page from the edge', { status: 502 }],
    ['404 without a code', { status: 404, body: { error: 'not found' } }],
    ['200 without tokens', { status: 200, body: { accessToken: 'a' } }],
  ]) {
    const fetch = stubFetch({ '/auth/v1/password/signin': answer })
    const supabase = supabaseClient()
    try {
      assert.deepEqual(await lib.requestPasswordSignIn('a@example.test', 'pw', true), { kind: 'unreachable' }, label)
      const result = await lib.signInWithPassword(supabase, 'a@example.test', 'pw', true)
      assert.equal(result.ok, true, label)
      assert.equal(result.session.access_token, 'supabase-access', label)
      assert.deepEqual(supabase.calls, [['signInWithPassword', { email: 'a@example.test', password: 'pw' }]], label)
    } finally {
      fetch.restore()
    }
  }
  // Supabase's own refusals on that way: the known ones get this site's message, others keep Supabase's text.
  for (const [error, problem, message] of [
    [{ message: 'Invalid login credentials', status: 400 }, 'invalid_credentials', 'Invalid login credentials'],
    [{ message: 'Email not confirmed', status: 400 }, 'email_unconfirmed', 'Email not confirmed'],
    [{ message: 'Request rate limit reached', status: 429 }, 'too_many_tries', 'Request rate limit reached'],
    [{ message: 'Something else', status: 400 }, null, 'Something else'],
    [{ message: '', status: 500 }, 'failed', ''],
  ]) {
    const fetch = stubFetch({ '/auth/v1/password/signin': new TypeError('offline') })
    try {
      const result = await lib.signInWithPassword(supabaseClient({ password: { error } }), 'a@example.test', 'pw', true)
      assert.deepEqual(result, { ok: false, problem, message }, error.message)
    } finally {
      fetch.restore()
    }
  }
})

test('the Worker’s tokens become the session; a session Supabase refuses is a failed sign-in', async () => {
  const fetch = stubFetch({ '/auth/v1/password/signin': { body: { accessToken: 'worker-access', refreshToken: 'worker-refresh' } } })
  try {
    const supabase = supabaseClient()
    const result = await lib.signInWithPassword(supabase, 'linked@example.test', 'pw', true)
    assert.equal(result.ok, true)
    assert.equal(result.session.access_token, 'worker-access')
    assert.equal(result.user.id, 'user-1')
    assert.deepEqual(supabase.calls, [['setSession', { access_token: 'worker-access', refresh_token: 'worker-refresh' }]])
    // setSession is what /login's SIGNED_IN listener (redirects, returnUrl, checkout) hears.
    assert.deepEqual(supabase.events, ['SIGNED_IN'])

    const refused = supabaseClient({ setSessionError: { message: 'Invalid JWT', status: 401 } })
    assert.deepEqual(await lib.signInWithPassword(refused, 'linked@example.test', 'pw', true), { ok: false, problem: 'failed', message: '' })
    assert.deepEqual(refused.calls.map(([name]) => name), ['setSession'])
  } finally {
    fetch.restore()
  }
})

test('every problem has a message, translated in every locale with the same placeholders', async () => {
  const problems = ['invalid_credentials', 'email_unconfirmed', 'account_blocked', 'account_unavailable', 'too_many_tries', 'invalid_email', 'password_missing', 'failed']
  const placeholders = (text) => (text.match(/\{\w+\}/g) ?? []).sort()
  const sources = new Set()
  for (const problem of problems) {
    const { source, values = {} } = lib.passwordSignInMessage(problem)
    assert.ok(source, problem)
    assert.deepEqual(placeholders(source), Object.keys(values).map((key) => `{${key}}`).sort(), problem)
    sources.add(source)
  }
  assert.equal(sources.size, problems.length, 'each problem has its own message')
  assert.equal(lib.passwordSignInMessage('account_blocked').values.p0, 'support@enconvo.com')
  for (const locale of ['zh-CN', 'zh-TW', 'ja', 'ko', 'es', 'de', 'fr', 'it', 'pt', 'nl', 'pl']) {
    const messages = JSON.parse(await readFile(new URL(`../src/i18n/messages/${locale}.json`, import.meta.url), 'utf8'))
    for (const source of sources) {
      assert.ok(messages[source], `${locale}: ${source}`)
      assert.deepEqual(placeholders(messages[source]), placeholders(source), `${locale}: ${source}`)
    }
  }
  // The login page ships them (the generated message map follows LoginForm's imports).
  const map = JSON.parse(await readFile(new URL('../src/i18n/message-map.json', import.meta.url), 'utf8'))
  for (const page of ['/login', '/auth']) for (const source of sources) assert.ok(map[page].includes(source) || map.common.includes(source), `${page}: ${source}`)
})

// LoginForm end to end: the shared Supabase client, the real NativeRouter and the Worker's routes.
async function loginForm(supabase) {
  const passthrough = ({ children }) => React.createElement('div', {}, children)
  const sets = []
  const authFlow = await loadTs('../src/lib/auth-flow.ts')
  const { NativeRouter } = await loadTs('../src/utils/app/native_router.ts', {
    '@/lib/supabase': { supabase },
    '@/lib/worker-api': workerApi,
  })
  const opened = []
  const Form = (
    await loadTs('../src/pages/components/LoginForm.tsx', {
      // Every empty field reads as filled in; each setter call is recorded.
      react: { ...React, useState: (value) => [value === '' ? 'linked@example.test' : value, (next) => sets.push(next)], useEffect() {} },
      'next/router': { useRouter: () => ({ query: {} }) },
      'next/head': { default: passthrough, __esModule: true },
      'next/link': { default: passthrough, __esModule: true },
      '@/i18n/I18nProvider': { useI18n: () => ({ t: (s, v = {}) => s.replace(/\{(\w+)\}/g, (m, k) => v[k] ?? m), locale: 'en' }) },
      '@/i18n/server': { i18nStaticProps: () => ({}) },
      '@/lib/auth-flow': authFlow,
      '@/lib/welcome-offer': { offerReturnPath: () => null },
      '@/lib/signup-analytics': { beginGoogleSignupMeasurement() {} },
      '@/lib/email-preferences-client': { syncCurrentEmailPreference: async (token) => opened.push(['email-preferences', token]) },
      '@/lib/apple-sign-in': { appleStartUrl: () => '', saveAppleSignInContext() {} },
      '@/lib/cookie-consent': { hasConsent: () => true },
      '@/lib/password-sign-in': lib,
      '@/lib/supabase': { createClientComponentClient: () => supabase },
      '@/utils/app/native_router': {
        NativeRouter: {
          openApp: async (...args) => {
            opened.push(['openApp', ...args])
            return NativeRouter.openApp(...args)
          },
        },
      },
      '@/components/ui/button': { Button: passthrough },
      '@/components/ui/input': { Input: () => null },
      '@/components/ui/alert': { Alert: passthrough, AlertDescription: passthrough, AlertTitle: passthrough },
      '@/components/Logo': { Logo: () => null },
    })
  ).default
  const findNode = (node, match) => {
    if (!node || typeof node !== 'object') return null
    if (match(node)) return node
    const children = node.props?.children
    return (Array.isArray(children) ? children : [children]).map((child) => findNode(child, match)).find(Boolean) ?? null
  }
  return async (query) => {
    const states = []
    const users = []
    sets.length = 0
    opened.length = 0
    const tree = Form({ loginState: 'login', setLoginState: (state) => states.push(state), setUser: (user) => users.push(user), router: { isReady: true, query } })
    findNode(tree, (node) => node.type === 'form').props.onSubmit({ preventDefault() {} })
    await settle()
    return { states, users, sets: [...sets], opened: [...opened] }
  }
}

test('a linked email signs in on /login and hands a session of its own to the Mac app', async () => {
  globalThis.window = { location: { href: '' } }
  globalThis.alert = (message) => assert.fail(`alert: ${message}`)
  try {
    // The Worker makes the app its own session from the browser's (handoff by the website).
    const fetch = stubFetch({
      '/auth/v1/password/signin': { body: { accessToken: 'worker-access', refreshToken: 'worker-refresh' } },
      '/api/app_session': (url, init) => {
        assert.equal(init.headers.Authorization, 'Bearer worker-access')
        return { body: { code: 200, data: { accessToken: 'app-access', refreshToken: 'app-refresh' } } }
      },
    })
    try {
      const supabase = supabaseClient()
      const submit = await loginForm(supabase)
      const run = await submit({ from: 'app', source: 'settings' })
      assert.deepEqual(supabase.calls.map(([name]) => name), ['setSession'])
      assert.equal(supabase.session.access_token, 'worker-access')
      assert.deepEqual(run.users, [{ id: 'user-1', email: 'hidden@privaterelay.appleid.com' }])
      assert.deepEqual(run.opened, [['openApp', 'settings', undefined], ['email-preferences', 'worker-access']])
      assert.equal(window.location.href, 'enconvo://login?access_token=app-access&refresh_token=app-refresh&source=settings')
      assert.deepEqual(run.states, ['success'])
      assert.deepEqual(fetch.requests.map(({ url }) => new URL(url).pathname), ['/auth/v1/password/signin', '/api/app_session'])

      // Apps that exchange the token themselves get the browser's access token at once.
      window.location.href = ''
      fetch.requests.length = 0
      const exchange = await submit({ from: 'app', source: 'guide', handoff: 'exchange' })
      assert.equal(window.location.href, 'enconvo://login?exchange_token=worker-access&source=guide')
      assert.deepEqual(exchange.states, ['success'])
      assert.deepEqual(fetch.requests.map(({ url }) => new URL(url).pathname), ['/auth/v1/password/signin'])
    } finally {
      fetch.restore()
    }

    // A refusal shows its message and goes nowhere.
    for (const [status, code, message] of [
      [401, 'invalid_credentials', 'Incorrect email or password.'],
      [403, 'account_blocked', 'This account can’t sign in. Email support@enconvo.com for help.'],
      [429, 'too_many_tries', 'Too many sign-in tries. Try again later.'],
    ]) {
      window.location.href = ''
      const fetch = stubFetch({ '/auth/v1/password/signin': { status, body: { error: 'x', code } } })
      try {
        const supabase = supabaseClient()
        const run = await (await loginForm(supabase))({ from: 'app', source: 'settings' })
        assert.ok(run.sets.includes(message), `${code}: ${JSON.stringify(run.sets)}`)
        assert.deepEqual(run.states, [], code)
        assert.deepEqual(run.opened, [], code)
        assert.deepEqual(supabase.calls, [], code)
        assert.equal(window.location.href, '', code)
      } finally {
        fetch.restore()
      }
    }

    // With the Worker down, the account's own email still signs in through Supabase and opens the app.
    window.location.href = ''
    const down = stubFetch({
      '/auth/v1/password/signin': new TypeError('Failed to fetch'),
      '/api/app_session': new TypeError('Failed to fetch'),
    })
    try {
      const supabase = supabaseClient()
      const run = await (await loginForm(supabase))({ from: 'app', source: 'settings' })
      assert.deepEqual(supabase.calls.map(([name]) => name), ['signInWithPassword'])
      // NativeRouter hands over the browser's own session once the auth service confirms it.
      assert.equal(window.location.href, 'enconvo://login?access_token=supabase-access&refresh_token=supabase-refresh&source=settings')
      assert.deepEqual(run.states, ['success'])
    } finally {
      down.restore()
    }
  } finally {
    delete globalThis.window
    delete globalThis.alert
  }
})
