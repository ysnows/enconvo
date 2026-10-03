import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const config = JSON.parse(
  await readFile(new URL('../src/i18n/config.json', import.meta.url), 'utf8')
)
const base = process.env.I18N_CHECK_SITE || 'http://localhost:3001'
const publicPages = [
  '/',
  '/use-cases',
  '/cloud-pricing',
  '/changelog',
  '/privacy',
  '/terms',
  '/affiliate',
  '/affiliate/terms',
]
const privatePages = [
  '/login',
  '/register',
  '/reset_password_send',
  '/account',
  '/redeem',
  '/redeem/ABCD-EFGH-JKMN',
  '/affiliate/payouts/test-payout',
  '/affiliate/statements/2026',
]
const localize = (path, locale) =>
  locale === 'en' ? path : `/${locale}${path === '/' ? '' : path}`
const canonical = (html) =>
  [
    ...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"[^>]*>/g),
  ].map((m) => m[1])
const attribute = (html, key) =>
  [...html.matchAll(/<meta\b([^>]+)>/g)]
    .find(([, attrs]) => attrs.includes(`property="${key}"`))?.[1]
    .match(/content="([^"]+)"/)?.[1]
for (const locale of config.locales) {
  const messages =
    locale === 'en'
      ? {}
      : JSON.parse(
          await readFile(
            new URL(`../src/i18n/messages/${locale}.json`, import.meta.url),
            'utf8'
          )
        )
  for (const path of [...publicPages, ...privatePages]) {
    const target = localize(path, locale)
    const response = await fetch(new URL(target, base), {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'Googlebot' },
    })
    assert.equal(response.status, 200, target)
    const html = await response.text()
    assert.match(html, new RegExp(`<html[^>]*lang="${locale}"`), target)
    for (const language of config.locales)
      assert.ok(
        html.includes(`value="${language}"`),
        `${target}: ${language} choice in initial HTML`
      )
    const navigationPage =
      [
        '/',
        '/use-cases',
        '/changelog',
        '/affiliate',
        '/affiliate/terms',
        '/redeem',
      ].includes(path) ||
      path.startsWith('/affiliate/') ||
      path.startsWith('/redeem/')
    assert.equal(
      [...html.matchAll(/<option value="en"/g)].length,
      navigationPage ? 2 : 1,
      `${target}: language pickers are not duplicated`
    )
    assert.ok(
      !html.includes('Internal Server Error') &&
        !html.includes('Unhandled Runtime Error'),
      target
    )
    if (publicPages.includes(path)) {
      assert.deepEqual(
        canonical(html),
        [`https://www.enconvo.com${target}`],
        target
      )
      for (const alternate of [...config.locales, 'x-default'])
        assert.ok(
          html.includes(`hrefLang="${alternate}"`) ||
            html.includes(`hreflang="${alternate}"`),
          `${target}: ${alternate}`
        )
      if (!path.startsWith('/affiliate'))
        assert.equal(
          attribute(html, 'og:url'),
          `https://www.enconvo.com${target}`
        )
      assert.ok(!/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/.test(html))
    } else
      assert.match(html, /name="robots" content="noindex(?:, follow)?"/, target)
    if (path === '/') {
      assert.ok(
        html.includes(messages['Download for macOS'] || 'Download for macOS')
      )
      const structured = [
        ...html.matchAll(
          /<script[^>]*type="application\/ld\+json"[^>]*>([^<]+)<\/script>/g
        ),
      ]
        .map((m) => JSON.parse(m[1]))
        .find((j) => j['@graph'])['@graph']
      const page = structured.find((item) => item['@type'] === 'WebPage')
      const app = structured.find(
        (item) => item['@type'] === 'SoftwareApplication'
      )
      assert.equal(page.inLanguage, locale)
      assert.equal(page.url, `https://www.enconvo.com${target}`)
      assert.equal(app.offers.price, '0')
      assert.equal(app.offers.priceCurrency, 'USD')
      assert.equal(app.operatingSystem, 'macOS 14 or later')
    }
    if (path === '/use-cases') {
      const structured = [
        ...html.matchAll(
          /<script[^>]*type="application\/ld\+json"[^>]*>([^<]+)<\/script>/g
        ),
      ]
        .map((m) => JSON.parse(m[1]))
        .find((j) => j['@type'] === 'ItemList')
      assert.ok(structured.itemListElement.length > 0)
      assert.equal(structured.itemListElement[0].item.inLanguage, locale)
      assert.ok(
        structured.itemListElement[0].item.url.startsWith(
          `https://www.enconvo.com${target}#`
        )
      )
    }
  }
  const missing = await fetch(
    new URL(localize('/page-that-does-not-exist', locale), base),
    { headers: { 'Accept-Language': 'en' } }
  )
  assert.equal(missing.status, 404)
  const missingHtml = await missing.text()
  assert.match(missingHtml, new RegExp(`<html[^>]*lang="${locale}"`))
  assert.ok(
    missingHtml.includes(messages['Page not found'] || 'Page not found')
  )
  assert.ok(missingHtml.includes(messages['Back to home'] || 'Back to home'))
  console.log(
    `PASS: ${locale} public/private/404 pages, initial HTML, metadata and structured data`
  )
}
const redirected = await fetch(new URL('/zh-CN/pricing?via=example', base), {
  redirect: 'manual',
})
assert.ok([307, 308].includes(redirected.status))
assert.match(redirected.headers.get('location'), /\/zh-CN.*#pricing/)
console.log('PASS: legacy pricing redirect retains the locale')

for (const locale of config.locales.filter((language) => language !== 'en')) {
  for (const path of [
    '/pay_success?success=true&from=trial_code&session_id=test-session',
    '/redeem/ABCD-EFGH-JKMN?canceled=true',
  ]) {
    const response = await fetch(new URL(path, base), {
      redirect: 'manual',
      headers: { Cookie: `NEXT_LOCALE=${locale}`, 'Accept-Language': 'en' },
    })
    assert.equal(response.status, 307)
    const target = new URL(response.headers.get('location'), base)
    assert.equal(target.pathname, `/${locale}${path.split('?')[0]}`)
    assert.equal(target.search, new URL(path, base).search)
    const restored = await fetch(target, {
      redirect: 'manual',
      headers: { Cookie: `NEXT_LOCALE=${locale}`, 'Accept-Language': 'en' },
    })
    assert.equal(
      restored.status,
      200,
      'Restored locale does not redirect again'
    )
  }
}
const normalPayment = await fetch(
  new URL('/pay_success?success=true&from=subscription', base),
  { redirect: 'manual', headers: { Cookie: 'NEXT_LOCALE=ko' } }
)
assert.equal(
  normalPayment.status,
  200,
  'Website checkout keeps its explicit return language'
)
const forgedCookie = await fetch(
  new URL('/pay_success?success=true&from=trial_code', base),
  { redirect: 'manual', headers: { Cookie: 'NEXT_LOCALE=invalid' } }
)
assert.equal(forgedCookie.status, 200)
console.log(
  'PASS: trial-code Worker success/cancel returns restore preferences, retain parameters and avoid redirect loops'
)
