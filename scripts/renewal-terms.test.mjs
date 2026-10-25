import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

// Auto-renewal terms beside every Subscribe button: the Cloud plan cards and the comparison
// table state the price, the period, that the plan renews until cancelled, where to cancel
// and when cancelling takes effect; one-time purchases say they never renew. Checkout's own
// text is built from the Stripe price (src/lib/renewal-terms.ts).

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

// CSS modules: each class is its own name.
const classes = { __esModule: true, default: new Proxy({}, { get: (_, name) => String(name) }) }

async function renderPricing(billing) {
  const react = {
    ...React,
    useState: (initial) => (initial === 'monthly' ? [billing, () => {}] : React.useState(initial)),
    useEffect: () => {},
  }
  const { Pricing } = await load('../src/components/Pricing.tsx', {
    react,
    '@/i18n/I18nProvider': { useI18n: () => ({ t: translate, locale: 'en' }) },
    '@/i18n/I18nText': {
      I18nText: ({ source, values = {} }) =>
        React.createElement(React.Fragment, null, ...source.split(/\{(\w+)\}/).map((part, i) => (i % 2 ? values[part] : part))),
    },
    '@/i18n/locale': { localizePath: (path) => path },
    '@/styles/Home.module.css': classes,
    '@/styles/PlanComparison.module.css': classes,
    'next/link': ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
    '@/components/Button': {
      Button: ({ children, variant: _variant, color: _color, ...props }) => React.createElement('button', props, children),
    },
    '@/components/AffiliateOffer': { AffiliateOffer: () => null },
    '@/lib/analytics': { trackEvent: () => {} },
    '@/lib/affiliate-journey': { reportAffiliateDownload: () => {} },
    '@/lib/campaign-journey': { reportCampaignDownload: () => {} },
    '@/lib/lifetime-pricing': await load('../src/lib/lifetime-pricing.ts', {}),
  })
  return renderToStaticMarkup(React.createElement(Pricing, { renderedAt: Date.parse('2026-10-25T00:00:00Z') }))
}

test('monthly Cloud cards and table cells state the monthly renewal under each button', async () => {
  const html = await renderPricing('monthly')
  for (const amount of ['$10', '$50', '$100']) {
    assert.ok(
      html.includes(
        `Renews automatically at ${amount}/month plus tax until you cancel. Cancel anytime under Manage billing in your account; the plan stays active until the end of the paid month.`
      ),
      `card terms for ${amount}`
    )
    assert.ok(
      html.includes(
        `Subscribe</button><p class="planCtaNote">Renews automatically at ${amount}/month plus tax. Cancel anytime in Manage billing; the plan runs to the end of the paid month.</p>`
      ),
      `table terms for ${amount}`
    )
  }
  // Standard, Premium and Teams are one-time purchases.
  assert.equal(html.split('One-time payment. Never renews.').length - 1, 3)
})

test('annual Cloud cards state the yearly amount charged at each renewal', async () => {
  const html = await renderPricing('annual')
  for (const amount of ['$96', '$480', '$960']) {
    assert.ok(html.includes(`Renews automatically at ${amount}/year plus tax until you cancel.`), `card terms for ${amount}`)
    assert.ok(html.includes(`<p class="planCtaNote">Renews automatically at ${amount}/year plus tax.`), `table terms for ${amount}`)
  }
  assert.ok(!html.includes('/month plus tax'))
})

test('Checkout terms come from the Stripe price', async () => {
  const { renewalTerms, checkoutRenewalTerms, RENEWAL_TERMS_MAX_LENGTH } = await load('../src/lib/renewal-terms.ts', {})
  const price = (unit_amount, interval, interval_count = 1, currency = 'usd') => ({
    unit_amount,
    currency,
    recurring: interval ? { interval, interval_count } : null,
  })
  assert.match(renewalTerms(price(1000, 'month')), /^Renews automatically every month at \$10\.00 plus applicable tax until you cancel\./)
  assert.match(renewalTerms(price(96000, 'year')), /every year at \$960\.00/)
  assert.match(renewalTerms(price(1000, 'month', 3), 2), /every 3 months at \$20\.00/)
  assert.match(renewalTerms(price(1500, 'year', 1, 'jpy')), /at ¥1,500/)
  assert.equal(renewalTerms(price(4900, null)), null)
  assert.ok(renewalTerms(price(99999999, 'month', 12), 500).length <= RENEWAL_TERMS_MAX_LENGTH)

  const asked = []
  const stripe = { prices: { retrieve: async (id) => (asked.push(id), price(48000, 'year')) } }
  assert.match(await checkoutRenewalTerms(stripe, [{ price: 'price_pro_yearly', quantity: 1 }]), /every year at \$480\.00/)
  assert.deepEqual(asked, ['price_pro_yearly'])
  const failing = { prices: { retrieve: async () => { throw new Error('rate limited') } } }
  const warn = console.warn
  console.warn = () => {}
  try {
    assert.equal(await checkoutRenewalTerms(failing, [{ price: 'price_x', quantity: 1 }]), null)
  } finally {
    console.warn = warn
  }
})
