import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

// The Account page's plan sections for Teams (ADR 0112): each Seat sits on a
// person's own account and lasts while assigned, and only a Team admin is
// pointed to the app to assign Seats. Renders the real component with the plan
// already loaded; nothing is fetched.

const compilerOptions = {
  module: ts.ModuleKind.CommonJS,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
  target: ts.ScriptTarget.ES2020,
}
const translate = (source, values = {}) =>
  source.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`))

async function load(path, mock) {
  const url = new URL(path, import.meta.url)
  const { outputText } = ts.transpileModule(await readFile(url, 'utf8'), { compilerOptions })
  const module = { exports: {} }
  const require = createRequire(url)
  new Function('require', 'module', 'exports', outputText)(
    (name) => (Object.hasOwn(mock, name) ? mock[name] : require(name)),
    module,
    module.exports
  )
  return module.exports
}

async function accountPlan(plan) {
  const lib = await load('../src/lib/account-plan.ts', {})
  // The plan is the only state that starts null: hand it over as if loaded.
  const react = { ...React, useState: (initial) => (initial === null ? [plan, () => {}] : React.useState(initial)) }
  return {
    lib,
    component: await load('../src/components/AccountPlan.tsx', {
      react,
      '@/i18n/I18nProvider': { useI18n: () => ({ t: translate, locale: 'en-US' }) },
      '@/lib/account-plan': lib,
      'next/link': ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
    }),
  }
}

const entitlements = (overrides) => ({
  license: { tier: 'teams', since: '2026-10-01T00:00:00.000Z', seats: 0 },
  team: { seats: 0, holdsSeat: true, admin: 'admin@example.com' },
  cloud: { plan: 'none', tier: 'none', endTime: null, active: false, cancelAtPeriodEnd: false },
  deviceLimit: 1,
  ...overrides,
})

async function render(ent, email) {
  const plan = { total: 50000, entitlements: ent, devicesUsed: 1 }
  const { component } = await accountPlan(plan)
  return renderToStaticMarkup(React.createElement(component.default, { accessToken: 'test', email }))
}

test('a member sees who manages their Seat and that it lasts while assigned', async () => {
  const html = await render(entitlements(), 'member@example.com')
  assert.match(html, /Managed by/)
  assert.match(html, /admin@example\.com/)
  assert.match(html, /Seat assigned/)
  assert.match(html, /While your Seat is assigned/)
  assert.match(html, /Updates &amp; support/)
  assert.doesNotMatch(html, /Lifetime · never expires|Purchased|>Seats</)
  assert.doesNotMatch(html, /You manage .* Teams seats|preference\?pane=teams/)
})

test('a Team admin holding the first Seat is pointed to the app to assign the rest', async () => {
  const ent = entitlements({
    license: { tier: 'teams', since: '2026-10-01T00:00:00.000Z', seats: 8 },
    team: { seats: 8, holdsSeat: true, admin: 'Admin@Example.com' },
  })
  const html = await render(ent, 'admin@example.com')
  assert.doesNotMatch(html, /Managed by/)
  assert.match(html, /While your Seat is assigned/)
  assert.match(html, /You manage 8 Teams seats\. Assign them in the Enconvo app: Settings → Account → Teams\./)
  assert.match(html, /href="enconvo:\/\/preference\?pane=teams"[^>]*>.*Open Enconvo/)
  assert.doesNotMatch(html, />Seats</)
})

test('a Team admin without a Seat still gets the hint next to Get Lifetime', async () => {
  const ent = entitlements({
    license: { tier: 'none', since: null, seats: 5 },
    team: { seats: 5, holdsSeat: false, admin: null },
  })
  const html = await render(ent, 'admin@example.com')
  assert.match(html, /Get Lifetime/)
  assert.match(html, /You manage 5 Teams seats\./)
})

test('a v1 Teams license (no admin recorded) shows no Managed by row', async () => {
  const ent = entitlements({
    license: { tier: 'teams', since: '2025-06-01T00:00:00.000Z', seats: 5 },
    team: { seats: 5, holdsSeat: true, admin: null },
  })
  const html = await render(ent, 'buyer@example.com')
  assert.doesNotMatch(html, /Managed by/)
  assert.match(html, /You manage 5 Teams seats\./)
})

test('own lifetime licenses keep their lifetime terms and no Teams hint', async () => {
  const ent = entitlements({
    license: { tier: 'premium', since: '2026-01-01T00:00:00.000Z', seats: 0 },
    team: { seats: 0, holdsSeat: false, admin: null },
    deviceLimit: 3,
  })
  const html = await render(ent, 'buyer@example.com')
  assert.match(html, /Purchased/)
  assert.match(html, /Lifetime · never expires/)
  assert.doesNotMatch(html, /Managed by|Seat assigned|Teams seats/)
})

test('Worker responses from before ADR 0112 (no team field) still read', async () => {
  const { lib } = await accountPlan(null)
  const legacy = { ...entitlements(), team: undefined }
  assert.equal(lib.seatManagedBy(legacy, 'member@example.com'), null)
  assert.equal(lib.teamAdminSeats({ ...legacy, license: { ...legacy.license, seats: 5 } }), 5)
  assert.equal(lib.teamAdminSeats(lib.FREE_ENTITLEMENTS), 0)
})

test('Teams strings exist in every locale with intact placeholders', async () => {
  const keys = [
    'Managed by',
    'Seat assigned',
    'While your Seat is assigned',
    'You manage {p0} Teams seats. Assign them in the Enconvo app: Settings → Account → Teams.',
    'Assign Seats',
    'Thank you for your purchase! Open Enconvo → Settings → Account → Teams to assign Seats to your team by email.',
    '{p0} seats — each person signs in with their own account',
    '{p0} Cloud points bonus to share with your team — 50,000 per seat',
  ]
  const placeholders = (text) => (text.match(/\{\w+\}/g) ?? []).sort()
  for (const locale of ['zh-CN', 'zh-TW', 'ja', 'ko', 'es', 'de', 'fr', 'it', 'pt', 'nl', 'pl']) {
    const messages = JSON.parse(await readFile(new URL(`../src/i18n/messages/${locale}.json`, import.meta.url), 'utf8'))
    for (const key of keys) {
      assert.ok(messages[key], `${locale}: ${key}`)
      assert.deepEqual(placeholders(messages[key]), placeholders(key), `${locale}: ${key}`)
    }
  }
})
