import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

// The routes that sign a visitor in from the sign-in cookie (utils/auth's withAuth when no
// Authorization header comes, and /api/subscription/checkout) refuse a POST another page sends:
// pages on <name>.site.enconvo.com are the same site, so the SameSite=Lax cookie rides along.
// enconvo.com's own pages, previews and local servers, and callers with their own token still work.
// No request leaves this process.

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'

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

const authCookie = await loadTs('../src/lib/auth-cookie.ts')
const originPath = new URL('../src/lib/request-origin.ts', import.meta.url)
const shared = {
  '@/lib/auth-cookie': authCookie,
  // Before the check existed, the routes didn't import it.
  ...(existsSync(originPath) ? { '@/lib/request-origin': await loadTs('../src/lib/request-origin.ts') } : {}),
}

const verified = []
const auth = await loadTs('../src/utils/auth.ts', {
  ...shared,
  '@supabase/supabase-js': {
    createClient: () => ({
      auth: {
        getUser: async (token) => {
          verified.push(token)
          return { data: { user: { id: 'user-1', email: 'buyer@example.com', user_metadata: {} } }, error: null }
        },
      },
    }),
  },
})

const sessions = []
const checkout = await loadTs('../src/pages/api/subscription/checkout.ts', {
  ...shared,
  stripe: class Stripe {},
  '@supabase/auth-helpers-nextjs': {
    createServerSupabaseClient: () => ({
      auth: {
        getSession: async () => {
          sessions.push(true)
          return { data: { session: null } }
        },
      },
    }),
  },
})

const COOKIE = { [authCookie.AUTH_COOKIE]: JSON.stringify(['cookie-token', 'refresh']) }

function request({ method = 'POST', headers = {}, cookies = COOKIE } = {}) {
  return { method, headers: { host: 'www.enconvo.com', ...headers }, cookies, body: { lookupKey: '250000_points' } }
}

function response() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }
}

async function callWithAuth(req) {
  verified.length = 0
  let handled = null
  const res = response()
  await auth.withAuth(async (authed, out) => {
    handled = authed.user.email
    out.status(200).json({ ok: true })
  })(req, res)
  return { res, handled, verified: [...verified] }
}

async function callCheckout(req) {
  sessions.length = 0
  const res = response()
  await checkout.default(req, res)
  return { res, reachedSession: sessions.length > 0 }
}

const FOREIGN = [
  ['a published site', { origin: 'https://evil.site.enconvo.com' }],
  ['another site', { origin: 'https://attacker.example' }],
  ['a sandboxed frame', { origin: 'null' }],
  ['a same-site page without Origin', { 'sec-fetch-site': 'same-site' }],
  ['a cross-site page without Origin', { 'sec-fetch-site': 'cross-site' }],
]

const OWN = [
  ['www.enconvo.com', { origin: 'https://www.enconvo.com' }],
  ['enconvo.com', { origin: 'https://enconvo.com' }],
  ['a preview, on its own address', { origin: 'https://site-git-x.vercel.app', host: 'site-git-x.vercel.app' }],
  ['a local server', { origin: 'http://127.0.0.1:3106', host: '127.0.0.1:3106' }],
  ['a same-origin page without Origin', { 'sec-fetch-site': 'same-origin' }],
  ['a client that is no browser', {}],
]

for (const [name, headers] of FOREIGN) {
  test(`withAuth refuses a cookie sign-in from ${name}`, async () => {
    const { res, handled, verified } = await callWithAuth(request({ headers }))
    assert.equal(res.statusCode, 403)
    assert.equal(handled, null)
    assert.deepEqual(verified, [], 'the cookie token is never checked or used')
  })

  test(`/api/subscription/checkout refuses ${name}`, async () => {
    const { res, reachedSession } = await callCheckout(request({ headers }))
    assert.equal(res.statusCode, 403)
    assert.equal(reachedSession, false)
  })
}

for (const [name, headers] of OWN) {
  test(`withAuth signs in from the cookie for ${name}`, async () => {
    const { res, handled, verified } = await callWithAuth(request({ headers }))
    assert.equal(res.statusCode, 200)
    assert.equal(handled, 'buyer@example.com')
    assert.deepEqual(verified, ['cookie-token'])
  })

  test(`/api/subscription/checkout goes on for ${name}`, async () => {
    const { res, reachedSession } = await callCheckout(request({ headers }))
    assert.equal(reachedSession, true)
    // No session in this stand-in, so the route answers as for a signed-out visitor.
    assert.equal(res.statusCode, 401)
  })
}

test('withAuth takes an Authorization header from any origin: another page cannot forge it', async () => {
  const { res, handled, verified } = await callWithAuth(
    request({ headers: { origin: 'https://evil.site.enconvo.com', authorization: 'Bearer header-token' }, cookies: {} })
  )
  assert.equal(res.statusCode, 200)
  assert.equal(handled, 'buyer@example.com')
  assert.deepEqual(verified, ['header-token'])
})

test('withAuth leaves a cookie GET alone: another page cannot read its answer', async () => {
  const { res, handled } = await callWithAuth(request({ method: 'GET', headers: { origin: 'https://evil.site.enconvo.com' } }))
  assert.equal(res.statusCode, 200)
  assert.equal(handled, 'buyer@example.com')
})

test('withAuth still answers 401 to a request with no token at all', async () => {
  const { res, handled } = await callWithAuth(request({ headers: { origin: 'https://www.enconvo.com' }, cookies: {} }))
  assert.equal(res.statusCode, 401)
  assert.equal(handled, null)
})
