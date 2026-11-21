import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

// The unsubscribe page's helpers (src/lib/unsubscribe.ts): reading the link from the address,
// what counts as sendable feedback, and how the Worker's answers are read. No request leaves
// this process.

async function loadTs(path, mocks = {}) {
  const url = new URL(path, import.meta.url)
  const { outputText } = ts.transpileModule(await readFile(url, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
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

const lib = await loadTs('../src/lib/unsubscribe.ts', {
  './worker-api': { WORKER_API_ORIGIN: 'https://api.enconvo.com' },
})

async function withFetch(answer, run) {
  const original = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init })
    if (answer instanceof Error) throw answer
    return answer
  }
  try {
    return await run(calls)
  } finally {
    globalThis.fetch = original
  }
}

test('reads the token after #t=, or ?t= from a client that drops the fragment', () => {
  assert.deepEqual(lib.readLinkAddress({ search: '', hash: '#t=u1.abc-DEF_123' }), { token: 'u1.abc-DEF_123', invalid: false })
  assert.deepEqual(lib.readLinkAddress({ search: '?t=u1.query', hash: '' }), { token: 'u1.query', invalid: false })
  assert.deepEqual(lib.readLinkAddress({ search: '?t=u1.query', hash: '#t=u1.fragment' }), { token: 'u1.fragment', invalid: false })
})

test('a page opened without a link, or with one the Worker refused, has no token', () => {
  assert.deepEqual(lib.readLinkAddress({ search: '', hash: '' }), { token: null, invalid: false })
  assert.deepEqual(lib.readLinkAddress({ search: '?link=invalid', hash: '' }), { token: null, invalid: true })
  assert.deepEqual(lib.readLinkAddress({ search: '?utm_source=email', hash: '#pricing' }), { token: null, invalid: false })
  // Something that can't be one of our tokens never reaches the Worker.
  assert.deepEqual(lib.readLinkAddress({ search: '', hash: '#t=<script>' }), { token: null, invalid: true })
  assert.deepEqual(lib.readLinkAddress({ search: '', hash: `#t=${'a'.repeat(1025)}` }), { token: null, invalid: true })
})

test('feedback can be sent with a reason or a note, up to 500 characters', () => {
  assert.equal(lib.feedbackReady(null, ''), false)
  assert.equal(lib.feedbackReady(null, '   '), false)
  assert.equal(lib.feedbackReady('too_many', ''), true)
  assert.equal(lib.feedbackReady(null, 'a note'), true)
  assert.equal(lib.feedbackReady('other', 'x'.repeat(500)), true)
  assert.equal(lib.feedbackReady('other', 'x'.repeat(501)), false)
  assert.equal(lib.feedbackReady('other', `  ${'x'.repeat(500)}  `), true)
  // Counted the way the Worker counts: characters, not UTF-16 units.
  assert.equal(lib.noteLength('😀'.repeat(500)), 500)
  assert.equal(lib.feedbackReady(null, '😀'.repeat(500)), true)
  assert.deepEqual(lib.UNSUBSCRIBE_REASONS.map(([key]) => key), ['too_many', 'not_relevant', 'stopped_using', 'never_signed_up', 'other'])
})

test('the date reads like the design, and an unreadable one is left out', () => {
  assert.equal(lib.unsubscribedDate('2026-11-12T12:00:00.000Z'), 'November 12, 2026')
  assert.equal(lib.unsubscribedDate(null), '')
  assert.equal(lib.unsubscribedDate('not a date'), '')
})

test('calls post the token as JSON, without cookies or a referrer', async () => {
  const state = { email: 'm•••@example.com', subscribed: true, unsubscribed_at: null, can_resubscribe: true }
  await withFetch(Response.json(state), async (calls) => {
    const result = await lib.callUnsubscribeLink('status', { token: 'u1.abc' })
    assert.deepEqual(result, { ok: true, data: state })
    assert.equal(calls[0].url, 'https://api.enconvo.com/api/email-preferences/link/status')
    assert.equal(calls[0].init.method, 'POST')
    assert.equal(calls[0].init.credentials, 'omit')
    assert.equal(calls[0].init.referrerPolicy, 'no-referrer')
    assert.deepEqual(JSON.parse(calls[0].init.body), { token: 'u1.abc' })
  })
})

test("a refusal carries the Worker's reason, and no answer at all reads as a network error", async () => {
  await withFetch(Response.json({ error: 'invalid_link' }, { status: 400 }), async () => {
    assert.deepEqual(await lib.callUnsubscribeLink('status', { token: 'x' }), { ok: false, status: 400, error: 'invalid_link' })
  })
  await withFetch(new Response('<html>502</html>', { status: 502 }), async () => {
    assert.deepEqual(await lib.callUnsubscribeLink('unsubscribe', { token: 'x' }), { ok: false, status: 502, error: 'failed' })
  })
  await withFetch(new TypeError('offline'), async () => {
    assert.deepEqual(await lib.callUnsubscribeLink('unsubscribe', { token: 'x' }), { ok: false, status: 0, error: 'network_error' })
  })
})
