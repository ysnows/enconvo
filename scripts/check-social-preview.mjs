// Verify crawler-visible HTML and the actual image bytes, without browser JS.
// Local: node scripts/check-social-preview.mjs http://localhost:3001/
// Live:  node scripts/check-social-preview.mjs https://www.enconvo.com/
import assert from 'node:assert/strict'
import sharp from 'sharp'

const target = new URL(process.argv[2] || 'http://localhost:3001/')
const canonical = 'https://www.enconvo.com/'
const imageURL = `${canonical}og/enconvo-mac-agent-v1.jpg`

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [
      key,
      value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#x27;', "'"),
    ])
  )
}

for (const agent of ['Twitterbot/1.0', 'facebookexternalhit/1.1']) {
  const response = await fetch(target, { headers: { 'User-Agent': agent } })
  assert.equal(response.status, 200, 'Page must be publicly available')
  assert(!/noindex/i.test(response.headers.get('x-robots-tag') || ''))
  const head = (await response.text()).match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1]
  assert(head, 'Server-rendered head is required')
  const metadata = [...head.matchAll(/<meta\s[^>]+>/gi)].map(([tag]) => attributes(tag))
  const value = (name) => {
    const matches = metadata.filter(meta => (meta.property || meta.name) === name)
    assert.equal(matches.length, 1, `Expected exactly one ${name}`)
    return matches[0].content
  }
  assert.equal(value('og:url'), canonical)
  assert.equal(value('og:site_name'), 'Enconvo')
  assert.equal(value('og:type'), 'website')
  assert.equal(value('og:image'), imageURL)
  assert.equal(value('og:image:secure_url'), imageURL)
  assert.equal(value('og:image:type'), 'image/jpeg')
  assert.equal(value('twitter:card'), 'summary_large_image')
  assert.equal(value('twitter:image'), imageURL)
  assert.equal(value('twitter:title'), value('og:title'))
  assert(value('og:title').length < 70, 'Share title should stay compact')
  assert.equal(value('twitter:description'), value('og:description'))
  assert.equal(value('twitter:image:alt'), value('og:image:alt'))
  assert(value('og:image:alt').includes('Finder'))
  const links = [...head.matchAll(/<link\s[^>]+>/gi)].map(([tag]) => attributes(tag))
  assert.equal(links.find(link => link.rel === 'canonical')?.href, canonical)

  // Keep production metadata intact, but fetch local image bytes for local runs.
  const asset = new URL(imageURL)
  if (['localhost', '127.0.0.1'].includes(target.hostname)) asset.host = target.host
  if (['localhost', '127.0.0.1'].includes(target.hostname)) asset.protocol = target.protocol
  const imageResponse = await fetch(asset, { headers: { 'User-Agent': agent } })
  assert.equal(imageResponse.status, 200, 'Share image must load without authentication')
  assert.match(imageResponse.headers.get('content-type') || '', /^image\/jpeg/)
  const bytes = Buffer.from(await imageResponse.arrayBuffer())
  assert(bytes.length < 300_000, 'Share image should remain lightweight')
  const image = await sharp(bytes).metadata()
  assert.equal(image.width, Number(value('og:image:width')))
  assert.equal(image.height, Number(value('og:image:height')))
  assert.equal(image.width, 1200)
  assert.equal(image.height, 630)
  console.log(`PASS ${agent}: SSR large-image card, ${image.width}×${image.height}, ${bytes.length} bytes`)
}
