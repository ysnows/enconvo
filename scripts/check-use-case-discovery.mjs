import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'

async function loadTS(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText
  const context = { exports: {} }
  vm.runInNewContext(compiled, context)
  return context.exports
}

const { useCases } = await loadTS('../src/data/useCases.ts')
const { filterUseCases, newestFirst, useCaseCategories } = await loadTS(
  '../src/lib/useCaseDiscovery.ts'
)
const slugs = (items) => Array.from(items, (item) => item.slug)
const initialOrder = slugs(useCases)

assert.deepEqual(slugs(filterUseCases(useCases, 'All', '  ')), initialOrder)
assert.deepEqual(slugs(filterUseCases(useCases, 'All', '  RESUME website ')), [
  'resume-to-personal-website',
])
assert.deepEqual(slugs(filterUseCases(useCases, 'All', 'résumé')), [
  'resume-to-personal-website',
])
assert.deepEqual(slugs(filterUseCases(useCases, 'Apps & Office', 'excel')), [
  'excel-mcp-agent',
  'excel-sidebar-ai',
])
assert.deepEqual(slugs(filterUseCases(useCases, 'AI Agent', 'excel')), [])
assert.deepEqual(
  slugs(filterUseCases(useCases, 'All', 'nonexistent walkthrough')),
  []
)
assert.deepEqual(slugs(filterUseCases(useCases, 'All', 'forecast Gmail')), [
  'gmail-weather-workflow',
])
assert.deepEqual(
  slugs(useCases),
  initialOrder,
  'filtering must not mutate shared data'
)
assert.equal(
  new Set(slugs(useCases)).size,
  useCases.length,
  'stable unique deep links'
)
assert.deepEqual(Array.from(useCaseCategories([])), ['All'])
assert.equal(
  new Set(useCaseCategories(useCases)).size,
  useCaseCategories(useCases).length
)
console.log(
  'PASS: case/diacritic/whitespace search, description search, category intersections, empty results and stable shared data'
)

const base = process.env.SITE_CHECK_URL || 'http://localhost:3106'
const pages = await Promise.all(
  ['/', '/use-cases'].map(async (path) => {
    const response = await fetch(new URL(path, base))
    assert.equal(response.status, 200, path)
    return response.text()
  })
)
const [home, catalogue] = pages
const homeCases = [...home.matchAll(/href="\/use-cases#([^"]+)"/g)].map(
  (match) => match[1]
)
assert.equal(homeCases.length, 6)
assert.deepEqual(
  homeCases,
  slugs(newestFirst(useCases)).slice(0, 6),
  'homepage previews the newest walkthroughs from /use-cases'
)
for (const slug of homeCases) {
  assert.ok(initialOrder.includes(slug), `featured demo exists: ${slug}`)
  assert.ok(catalogue.includes(`id="${slug}"`), `deep link resolves: ${slug}`)
}
assert.ok(
  home.indexOf('id="features"') < home.indexOf('id="models"'),
  'task discovery precedes provider detail'
)
for (const [index, html] of pages.entries()) {
  assert.ok(html.includes('Search walkthroughs'))
  assert.ok(html.includes('aria-pressed="true"'))
  assert.ok(html.includes('role="status"'))
  assert.ok(!html.includes('<iframe'), 'no YouTube embed before opening a demo')
  const count = index === 0 ? 6 : useCases.length
  assert.equal(
    (html.match(/src="https:\/\/i\.ytimg\.com\//g) || []).length,
    count
  )
  assert.equal(
    (html.match(/loading="lazy" decoding="async"/g) || []).length,
    count
  )
}
const data = [
  ...catalogue.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>([^<]+)<\/script>/g
  ),
].map((m) => JSON.parse(m[1]))
const list = data.find((item) => item['@type'] === 'ItemList')
assert.equal(list.itemListElement.length, useCases.length)
for (const entry of list.itemListElement) {
  const original = useCases.find((item) =>
    entry.item.url.endsWith(`#${item.slug}`)
  )
  assert.equal(entry.item.name, original.title)
  assert.equal(entry.item.uploadDate, original.date)
  assert.equal(
    entry.item.embedUrl,
    `https://www.youtube-nocookie.com/embed/${original.youtubeId}`
  )
}
console.log(
  'PASS: homepage/catalogue SSR, all featured deep links, lazy thumbnails, deferred embeds and complete structured data'
)
