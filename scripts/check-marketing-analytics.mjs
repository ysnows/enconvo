import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { once } from 'node:events'
import ts from 'typescript'

const cache = new Map()
function load(name) {
  if (cache.has(name)) return cache.get(name).exports
  const module = { exports: {} }; cache.set(name, module)
  const source = readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), 'utf8')
  new Function('require', 'module', 'exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(
    path => load(path.replace('./', '')), module, module.exports
  )
  return module.exports
}
const storage = () => {
  const values = new Map()
  return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, String(v)), removeItem: k => values.delete(k), clear: () => values.clear() }
}
const packets = [], pending = []
const server = createServer(async (req, res) => {
  let body = ''; for await (const chunk of req) body += chunk
  packets.push(JSON.parse(body)); res.end('ok')
})
server.listen(0, '127.0.0.1'); await once(server, 'listening')
globalThis.localStorage = storage()
globalThis.sessionStorage = storage()
// The visitor allowed analytics and marketing (lib/cookie-consent).
const consentCookie = (analytics) => `enconvo_consent=1.${analytics ? 1 : 0}.1.${Math.floor(Date.now() / 1000)}`
globalThis.document = { referrer: 'https://macworthy.com/apps/enconvo/', cookie: consentCookie(true) }
globalThis.window = { localStorage, location: new URL('https://www.enconvo.com/?utm_source=macworthy&utm_content=app_website&email=private@example.com'), gtag: (...args) => {
  pending.push(fetch(`http://127.0.0.1:${server.address().port}`, { method: 'POST', body: JSON.stringify(args) }))
} }

try {
  const referral = load('marketing-attribution')
  const analytics = load('analytics')
  const signup = load('signup-analytics')
  assert.equal(referral.captureMarketingReferral(), true)
  analytics.trackEvent('website_referral_landed', {}, { includePagePath: false })
  window.location = new URL('https://www.enconvo.com/register?code=private-token')
  analytics.trackEvent('download_click', { arch: 'arm64', placement: 'hero' })
  const started = Date.now()
  const user = { id: 'internal-account-id', created_at: new Date(started).toISOString(), identities: [{}], email: 'private@example.com' }
  assert.equal(signup.recordWebsiteSignup(user, 'email', started), true)
  assert.equal(signup.recordWebsiteSignup(user, 'email', started), false)
  assert.equal(signup.recordWebsiteSignup({ ...user, id: 'old-account', created_at: '2025-01-01T00:00:00Z' }, 'email', started), false)
  assert.equal(signup.recordWebsiteSignup({ ...user, id: 'obfuscated-existing', identities: [] }, 'email', started), false)
  assert.equal(signup.recordWebsiteSignup(null, 'email', started), false)
  assert.equal(signup.recordWebsiteSignup({ ...user, id: 'expired-flow' }, 'email', started - 31 * 60000), false)
  signup.beginGoogleSignupMeasurement()
  assert.equal(signup.recordGoogleSignup({ ...user, id: 'new-google' }), true)
  assert.equal(signup.recordGoogleSignup({ ...user, id: 'new-google' }), false)
  signup.beginGoogleSignupMeasurement()
  assert.equal(signup.recordGoogleSignup({ ...user, id: 'old-google', created_at: '2025-01-01T00:00:00Z' }), false)
  assert.equal(referral.captureMarketingReferral(), false) // callback/private pages preserve the source
  assert.equal(referral.marketingEventParams().referral_source, 'macworthy')
  window.location = new URL('https://www.enconvo.com/')
  document.referrer = ''
  assert.equal(referral.captureMarketingReferral(), false)
  assert.equal(referral.marketingEventParams().referral_source, 'macworthy') // direct return
  localStorage.removeItem('enconvo_marketing_referral_v1')
  assert.deepEqual(referral.marketingEventParams(), {}) // another tab cleared its referral
  window.location = new URL('https://www.enconvo.com/?utm_source=macworthy&utm_content=facts_website')
  referral.captureMarketingReferral()
  window.location = new URL('https://www.enconvo.com/?utm_source=another-campaign')
  referral.captureMarketingReferral()
  assert.deepEqual(referral.marketingEventParams(), {}) // latest known campaign wins
  localStorage.setItem('enconvo_marketing_referral_v1', JSON.stringify({ source: 'macworthy', placement: 'app_website', at: Date.now() - 31 * 86400000 }))
  assert.deepEqual(referral.marketingEventParams(), {})
  await Promise.all(pending)
  assert.deepEqual(packets.map(p => p[1]), ['website_referral_landed', 'download_click', 'sign_up', 'sign_up'])
  for (const p of packets) {
    assert.equal(p[2].referral_source, 'macworthy')
    assert.equal(p[2].referral_campaign, 'mac-app-directory')
    assert.doesNotMatch(JSON.stringify(p), /private@example|private-token|internal-account-id|new-google|user_id|access_token/)
  }
  for (const p of packets.filter(p => p[1] === 'sign_up')) {
    assert.equal(p[2].page_location, 'https://www.enconvo.com/')
    assert.equal(p[2].page_referrer, '')
    assert.equal(p[2].page_path, undefined)
  }
  // Events before the GA script loads use the same Arguments queue as gtag.js.
  delete window.gtag
  analytics.trackEvent('download_click', { arch: 'x64' })
  assert.equal(Array.from(window.dataLayer.at(-1))[1], 'download_click')
  // Without analytics consent nothing is sent or queued, and sign-ups aren't recorded.
  document.cookie = consentCookie(false)
  const queued = window.dataLayer.length
  analytics.trackEvent('download_click', { arch: 'x64' })
  assert.equal(window.dataLayer.length, queued)
  assert.equal(signup.recordWebsiteSignup({ ...user, id: 'no-consent' }, 'email', Date.now()), false)
  console.log('PASS: HTTP event sink, referral persistence/expiry/replacement, real new-account guards, OAuth return, deduplication, queued GA, nothing without analytics consent and no identity payloads')
} finally {
  server.closeAllConnections(); await new Promise(resolve => server.close(resolve))
}
