import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

// The Grok Bot consent page's words (src/lib/grokbot-connect.ts). A connector sign-in can be started by
// one person and its link sent to another, so the page must say what approving hands over, and that only
// the person who started it should approve. No request leaves this process.

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

const lib = await loadTs('../src/lib/grokbot-connect.ts', {
  '@/lib/worker-api': { workerRequest: async () => ({ ok: false, status: 0, reason: 'network_error' }) },
})

test('says plainly that approving gives control of the Mac', () => {
  assert.match(lib.GROKBOT_CONSENT.lead, /control of your Mac/)
  assert.match(lib.GROKBOT_CONSENT.warningTitle, /control of your Mac/)
  // What that control is: the agents act on the Mac, with their tools.
  assert.ok(lib.GROKBOT_CONSENT.abilities.some((ability) => /agents/.test(ability) && /on your Mac/.test(ability)))
})

test('asks only the person who started the connection to approve, and anyone sent a link to deny', () => {
  const { warningBody } = lib.GROKBOT_CONSENT
  assert.match(warningBody, /only if you started/i)
  assert.match(warningBody, /sent you this link, deny it/)
  // And how to take it back.
  assert.match(warningBody, /disconnect Grok Bot/)
})

test('the page shows those words', async () => {
  const page = await readFile(new URL('../src/pages/grokbot/connect.tsx', import.meta.url), 'utf8')
  for (const name of ['lead', 'warningTitle', 'warningBody', 'abilities']) assert.match(page, new RegExp(`GROKBOT_CONSENT\\.${name}`))
})
