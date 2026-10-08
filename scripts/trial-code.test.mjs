import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

// Render the actual redemption page with isolated auth/router boundaries. No live
// code lookup, account write or Stripe call takes place during these checks.
async function page() {
  const url = new URL('../src/pages/redeem/[code].tsx', import.meta.url)
  const source = await readFile(url, 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } })
  const translate = (source, values = {}) => source.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`))
  const mock = {
    '@/i18n/I18nText': { I18nText: ({ source, values }) => translate(source, values) },
    '@/i18n/server': { withI18nProps: fn => fn },
    '@/i18n/I18nProvider': { useI18n: () => ({ t: translate, locale: 'en' }) },
    'next/head': () => null,
    'next/link': ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
    'next/router': { useRouter: () => ({ query: {} }) },
    '@/components/Footer': { Footer: () => null },
    '@/components/SiteNav': { SiteNav: () => null },
    '@/components/landing-styles': { metaLabel: '', primaryButton: '', secondaryButton: '' },
    '@/lib/supabase': { supabase: {} },
    '@/lib/analytics': { trackEvent: () => {} },
    '@/lib/redeem-code': { LICENSES: { standard: { name: 'Standard', devices: '1 Mac', updates: '1 year of free updates' } } },
    '@/lib/trial-code': { normalizeTrialCode: value => value, formatTrialCode: value => value },
  }
  const module = { exports: {} }
  const require = createRequire(url)
  new Function('require', 'module', 'exports', outputText)(name => Object.hasOwn(mock, name) ? mock[name] : require(name), module, module.exports)
  return module.exports.default
}

test('no-card, original renewing and lifetime code pages show their own terms', async () => {
  const Page = await page()
  const props = { code: 'LOCAL-TEST-ONLY', kind: 'trial', status: 'available', trialDays: 30, priceUsd: 10, points: 500000, tier: 'standard', requiresCard: false }
  const direct = renderToStaticMarkup(React.createElement(Page, props))
  assert.match(direct, /500,000/)
  assert.match(direct, /30 days/)
  assert.match(direct, /No credit card required/)
  assert.match(direct, /Ends automatically. No charge./)
  assert.doesNotMatch(direct, /Stripe asks|\$10\/month/)
  const legacy = renderToStaticMarkup(React.createElement(Page, { ...props, requiresCard: true }))
  assert.match(legacy, /Stripe asks for a payment method/)
  assert.match(legacy, /\$10\/month/)
  const license = renderToStaticMarkup(React.createElement(Page, { ...props, kind: 'license', points: 50000 }))
  assert.match(license, /yours for life/)
  assert.doesNotMatch(license, /Stripe asks|trial points expire/)
})

test('new trial terms exist in every locale with intact placeholders', async () => {
  const keys = [
    'Trial activated',
    'Your free month of Plus Cloud is ready',
    '{points} AI points and Plus Cloud features are on your account until {date}. No card, no renewal, no charge. Unused trial points expire then; your top-ups and lifetime license stay.',
    'Try Plus Cloud features with {points} AI points for {days} days. No credit card required. The trial ends automatically, with no renewal or charge.',
    'Ends automatically. No charge.',
    'No card required. Includes {points} AI points for {days} days from redemption. Unused trial points expire at the end; top-ups and lifetime licenses stay. One trial code per account; accounts with an active Cloud plan cannot redeem one.',
  ]
  const placeholders = text => (text.match(/\{\w+\}/g) ?? []).sort()
  for (const locale of ['zh-CN', 'zh-TW', 'ja', 'ko', 'es', 'de', 'fr', 'it', 'pt', 'nl', 'pl']) {
    const messages = JSON.parse(await readFile(new URL(`../src/i18n/messages/${locale}.json`, import.meta.url), 'utf8'))
    for (const key of keys) {
      assert.ok(messages[key], `${locale}: ${key}`)
      assert.deepEqual(placeholders(messages[key]), placeholders(key), `${locale}: ${key}`)
    }
  }
})
