import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

// The app's sign-in with a PKCE challenge (Android): every sign-in path carries the challenge back
// to /login, which hands the app a one-time code from the Worker (`native_handoff/create`), never
// tokens in the `enconvo://` link. Without a challenge (iOS, the Mac, older Android builds) the
// hand-off is unchanged. No request leaves this process.

async function loadTs(path, mocks = {}) {
  const url = new URL(path, import.meta.url)
  const { outputText } = ts.transpileModule(await readFile(url, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
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

const CHALLENGE = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
const CREATE = 'https://api.enconvo.com/api/native_handoff/create'
const authFlow = await loadTs('../src/lib/auth-flow.ts')
const workerApi = await loadTs('../src/lib/worker-api.ts')

/** The browser's Supabase client with one session; `expiresIn` seconds left on its access token. */
function supabaseClient({ expiresIn = 3600, refreshed = 'refreshed-access', signedOut = false } = {}) {
  const calls = []
  let session = { access_token: 'browser-access', refresh_token: 'browser-refresh', expires_at: Math.floor(Date.now() / 1000) + expiresIn }
  return {
    calls,
    auth: {
      async getSession() {
        return { data: { session } }
      },
      async refreshSession() {
        calls.push('refreshSession')
        session = { ...session, access_token: refreshed, expires_at: Math.floor(Date.now() / 1000) + 3600 }
        return { data: { session }, error: null }
      },
      async getUser() {
        calls.push('getUser')
        if (signedOut) return { data: { user: null }, error: { status: 403 } }
        return { data: { user: { id: 'u' } }, error: null }
      },
      async signOut(options) {
        calls.push(['signOut', options])
        session = null
        return { error: null }
      },
    },
  }
}

/** Replaces fetch: `answer(url, init)` returns `{ status, body }` or throws. */
function stubFetch(answer) {
  const requests = []
  const before = globalThis.fetch
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url, init })
    const { status = 200, body } = answer(url, init)
    return { ok: status >= 200 && status < 300, status, json: async () => body }
  }
  return { requests, restore: () => (globalThis.fetch = before) }
}

async function openApp(supabase, ...args) {
  const { NativeRouter } = await loadTs('../src/utils/app/native_router.ts', {
    '@/lib/supabase': { supabase },
    '@/lib/worker-api': workerApi,
  })
  globalThis.window = { location: { href: '' } }
  try {
    const result = await NativeRouter.openApp(...args)
    return { result, href: globalThis.window.location.href }
  } finally {
    delete globalThis.window
  }
}

test('every sign-in path carries the challenge back to /login', async () => {
  const query = { from: 'app', source: 'settings', code_challenge: CHALLENGE, code_challenge_method: 'S256', access_token: 'never' }
  assert.deepEqual(authFlow.nativeCodeChallenge(query), { challenge: CHALLENGE, method: 'S256' })
  assert.deepEqual(authFlow.nativeCodeChallenge({ code_challenge: [CHALLENGE, 'x'] }), { challenge: CHALLENGE, method: '' })
  assert.equal(authFlow.nativeCodeChallenge({ from: 'app' }), undefined)
  // Register, password reset and the email link's /login.
  for (const path of ['/login', '/register', '/reset_password_send']) {
    const url = new URL(authFlow.authFlowHref(path, query), 'https://www.enconvo.com')
    assert.equal(url.searchParams.get('code_challenge'), CHALLENGE, path)
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256', path)
    assert.equal(url.searchParams.has('access_token'), false, path)
  }
  // Google's return.
  const callback = new URL(authFlow.oauthCallbackUrl('https://www.enconvo.com', query, 'en'))
  assert.equal(callback.searchParams.get('code_challenge'), CHALLENGE)
  assert.equal(callback.searchParams.get('code_challenge_method'), 'S256')
  // The end of Google's and Apple's sign-in goes back to /login with it.
  const { finishOAuthSignIn } = await loadTs('../src/lib/finish-oauth-sign-in.ts', {
    '@/lib/signup-analytics': { recordGoogleSignup() {} },
    '@/lib/email-preferences-client': {
      consumeRegistrationEmailPreference: () => null,
      syncCurrentEmailPreference: async () => {},
      updateCurrentEmailPreference: async () => {},
    },
  })
  const pushes = []
  const router = { query: Object.fromEntries(callback.searchParams), push: async (...args) => pushes.push(args) }
  await finishOAuthSignIn({ auth: {} }, { access_token: 'a', user: { id: 'u' } }, router, 'en')
  const login = new URL(pushes[0][0], 'https://www.enconvo.com')
  assert.equal(login.pathname, '/login')
  assert.equal(login.searchParams.get('code_challenge'), CHALLENGE)
  assert.equal(login.searchParams.get('code_challenge_method'), 'S256')
  assert.equal(login.searchParams.get('source'), 'settings')
})

