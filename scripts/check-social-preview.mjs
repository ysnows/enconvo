// Verify public share cards and image bytes as crawlers see them, without JS.
// Local: node scripts/check-social-preview.mjs http://localhost:3116/
// Live:  node scripts/check-social-preview.mjs https://www.enconvo.com/
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'

const target = new URL(process.argv[2] || 'http://localhost:3116/')
const origin = 'https://www.enconvo.com'
const brandImage = '/og/enconvo-mac-agent-v1.jpg'
const publicPages = {
  '/': { image: brandImage, title: /Enconvo/, alt: /Finder/ },
  '/use-cases': { image: '/og/enconvo-use-cases-v1.jpg', title: /Use Cases/, alt: /workflow/ },
  '/cloud-pricing': { image: '/og/enconvo-cloud-pricing-v1.jpg', title: /Cloud Pricing/, alt: /Speech/ },
  '/changelog': { image: '/og/enconvo-changelog-v1.jpg', title: /Releases/, alt: /release timeline/ },
  '/privacy': { image: brandImage, title: /Privacy Policy/, alt: /Finder/ },
  '/terms': { image: brandImage, title: /Terms of Use/, alt: /Finder/ },
}

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [
      key,
      value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#x27;', "'"),
    ])
  )
}

async function readPage(path, agent) {
  const response = await fetch(new URL(path, target), { headers: { 'User-Agent': agent } })
  assert.equal(response.status, 200, `${path} must be publicly readable`)
  const head = (await response.text()).match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1]
  assert(head, `${path}: server-rendered head is required`)
  const metadata = [...head.matchAll(/<meta\s[^>]+>/gi)].map(([tag]) => attributes(tag))
  const links = [...head.matchAll(/<link\s[^>]+>/gi)].map(([tag]) => attributes(tag))
  const value = (name) => {
    const matches = metadata.filter(meta => (meta.property || meta.name) === name)
    assert.equal(matches.length, 1, `${path}: expected exactly one ${name}`)
    return matches[0].content
  }
  const noindex = /noindex/i.test(response.headers.get('x-robots-tag') || '') ||
    metadata.some(meta => meta.name === 'robots' && /noindex/i.test(meta.content))
  return { metadata, links, value, noindex }
}

const sitemapResponse = await fetch(new URL('/sitemap.xml', target))
assert.equal(sitemapResponse.status, 200)
const sitemap = await sitemapResponse.text()
const sitemapPaths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => new URL(url).pathname)
const { locales } = JSON.parse(await readFile(new URL('../src/i18n/config.json', import.meta.url), 'utf8'))
const basePaths = sitemapPaths.map(path => {
  const language = path.split('/')[1]
  return locales.includes(language) ? path.slice(language.length + 1) || '/' : path
})
assert.equal(sitemapPaths.length, Object.keys(publicPages).length * locales.length)
assert.deepEqual([...new Set(basePaths)].sort(), Object.keys(publicPages).sort(), 'Every sitemap page needs a verified share card')

const aliases = { '/downloads': '/privacy', '/pricing': '/', '/cloud-plan': '/cloud-pricing' }
for (const agent of ['Twitterbot/1.0', 'facebookexternalhit/1.1']) {
  const checkedAssets = new Set()
  for (const path of [...Object.keys(publicPages), ...Object.keys(aliases)]) {
    const canonicalPath = aliases[path] || path
    const expected = publicPages[canonicalPath]
    const { value, links, noindex } = await readPage(path, agent)
    assert(!noindex, `${path}: public pages must not be noindex`)
    assert.equal(value('og:url'), `${origin}${canonicalPath}`)
    assert.equal(value('og:site_name'), 'Enconvo')
    assert.equal(value('og:type'), 'website')
    assert.equal(value('og:locale'), 'en_US')
    assert.match(value('og:title'), expected.title)
    assert(value('og:title').length < 70, 'Share title should stay compact')
    assert(value('og:description').length > 30, 'Share description must explain the page')
    assert.equal(value('og:image'), `${origin}${expected.image}`)
    assert.equal(value('og:image:secure_url'), value('og:image'))
    assert.equal(value('og:image:type'), 'image/jpeg')
    assert.equal(value('og:image:width'), '1200')
    assert.equal(value('og:image:height'), '630')
    assert.match(value('og:image:alt'), expected.alt)
    assert.equal(value('twitter:card'), 'summary_large_image')
    assert.equal(value('twitter:site'), '@enconvo_ai')
    for (const field of ['title', 'description', 'image', 'image:alt']) {
      assert.equal(value(`twitter:${field}`), value(`og:${field}`))
    }
    assert.deepEqual(links.filter(link => link.rel === 'canonical').map(link => link.href), [`${origin}${canonicalPath}`])

    if (!checkedAssets.has(expected.image)) {
      // Production tags stay absolute; verify the corresponding asset on the test host.
      const imageResponse = await fetch(new URL(expected.image, target), { headers: { 'User-Agent': agent } })
      assert.equal(imageResponse.status, 200, 'Share image must load without authentication')
      assert.match(imageResponse.headers.get('content-type') || '', /^image\/jpeg/)
      const bytes = Buffer.from(await imageResponse.arrayBuffer())
      assert(bytes.length < 300_000, 'Share image should remain lightweight')
      const image = await sharp(bytes).metadata()
      assert.equal(image.width, 1200)
      assert.equal(image.height, 630)
      assert.equal(image.space, 'srgb')
      checkedAssets.add(expected.image)
    }
    console.log(`PASS ${agent} ${path}: one SSR large-image card, correct canonical and JPEG`)
  }

  for (const path of ['/account', '/login', '/register', '/auth', '/auth/callback', '/payment', '/pay_success', '/cloud-points', '/reset_password', '/reset_password_send', '/developer', '/mcp/install']) {
    const { metadata, noindex } = await readPage(path, agent)
    assert(noindex, `${path}: private/placeholder pages must remain noindex`)
    assert(!metadata.some(meta => /^(og:|twitter:)/.test(meta.property || meta.name || '')), `${path}: must not inherit public share metadata`)
  }
  console.log(`PASS ${agent}: private and placeholder routes remain noindex without public share cards`)
}
