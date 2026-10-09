import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const base = process.env.SITE_CHECK_URL || 'http://localhost:3106'
const origin = 'https://www.enconvo.com'
async function get(path, userAgent = 'Googlebot') {
  const response = await fetch(new URL(path, base), {
    headers: { 'User-Agent': userAgent },
  })
  assert.equal(response.status, 200, path)
  return response.text()
}
const canonical = (html) =>
  [
    ...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"[^>]*>/g),
  ].map((m) => m[1])
const sitemap = await get('/sitemap.xml')
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
const { locales } = JSON.parse(
  await readFile(new URL('../src/i18n/config.json', import.meta.url), 'utf8')
)
assert.equal(new Set(locations).size, 7 * locales.length)
assert.ok(locations.includes(`${origin}/use-cases`))
assert.ok(locations.includes(`${origin}/cloud-pricing`))
for (const location of locations) {
  assert.equal(new URL(location).origin, origin)
  const html = await get(new URL(location).pathname)
  assert.deepEqual(canonical(html), [location], `canonical: ${location}`)
  assert.ok(!/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/.test(html))
  assert.ok(/<title>[^<]+<\/title>/.test(html))
}
const robots = await get('/robots.txt')
assert.match(robots, /User-agent: \*\s+Allow: \/\s+Disallow: \/api\//)
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`))
const guide = await get('/llms.txt')
assert.ok(
  guide.includes('native AI assistant') &&
    guide.includes(`${origin}/cloud-pricing`)
)
for (const agent of ['Googlebot', 'OAI-SearchBot', 'PerplexityBot']) {
  const html = await get('/', agent)
  const json = [
    ...html.matchAll(
      /<script[^>]*type="application\/ld\+json"[^>]*>([^<]+)<\/script>/g
    ),
  ].map((m) => JSON.parse(m[1]))
  const graph = json.find((item) => item['@graph'])?.['@graph']
  assert.equal(graph?.length, 4)
  const app = graph.find((item) => item['@type'] === 'SoftwareApplication')
  assert.equal(app.operatingSystem, 'macOS 14 or later')
  assert.equal(app.featureList.length, 7)
  assert.ok(!app.aggregateRating && !app.review, 'no invented review signals')
  assert.equal(app.offers.price, '0')
  assert.ok(
    html.includes('What is Enconvo?') &&
      html.includes('Which Macs does Enconvo support?')
  )
  assert.ok(
    html.includes('summary_large_image') &&
      html.includes('enconvo-mac-agent-v1.jpg')
  )
  assert.ok(
    html.includes('https://i.ytimg.com/vi/-OJOek_lxig/maxresdefault.jpg') &&
      html.includes('id="hero-tab-ai-companion" role="tab" aria-selected="true"')
  )
  assert.ok(!html.includes('<iframe'), 'YouTube loads only after clicking Play')
  assert.ok(!html.includes('autoPlay=""') && !html.includes('autoplay=""'))
  assert.ok(
    !html.includes('fonts.googleapis.com') && !html.includes('js.stripe.com')
  )
  assert.ok(html.includes('max-image-preview:large'))
  console.log(
    `PASS: server-rendered product facts, metadata and media for ${agent}`
  )
}
for (const path of ['/login', '/register', '/reset_password_send']) {
  assert.match(await get(path), /name="robots" content="noindex, follow"/)
}
assert.deepEqual(
  canonical(await get('/downloads')),
  [`${origin}/privacy`],
  'legacy duplicate points to the actual policy'
)
console.log(
  'PASS: sitemap, canonical URLs, crawler access, llms navigation, private-page noindex, legacy duplicate'
)