test('with a challenge, the app gets a one-time code and never tokens', async () => {
  for (const body of [{ code: 'one-time.code_1' }, { code: 200, data: { code: 'one-time.code_1' } }]) {
    const fetch = stubFetch((url, init) => {
      assert.equal(url, CREATE)
      assert.equal(init.method, 'POST')
      assert.equal(init.headers.Authorization, 'Bearer browser-access')
      assert.deepEqual(JSON.parse(init.body), { code_challenge: CHALLENGE, code_challenge_method: 'S256' })
      return { body }
    })
    try {
      const supabase = supabaseClient()
      const { result, href } = await openApp(supabase, 'settings', undefined, { challenge: CHALLENGE, method: 'S256' })
      assert.equal(result, 'opened')
      assert.equal(href, 'enconvo://login?code=one-time.code_1&source=settings')
      assert.equal(fetch.requests.length, 1)
      assert.deepEqual(supabase.calls, [])
    } finally {
      fetch.restore()
    }
  }
  // An access token about to expire is refreshed first, so the Worker accepts it.
  const fetch = stubFetch((url, init) => {
    assert.equal(init.headers.Authorization, 'Bearer refreshed-access')
    return { body: { code: 'c' } }
  })
  try {
    const supabase = supabaseClient({ expiresIn: 10 })
    const { result, href } = await openApp(supabase, undefined, 'exchange', { challenge: CHALLENGE, method: 'S256' })
    assert.equal(result, 'opened')
    // The challenge wins over `handoff`: no exchange token in the link.
    assert.equal(href, 'enconvo://login?code=c')
    assert.deepEqual(supabase.calls, ['refreshSession'])
  } finally {
    fetch.restore()
  }
})

test('a refused or failed hand-off opens nothing and never falls back to tokens', async () => {
  for (const [status, body] of [[500, { message: 'x' }], [400, { error: 'invalid_challenge' }], [200, {}], [200, { code: 'has space' }], [404, undefined]]) {
    const fetch = stubFetch(() => ({ status, body }))
    try {
      const supabase = supabaseClient()
      const { result, href } = await openApp(supabase, 'settings', undefined, { challenge: CHALLENGE, method: 'S256' })
      assert.equal(typeof result, 'object', `${status}`)
      assert.ok(result.error, `${status}`)
      assert.equal(href, '', `${status}`)
      assert.deepEqual(fetch.requests.map(({ url }) => url), [CREATE], `${status}`)
      assert.deepEqual(supabase.calls, [], `${status}`)
    } finally {
      fetch.restore()
    }
  }
  // The Worker refuses the browser's token: signed out once the auth service agrees, and this
  // browser signs in again; an error otherwise, and the browser stays signed in.
  const fetch = stubFetch(() => ({ status: 401, body: { code: 401, reason: 'signed_out' } }))
  try {
    const supabase = supabaseClient({ signedOut: true })
    const { result, href } = await openApp(supabase, 'settings', undefined, { challenge: CHALLENGE, method: 'S256' })
    assert.equal(result, 'signed_out')
    assert.equal(href, '')
    assert.deepEqual(supabase.calls, ['getUser', ['signOut', { scope: 'local' }]])
    const live = supabaseClient()
    const refused = await openApp(live, 'settings', undefined, { challenge: CHALLENGE, method: 'S256' })
    assert.ok(refused.result.error)
    assert.equal(refused.href, '')
    assert.deepEqual(live.calls, ['getUser'])
  } finally {
    fetch.restore()
  }
  // Offline.
  const before = globalThis.fetch
  globalThis.fetch = async () => {
    throw new TypeError('Failed to fetch')
  }
  try {
    const { result, href } = await openApp(supabaseClient(), 'settings', undefined, { challenge: CHALLENGE, method: 'S256' })
    assert.ok(result.error)
    assert.equal(href, '')
  } finally {
    globalThis.fetch = before
  }
  // A challenge that isn't S256 of a verifier asks nothing.
  for (const challenge of [{ challenge: CHALLENGE, method: 'plain' }, { challenge: CHALLENGE, method: '' }, { challenge: 'short', method: 'S256' }, { challenge: `${CHALLENGE.slice(0, 42)}=`, method: 'S256' }]) {
    const fetch = stubFetch(() => assert.fail('no request'))
    try {
      const { result, href } = await openApp(supabaseClient(), 'settings', undefined, challenge)
      assert.ok(result.error, JSON.stringify(challenge))
      assert.equal(href, '')
      assert.equal(fetch.requests.length, 0)
    } finally {
      fetch.restore()
    }
  }
})

test('without a challenge the hand-off is unchanged', async () => {
  const fetch = stubFetch((url) => {
    assert.equal(new URL(url).pathname, '/api/app_session')
    return { body: { code: 200, data: { accessToken: 'app-access', refreshToken: 'app-refresh' } } }
  })
  try {
    const { result, href } = await openApp(supabaseClient(), 'settings', undefined, undefined)
    assert.equal(result, 'opened')
    assert.equal(href, 'enconvo://login?access_token=app-access&refresh_token=app-refresh&source=settings')
  } finally {
    fetch.restore()
  }
  const exchange = await openApp(supabaseClient(), 'guide', 'exchange')
  assert.equal(exchange.href, 'enconvo://login?exchange_token=browser-access&source=guide')
})
