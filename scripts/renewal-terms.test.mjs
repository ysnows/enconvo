import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

// Auto-renewal terms beside every Subscribe button: the Cloud plan cards state the price, the
// period, that the plan renews until cancelled, where to cancel and when cancelling takes
// effect. The comparison table states the amount under each button and the rest once, in its
// foot. One-time purchases say they never renew. Checkout's own text is built from the Stripe
// price (src/lib/renewal-terms.ts).

const compilerOptions = {
  module: ts.ModuleKind.CommonJS,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
  target: ts.ScriptTarget.ES2020,
}
const translate = (source, values = {}) =>
  source.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`))

async function load(path, mock, edit = (source) => source) {
  const url = new URL(path, import.meta.url)
  const { outputText } = ts.transpileModule(edit(await readFile(url, 'utf8')), { compilerOptions })
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

// The cards as they will read once 2.5.12 ships: the source with its gate turned on.
const GATE = /const SHOW_2_5_12_FEATURES = (?:true|false)/
function release2512(source) {
  assert.match(source, GATE)
  return source.replace(GATE, 'const SHOW_2_5_12_FEATURES = true')
}

// The card shows one Cloud tier at a time, the plan table all of them.
async function renderPricing(billing, { cloud = 'Plus', license = 'Standard', released = false } = {}) {
  const chosen = new Map([
    ['annual', billing],
    ['Plus', cloud],
    ['Standard', license],
  ])
  const react = {
    ...React,
    useState: (initial) => (chosen.has(initial) ? [chosen.get(initial), () => {}] : React.useState(initial)),
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
    '@/styles/PricingCards.module.css': classes,
    '@/images/hero-aurora-bloom.webp': { __esModule: true, default: { src: '/bloom.webp' } },
    'next/link': ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
    '@/components/Button': {
      Button: ({ children, variant: _variant, color: _color, ...props }) => React.createElement('button', props, children),
    },
    '@/components/AffiliateOffer': { AffiliateOffer: () => null },
    '@/lib/analytics': { trackEvent: () => {} },
    '@/lib/affiliate-journey': { reportAffiliateDownload: () => {} },
    '@/lib/campaign-journey': { reportCampaignDownload: () => {} },
    '@/lib/lifetime-pricing': await load('../src/lib/lifetime-pricing.ts', {}),
  }, released ? release2512 : undefined)
  return renderToStaticMarkup(React.createElement(Pricing, { renderedAt: Date.parse('2026-10-25T00:00:00Z') }))
}

test('monthly Cloud cards and table cells state the monthly renewal under each button', async () => {
  for (const [cloud, amount] of [['Plus', '$10'], ['Pro', '$50'], ['Max', '$100']]) {
    const html = await renderPricing('monthly', { cloud })
    assert.ok(
      html.includes(
        `Renews automatically at ${amount}/month plus tax until you cancel. Cancel anytime under Manage billing in your account; the plan stays active until the end of the paid month.`
      ),
      `card terms for ${amount}`
    )
    assert.ok(
      html.includes(`Subscribe</button><p class="planNote">Auto-renews at ${amount}/month plus tax.</p>`),
      `table terms for ${amount}`
    )
  }
  const html = await renderPricing('monthly')
  assert.ok(
    html.includes(
      'Cloud plans renew automatically. Cancel anytime in Manage billing; the plan runs to the end of the paid month.'
    ),
    'table foot'
  )
  // The license card, then Standard, Premium and Teams in the table: all one-time purchases.
  assert.equal(html.split('One-time payment. Never renews.').length - 1, 4)
})

test('annual Cloud cards state the yearly amount charged at each renewal', async () => {
  for (const [cloud, amount] of [['Plus', '$96'], ['Pro', '$480'], ['Max', '$960']]) {
    const html = await renderPricing('annual', { cloud })
    assert.ok(html.includes(`Renews automatically at ${amount}/year plus tax until you cancel.`), `card terms for ${amount}`)
    assert.ok(html.includes(`<p class="planNote">Auto-renews at ${amount}/year plus tax.</p>`), `table terms for ${amount}`)
    assert.ok(!html.includes('/month plus tax'))
    assert.ok(html.includes('the plan runs to the end of the paid year.'), 'table foot')
  }
})

test('the comparison table has all seven plans, one cell each, and Free buys nothing', async () => {
  const html = await renderPricing('annual')
  const start = html.indexOf('role="table"')
  const table = html.slice(start, html.indexOf('class="foot"', start))
  const plans = [...table.matchAll(/<p class="planName">(\w+)/g)].map((match) => match[1])
  assert.deepEqual(plans, ['Free', 'Standard', 'Premium', 'Teams', 'Plus', 'Pro', 'Max'])
  const rows = table.split('role="rowheader"').slice(1)
  assert.equal(rows.length, 7)
  for (const row of rows) assert.equal(row.split('role="cell"').length - 1, 7, row.slice(0, 80))
  assert.ok(table.includes('aria-label="Download — Free"'))
  assert.ok(table.includes('aria-label="Subscribe — Pro"'))
  assert.ok(!table.includes('Subscribe — Free'))
})

test('the feature list marks only what Free limits or leaves out', async () => {
  const html = await renderPricing('annual')
  assert.ok(!html.includes('Every plan<'))
  for (const tag of ['Free: 60 min / month', 'Free: 5 min / month', 'Free: 1 active', 'Free: 1 running', 'Paid plans'])
    assert.ok(html.includes(`>${tag}</span>`), tag)
  // Two cards in a row hold the same number of item rows, so neither has empty space.
  const cards = [...html.matchAll(/grid-column:span (\d+).*?--columns:(\d+).*?<\/ul>/g)].map((match) => ({
    span: Number(match[1]),
    rows: Math.ceil((match[0].split('class="featureItem"').length - 1) / Number(match[2])),
  }))
  assert.equal(cards.length, 7)
  for (let i = 0; i < cards.length; ) {
    if (cards[i].span === 12) {
      i += 1
      continue
    }
    assert.equal(cards[i].span + cards[i + 1].span, 12, `row at card ${i}`)
    assert.equal(cards[i].rows, cards[i + 1].rows, `rows at card ${i}`)
    i += 2
  }
})

test('every Free limit the app enforces is on the Free card', async () => {
  const html = await renderPricing('annual')
  for (const [label, value] of [
    ['Mac device', '1'],
    ['Meetings / mo', '60 min'],
    ['Captions / mo', '60 min'],
    ['Live Talk / mo', '5 min'],
    ['Knowledge base', '1'],
    ['Workflow', '1'],
    ['Scheduled task', '1 active'],
    ['IM bot', '1 running'],
    ['Points, once', '5,000'],
  ])
    assert.ok(html.includes(`<dt>${label}</dt><dd>${value}</dd>`), label)
})

test('features still in beta stay off the public cards until 2.5.12 ships', async () => {
  const html = await renderPricing('annual')
  assert.ok(!html.includes('Host conferences'))
  assert.ok(!html.includes('Your other computers'))
  assert.ok(!html.includes('Other computer'))
})

test('once 2.5.12 ships, Free pairs one other computer and paid plans pair more', async () => {
  const html = await renderPricing('annual', { released: true })
  const start = html.indexOf('aria-label="Free"')
  const free = html.slice(start, html.indexOf('</article>', start))
  // Last, so the other nine keep their columns in the grid.
  assert.ok(free.includes('<dt>Points, once</dt><dd>5,000</dd></div><div><dt>Other computer</dt><dd>1</dd></div></dl>'))
  assert.equal(free.split('<dt>').length - 1, 10)
  const chips = free.slice(free.indexOf('Paid plans only'))
  assert.deepEqual(
    [...chips.matchAll(/<li>([^<]+)<\/li>/g)].map((match) => match[1]),
    ['Remote', 'Avatar', 'Sync', 'Host conferences']
  )
  assert.ok(
    html.includes(
      'Your other computers<span class="desc">Their chats, terminal and screen, from here. Up to 10 paired devices per computer, phones included.</span>'
    )
  )
  assert.ok(html.includes('Host conferences<span class="desc">Guests join from a link.</span>'))
})

test('the license card follows its tier, and Teams shows its seat price', async () => {
  const premium = await renderPricing('annual', { license: 'Premium' })
  assert.ok(premium.includes('Buy Premium'))
  assert.ok(premium.includes('<strong>3</strong> Mac devices'))
  const teams = await renderPricing('annual', { license: 'Teams' })
  assert.ok(teams.includes('Buy Teams License'))
  assert.ok(teams.includes('<strong>1</strong> Mac per seat'))
  assert.ok(teams.includes('<strong>250,000</strong> Cloud points to share'))
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
