import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const messages = JSON.parse(
  readFileSync(path.join(root, 'src/i18n/messages/zh-CN.json'), 'utf8')
)
const keys = new Set(Object.keys(messages))
const normalize = (value) => value.replace(/\s+/g, ' ').trim()
const cache = new Map()
function resolveImport(from, target) {
  if (!target.startsWith('@/') && !target.startsWith('.')) return null
  const base = target.startsWith('@/')
    ? path.join(root, 'src', target.slice(2))
    : path.resolve(path.dirname(from), target)
  return [
    base,
    `${base}.tsx`,
    `${base}.ts`,
    `${base}.js`,
    path.join(base, 'index.tsx'),
    path.join(base, 'index.ts'),
  ].find((file) => existsSync(file) && /\.[jt]sx?$/.test(file))
}
function collect(file, visited = new Set()) {
  if (!file || visited.has(file) || file.includes('/src/i18n/'))
    return new Set()
  visited.add(file)
  if (!cache.has(file)) {
    const source = ts.createSourceFile(
      file,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    )
    const used = new Set()
    const imports = new Set()
    function visit(node) {
      if (
        ts.isStringLiteral(node) ||
        ts.isNoSubstitutionTemplateLiteral(node)
      ) {
        const key = normalize(node.text)
        if (keys.has(key)) used.add(key)
      }
      if (ts.isTemplateExpression(node)) {
        const key = normalize(
          node.head.text +
            node.templateSpans
              .map((span, index) => `{p${index}}${span.literal.text}`)
              .join('')
        )
        if (keys.has(key)) used.add(key)
      }
      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier)
      )
        imports.add(resolveImport(file, node.moduleSpecifier.text))
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        ts.isStringLiteral(node.arguments[0])
      )
        imports.add(resolveImport(file, node.arguments[0].text))
      ts.forEachChild(node, visit)
    }
    visit(source)
    cache.set(file, { used, imports })
  }
  const { used, imports } = cache.get(file)
  return new Set([
    ...used,
    ...[...imports].flatMap((target) => [...collect(target, visited)]),
  ])
}
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(path.join(dir, entry.name))
      : [path.join(dir, entry.name)]
  )
}
const common = collect(path.join(root, 'src/pages/_app.tsx'))
const map = { common: [...common].sort() }
for (const file of files(path.join(root, 'src/pages')).filter(
  (file) =>
    /\.[jt]sx?$/.test(file) &&
    !file.includes('/api/') &&
    !/_app\.|_document\./.test(file)
)) {
  const name = path
    .relative(path.join(root, 'src/pages'), file)
    .replace(/\.[jt]sx?$/, '')
    .replace(/(?:^|\/)index$/, '')
  const route = `/${name}`
  map[route] = [...new Set([...common, ...collect(file)])].sort()
}
writeFileSync(
  path.join(root, 'src/i18n/message-map.json'),
  JSON.stringify(map, null, 2) + '\n'
)
console.log(
  `Generated message map for ${
    Object.keys(map).length - 1
  } pages; homepage uses ${map['/'].length} of ${keys.size} messages`
)
