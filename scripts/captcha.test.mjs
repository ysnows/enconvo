import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

// Supabase Auth's CAPTCHA protection on the website: the password sign-in sends a Turnstile token only on its
// direct Supabase fallback, and Auth's refusals (CAPTCHA, weak or breached passwords, disposable inboxes) read
// as translated messages. No request leaves this process.

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

class CaptchaError extends Error {}
const workerApi = await loadTs('../src/lib/worker-api.ts')
const lib = await loadTs('../src/lib/password-sign-in.ts', { '@/lib/worker-api': workerApi })
const errors = await loadTs('../src/lib/auth-errors.ts', { '@/components/Turnstile': { CaptchaError } })

function withFetch(answer, run) {
  const original = globalThis.fetch
  globalThis.fetch = async () => (answer instanceof Error ? Promise.reject(answer) : answer)
  return run().finally(() => (globalThis.fetch = original))
}

function supabase(result = { data: { session: { access_token: 'a' }, user: { id: 'u' } }, error: null }) {
  const calls = []
  return {
    calls,
    auth: {
      async setSession(tokens) {
        calls.push(['setSession', tokens])
        return { data: { session: { access_token: tokens.access_token }, user: { id: 'u' } }, error: null }
      },
      async signInWithPassword(credentials) {
        calls.push(['signInWithPassword', credentials])
        return result
      },
    },
  }
}

test('the Worker signs in without a token, so the widget is not asked', async () => {
  let asked = 0
  const client = supabase()
  const result = await withFetch(Response.json({ accessToken: 'w', refreshToken: 'r' }), () =>
    lib.signInWithPassword(client, 'a@example.test', 'pw', true, async () => (asked++, 'token'))
  )
  assert.equal(result.ok, true)
  assert.equal(asked, 0)
  assert.deepEqual(client.calls.map(([name]) => name), ['setSession'])
})

test('the direct Supabase fallback sends the Turnstile token', async () => {
  const client = supabase()
  const result = await withFetch(new TypeError('offline'), () =>
    lib.signInWithPassword(client, 'a@example.test', 'pw', true, async () => 'token-1')
  )
  assert.equal(result.ok, true)
  assert.deepEqual(client.calls, [['signInWithPassword', { email: 'a@example.test', password: 'pw', options: { captchaToken: 'token-1' } }]])
})

test('a widget that gives no token, or a token Auth refuses, has its own message', async () => {
  const unavailable = await withFetch(new TypeError('offline'), () =>
    lib.signInWithPassword(supabase(), 'a@example.test', 'pw', true, async () => {
      throw new CaptchaError('timeout')
    })
  )
  assert.deepEqual(unavailable, { ok: false, problem: 'captcha_unavailable', message: '' })

  const refused = supabase({ data: { session: null, user: null }, error: { message: 'captcha protection: request disallowed (timeout-or-duplicate)', status: 400 } })
  const result = await withFetch(new TypeError('offline'), () => lib.signInWithPassword(refused, 'a@example.test', 'pw', true, async () => 'spent'))
  assert.equal(result.problem, 'captcha_failed')
  assert.equal(lib.passwordSignInMessage('captcha_failed').source, errors.CAPTCHA_REJECTED)
  assert.equal(lib.passwordSignInMessage('captcha_unavailable').source, errors.CAPTCHA_UNAVAILABLE)
})

test('Auth refusals read as messages, translated in every locale', async () => {
  const cases = [
    [{ message: 'captcha protection: request disallowed (invalid-input-response)', status: 400 }, errors.CAPTCHA_REJECTED],
    [{ message: 'Password should be at least 8 characters.', status: 422 }, errors.PASSWORD_TOO_SHORT],
    [{ message: 'Password is known to be weak and easy to guess, please choose a different one.', status: 422 }, 'This password has appeared in a data breach. Choose a different one.'],
    [{ message: 'Sign-ups with temporary email addresses are not allowed. Please use a permanent email address.', status: 400 }, 'Sign-ups with temporary email addresses aren’t allowed. Use a permanent email address.'],
  ]
  const sources = new Set([errors.CAPTCHA_UNAVAILABLE, 'Choose a stronger password.'])
  for (const [error, source] of cases) {
    assert.equal(errors.authErrorMessage(error)?.source, source, error.message)
    sources.add(source)
  }
  assert.deepEqual(errors.authErrorMessage({ message: 'Password should be at least 8 characters.' }).values, { p0: '8' })
  assert.equal(errors.authErrorMessage({ message: 'User already registered', status: 422 }), null)
  assert.equal(errors.captchaMessage(new CaptchaError('failed')).source, errors.CAPTCHA_UNAVAILABLE)
  assert.equal(errors.MIN_PASSWORD_LENGTH, 8)
  for (const locale of ['zh-CN', 'zh-TW', 'ja', 'ko', 'es', 'de', 'fr', 'it', 'pt', 'nl', 'pl']) {
    const messages = JSON.parse(await readFile(new URL(`../src/i18n/messages/${locale}.json`, import.meta.url), 'utf8'))
    for (const source of sources) assert.ok(messages[source], `${locale}: ${source}`)
    assert.ok(messages[errors.PASSWORD_TOO_SHORT].includes('{p0}'), `${locale}: placeholder`)
  }
})
