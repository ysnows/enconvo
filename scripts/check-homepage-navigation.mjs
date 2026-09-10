import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

// Cover every nav variant, including the signed-in links absent from SSR.
const source = ts.createSourceFile(
  'SiteNav.tsx',
  await readFile(new URL('../src/components/SiteNav.tsx', import.meta.url), 'utf8'),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
)
const sections = new Map([['Features', '#features'], ['Pricing', '#pricing']])
const sources = ['/', '/use-cases', '/changelog']
const seen = new Set()
function visit(node) {
  if (ts.isObjectLiteralExpression(node)) {
    const values = Object.fromEntries(node.properties
      .filter((p) => ts.isPropertyAssignment(p) && ts.isStringLiteral(p.initializer))
      .map((p) => [p.name.getText(source), p.initializer.text]))
    if (sections.has(values.name)) {
      seen.add(values.name)
      for (const path of sources) {
        const target = new URL(values.href, `https://www.enconvo.com${path}`)
        assert.equal(target.pathname, '/', `${values.name} from ${path} must return home`)
        assert.equal(target.hash, sections.get(values.name))
      }
    }
  }
  ts.forEachChild(node, visit)
}
visit(source)
assert.deepEqual(seen, new Set(sections.keys()))
console.log('PASS: all signed-out/signed-in navigation definitions return to homepage sections')

// Check what visitors and crawlers actually receive on each shared-nav page.
const base = process.env.NAV_CHECK_SITE || 'http://localhost:3001'
for (const path of sources) {
  const response = await fetch(new URL(path, base))
  assert.equal(response.status, 200, path)
  const html = await response.text()
  for (const region of ['header', 'footer']) {
    const fragment = html.match(new RegExp(`<${region}\\b[^>]*>([\\s\\S]*?)</${region}>`))?.[1]
    assert.ok(fragment, `${path} has a ${region}`)
    for (const [name, hash] of sections) {
      const links = [...fragment.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
        .filter(([, , label]) => label.replace(/<[^>]+>/g, '').trim() === name)
      assert.ok(links.length, `${path} ${region} contains ${name}`)
      for (const [, attributes] of links) {
        const href = attributes.match(/\bhref="([^"]+)"/)?.[1]
        assert.equal(href, `/${hash}`, `${path} ${region} ${name}`)
      }
    }
  }
  if (path === '/') {
    for (const hash of sections.values()) assert.ok(html.includes(`id="${hash.slice(1)}"`))
  }
  console.log(`PASS: ${path} header/footer links${path === '/' ? ' and target sections' : ''}`)
}
