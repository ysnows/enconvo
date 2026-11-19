import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

// Invite links (/i/<code>) after the Invite and Affiliate merge (ADR 0277, ADR 0278): which codes
// the page takes, what it promises each side, and that an Affiliate's link starts their
// Affiliate journey. The Worker is a local fake; no account or api.enconvo.com route is touched.

async function loadTs(path, mocks = {}) {
  const url = new URL(path, import.meta.url)
  const { outputText } = ts.transpileModule(await readFile(url, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
  })
  const module = { exports: {} }
  const require = createRequire(url)
  new Function('require', 'module', 'exports', outputText)(
    name => (Object.hasOwn(mocks, name) ? mocks[name] : require(name)),
    module,
    module.exports
  )
  return module.exports
}

const workerApi = { workerPost: async () => ({ ok: false }), workerRequest: async () => ({ ok: false }), WORKER_API_ORIGIN: 'https://worker.test' }

async function inviteLib() {
  const codes = await loadTs('../src/lib/codes.ts')
  return loadTs('../src/lib/invite.ts', { '@/lib/codes': codes, '@/lib/worker-api': workerApi })
}

test('an Invite link takes Invite codes as before and any Affiliate code the Worker resolves', async () => {
  const { normalizeInviteCode } = await inviteLib()
  assert.equal(normalizeInviteCode('ab2c-de3f'), 'AB2CDE3F')
  assert.equal(normalizeInviteCode('https://enconvo.com/i/ab2cde3f?x=1'), 'AB2CDE3F')
  assert.equal(normalizeInviteCode('KEN-MOO'), 'KENMOO')
  assert.equal(normalizeInviteCode('Ken_Moo'), 'ken_moo')
  assert.equal(normalizeInviteCode('a-very-long-affiliate-code-2026'), 'a-very-long-affiliate-code-2026')
  assert.equal(normalizeInviteCode('x'.repeat(64)), 'x'.repeat(64))
  assert.equal(normalizeInviteCode('x'.repeat(65)), '')
  assert.equal(normalizeInviteCode('_leading'), '')
  assert.equal(normalizeInviteCode('bad code!'), '')
  assert.equal(normalizeInviteCode(42), '')
})

async function invitePage(codeInfo, router) {
  const invite = await inviteLib()
  const journey = await loadTs('../src/lib/affiliate-journey.ts', { './worker-api': workerApi })
  const translate = (source, values = {}) => String(source).replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`))
  return loadTs('../src/pages/i/[code].tsx', {
    '@/i18n/I18nText': { I18nText: ({ source, values }) => translate(source, Object.fromEntries(Object.entries(values ?? {}).map(([k, v]) => [k, typeof v === 'object' ? renderToStaticMarkup(v) : v]))) },
    '@/i18n/locale': { localizePath: path => path },
    '@/i18n/server': { withI18nProps: fn => fn },
    '@/i18n/I18nProvider': { useI18n: () => ({ t: translate, locale: 'en' }) },
    'next/head': () => null,
    'next/image': () => null,
    'next/link': ({ href, children }) => React.createElement('a', { href }, children),
    'next/router': { useRouter: () => router },
    '@/components/Footer': { Footer: () => null },
    '@/components/SiteNav': { SiteNav: () => null },
    '@/components/InviteRedeemMessage': { InviteRedeemMessage: () => null },
    '@/components/landing-styles': { metaLabel: '', primaryButton: '', secondaryButton: '' },
    '@/data/iphoneApp': { IPHONE_APP_TESTFLIGHT_URL: 'https://testflight.test' },
    '@/data/siteMetadata': { SITE_URL: 'https://www.enconvo.com' },
    '@/lib/analytics': { trackEvent: () => {} },
    '@/lib/supabase': { supabase: { auth: { getSession: async () => ({ data: { session: null } }) } } },
    '@/lib/invite-auto-redeem': { useInviteRedeemed: () => {} },
    '@/lib/affiliate-journey': journey,
    '@/lib/invite': { ...invite, fetchInviteCode: async () => ({ ok: true, data: codeInfo }), getLastRedeemOutcome: () => null },
  })
}

const base = { valid: true, reward_points: 250000, reward_usd: 5 }

async function serverProps(module, code) {
  const headers = {}
  const result = await module.getServerSideProps({ params: { code }, res: { setHeader: (name, value) => (headers[name] = value) } })
  return { props: result.props, headers }
}

test("an Affiliate's link greets with the sign-in gift and starts their Affiliate journey", async () => {
  const router = { isReady: true, pathname: '/i/[code]', query: { code: 'ken_moo' }, replace: async () => true }
  const module = await invitePage({ ...base, code: '', tier: 'affiliate', affiliate_code: 'ken_moo' }, router)
  const { props, headers } = await serverProps(module, 'Ken_Moo')
  assert.equal(props.code, 'ken_moo')
  assert.equal(props.status, 'valid')
  assert.equal(props.affiliateVia, 'ken_moo')
  assert.match(headers['Set-Cookie'], /^enconvo_invite=ken_moo;/)
  const html = renderToStaticMarkup(React.createElement(module.default, props))
  assert.match(html, /250,000 Cloud points \(\$5\)/)
  assert.match(html, /the person who shared this link earns a commission/)
  assert.doesNotMatch(html, /your friend gets 20%/)
})

test('an Invite link promises the Inviter a share of the first payment, and starts no Affiliate journey', async () => {
  const router = { isReady: true, pathname: '/i/[code]', query: { code: 'AB2CDE3F' }, replace: async () => true }
  const module = await invitePage({ ...base, code: 'AB2CDE3F', tier: 'invite', affiliate_code: null }, router)
  const { props } = await serverProps(module, 'AB2CDE3F')
  assert.equal(props.affiliateVia, null)
  const html = renderToStaticMarkup(React.createElement(module.default, props))
  assert.match(html, /250,000 Cloud points \(\$5\)/)
  assert.match(html, /your friend gets 20% of that first payment in Cloud points/)
  assert.doesNotMatch(html, /you both get|You both get/i)
})

test("an Affiliate code from an Affiliate who isn't approved starts no journey", async () => {
  const router = { isReady: true, pathname: '/i/[code]', query: { code: 'ken_moo' }, replace: async () => true }
  const module = await invitePage({ ...base, code: '', tier: 'invite', affiliate_code: null }, router)
  const { props } = await serverProps(module, 'ken_moo')
  assert.equal(props.affiliateVia, null)
  assert.equal(props.status, 'valid')
})
