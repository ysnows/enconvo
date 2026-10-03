import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import ts from 'typescript'

const require = createRequire(import.meta.url)
async function loadTs(path, dependencies = {}) {
  const url = new URL(path, import.meta.url)
  const source = await readFile(url, 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  })
  const module = { exports: {} }
  const requireFromFile = createRequire(url)
  new Function('require', 'module', 'exports', outputText)(
    (name) =>
      Object.hasOwn(dependencies, name)
        ? dependencies[name]
        : requireFromFile(name),
    module,
    module.exports
  )
  return module.exports
}
const localeTools = await loadTs('../src/i18n/locale.ts')
const { locales, localizePath, translate, canonicalUrl } = localeTools
globalThis.document = { cookie: '' }
globalThis.location = { hostname: 'www.enconvo.com', protocol: 'https:' }
localeTools.rememberLocale('ko')
assert.match(document.cookie, /NEXT_LOCALE=ko/)
assert.match(document.cookie, /Domain=enconvo.com/)
assert.match(document.cookie, /Secure/)
location.hostname = 'localhost'
location.protocol = 'http:'
localeTools.rememberLocale('en')
assert.ok(
  !document.cookie.includes('Domain=') && !document.cookie.includes('Secure')
)
delete globalThis.document
delete globalThis.location
for (const locale of locales) {
  const prefix = locale === 'en' ? '' : `/${locale}`
  assert.equal(
    localizePath(
      '/account?via=example&returnUrl=%2Fredeem%2Fabcd#details',
      locale
    ),
    `${prefix}/account?via=example&returnUrl=%2Fredeem%2Fabcd#details`
  )
  assert.equal(
    localizePath('/zh-CN/use-cases?sub=guide#pair-your-iphone', locale),
    `${prefix}/use-cases?sub=guide#pair-your-iphone`
  )
  assert.equal(
    canonicalUrl('/use-cases?q=test#clip', locale),
    `https://www.enconvo.com${prefix}/use-cases`
  )
  for (const path of [
    '/api/subscription/checkout_sessions',
    '/_next/static/a.js',
    '/logo.webp',
    'https://example.com/x',
    '//example.com/x',
    'enconvo://login',
    'mailto:support@enconvo.com',
    '#pricing',
  ])
    assert.equal(localizePath(path, locale), path)
}
assert.equal(localizePath('/\\example.com', 'ja'), '/\\example.com')
assert.equal(translate({}, 'New copy'), 'New copy')
assert.equal(
  translate({ 'Hello {name}': '你好，{name}' }, 'Hello {name}', {
    name: 'A&B',
  }),
  '你好，A&B'
)
assert.equal(
  translate(
    { 'You earned {p0} in invite rewards.': '你获得了 {p0} 邀请奖励。' },
    'You earned $10 in invite rewards.'
  ),
  '你获得了 $10 邀请奖励。'
)
assert.equal(
  translate({ '{p0}': '危险的匹配', 'Other {p0}': '其他{p0}' }, 'John Smith'),
  'John Smith'
)
assert.equal(translate({ Save: '保存' }, ' Save '), ' 保存 ')
console.log(
  'PASS: locale URLs, protected URLs, fallback, interpolation and registered templates'
)

const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const richMessages = { 'Read {link} for {name}.': '{name}，请阅读{link}。' }
const { I18nText } = await loadTs('../src/i18n/I18nText.tsx', {
  './I18nProvider': {
    useI18n: () => ({ t: (source) => translate(richMessages, source) }),
  },
})
const rich = renderToStaticMarkup(
  React.createElement(I18nText, {
    source: 'Read {link} for {name}.',
    values: {
      link: React.createElement('a', { href: '/terms' }, '条款'),
      name: '<script>A&B</script>',
    },
  })
)
assert.equal(
  rich,
  '&lt;script&gt;A&amp;B&lt;/script&gt;，请阅读<a href="/terms">条款</a>。'
)
assert.equal(
  renderToStaticMarkup(
    React.createElement(I18nText, {
      source: 'Unknown {name}',
      values: { name: 'Free' },
    })
  ),
  'Unknown Free'
)
console.log(
  'PASS: complete sentences can reorder styled links and preserve escaped user values'
)

const serverTools = await loadTs('../src/i18n/server.ts', {
  './locale': localeTools,
})
const homepageMessages = await serverTools.loadMessages('ja', '/')
assert.ok(homepageMessages['Download for macOS'])
assert.ok(
  Object.keys(homepageMessages).length < 500,
  'Only page-specific messages are shipped'
)
assert.deepEqual(await serverTools.loadMessages('invalid', '/'), {})
for (const result of [
  { redirect: { destination: '/login', permanent: false } },
  { notFound: true },
]) {
  assert.deepEqual(
    await serverTools.withI18nProps(async () => result, '/')({ locale: 'ja' }),
    result
  )
}
console.log(
  'PASS: page catalogs stay scoped and existing redirects/notFound responses remain intact'
)

for (const locale of locales) {
  for (const query of [
    { returnUrl: '/redeem/example?via=partner' },
    {
      from: 'app',
      source: 'onboarding',
      handoff: 'mac',
      returnUrl: '/pricing?plan=standard',
    },
  ]) {
    const effects = []
    let finish
    const completed = new Promise((resolve) => {
      finish = resolve
    })
    const router = {
      isReady: true,
      locale: 'en',
      query: { language: locale, ...query },
      push: async (path, as, options) => {
        finish({ path, options })
        return true
      },
    }
    const { default: Callback } = await loadTs(
      '../src/pages/auth/callback.ts',
      {
        '@/i18n/locale': localeTools,
        '@/i18n/server': { i18nStaticProps: () => async () => ({ props: {} }) },
        react: { useEffect: (effect) => effects.push(effect) },
        'next/router': { useRouter: () => router },
        '@supabase/auth-helpers-nextjs': {
          createClientComponentClient: () => ({
            auth: {
              getSession: async () => ({
                data: { session: { access_token: 'test-session' } },
              }),
            },
          }),
        },
        '@/lib/email-preferences-client': {
          consumeRegistrationEmailPreference: () => null,
          syncCurrentEmailPreference: async () => {},
          updateCurrentEmailPreference: async () => {},
        },
      }
    )
    Callback()
    effects.forEach((effect) => effect())
    const result = await completed
    assert.equal(result.options.locale, locale)
    if (!query.from) assert.equal(result.path, query.returnUrl)
    else {
      const destination = new URL(result.path, 'https://www.enconvo.com')
      for (const [key, value] of Object.entries(query))
        assert.equal(destination.searchParams.get(key), value)
    }
  }
}
console.log(
  `PASS: OAuth return routing preserves all ${locales.length} languages, website return paths and native handoff parameters`
)

// Signing up from pricing must carry the UI language into checkout too.
const originalFetch = globalThis.fetch
for (const locale of locales) {
  const effects = []
  let signedIn
  let checkout
  globalThis.window = {
    location: { href: '' },
    endorsely_referral: 'test-referral',
  }
  globalThis.fetch = async (path, options) => {
    checkout = { path, body: JSON.parse(options.body) }
    return {
      status: 200,
      json: async () => ({ url: 'https://checkout.example/session' }),
    }
  }
  const { default: Register } = await loadTs('../src/pages/register.tsx', {
    '@/i18n/server': { i18nStaticProps: () => async () => ({ props: {} }) },
    '@/i18n/I18nProvider': { useI18n: () => ({ locale }) },
    react: {
      useEffect: (effect) => effects.push(effect),
      useRef: () => ({ current: false }),
      useState: (value) => [value, () => {}],
    },
    'next/router': {
      useRouter: () => ({
        isReady: false,
        query: { returnUrl: '/pricing?plan=standard' },
      }),
    },
    '@supabase/auth-helpers-nextjs': {
      createClientComponentClient: () => ({
        auth: {
          getSession: async () => ({ data: { session: null }, error: null }),
          onAuthStateChange: (handler) => {
            signedIn = handler
            return { data: { subscription: { unsubscribe() {} } } }
          },
        },
      }),
    },
    '@/utils/app/native_router': { NativeRouter: {} },
    '@/pages/components/RegisterForm': () => null,
    '@/pages/components/RegisterSuccess': () => null,
  })
  Register()
  effects.forEach((effect) => effect())
  await signedIn('SIGNED_IN', {})
  assert.equal(checkout.path, '/api/subscription/checkout_sessions')
  assert.deepEqual(checkout.body, {
    lookupKey: 'standard',
    locale,
    endorsely_referral: 'test-referral',
  })
  assert.equal(window.location.href, 'https://checkout.example/session')
}
globalThis.fetch = originalFetch
delete globalThis.window
console.log(
  `PASS: pricing sign-up preserves checkout language in all ${locales.length} languages`
)

// A language choice on an auth return must update its hint without losing
// native handoff, return paths or the fragment; ordinary queries stay intact.
function findSelect(element) {
  if (!element || typeof element !== 'object') return null
  if (element.type === 'select') return element
  const children = element.props?.children
  return (Array.isArray(children) ? children : [children])
    .map(findSelect)
    .find(Boolean)
}
for (const language of locales) {
  const calls = []
  const router = {
    pathname: '/login',
    query: {
      language: 'en',
      from: 'app',
      handoff: 'mac',
      returnUrl: '/redeem/test?via=partner',
    },
    asPath:
      '/login?language=en&from=app&handoff=mac&returnUrl=%2Fredeem%2Ftest%3Fvia%3Dpartner#details',
    push: async (...args) => {
      calls.push(args)
      return true
    },
  }
  const events = []
  const { LanguageSwitcher } = await loadTs(
    '../src/components/LanguageSwitcher.tsx',
    {
      react: { useState: (value) => [value, () => {}] },
      'next/router': { useRouter: () => router },
      'lucide-react': { Globe: () => null },
      '@/i18n/I18nProvider': {
        useI18n: () => ({ locale: 'en', t: (source) => source }),
      },
      '@/i18n/locale': { ...localeTools, rememberLocale() {} },
      '@/lib/analytics': { trackEvent: (...args) => events.push(args) },
    }
  )
  const select = findSelect(LanguageSwitcher({}))
  select.props.onChange({ target: { value: language } })
  await new Promise((resolve) => setImmediate(resolve))
  if (language === 'en') {
    assert.equal(calls.length, 0)
    assert.equal(events.length, 0)
    continue
  }
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0][0], {
    pathname: '/login',
    query: { ...router.query, language },
  })
  assert.equal(
    calls[0][1],
    `/login?language=${language}&from=app&handoff=mac&returnUrl=%2Fredeem%2Ftest%3Fvia%3Dpartner#details`
  )
  assert.equal(calls[0][2].locale, language)
  assert.equal(events.length, 1)
  assert.equal(events[0][1].language, language)
  router.query = { preview: 'languages' }
  router.asPath = '/login?preview=languages#details'
  calls.length = 0
  select.props.onChange({ target: { value: language } })
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(calls[0][1], router.asPath)
  assert.deepEqual(calls[0][0].query, router.query)
}
console.log(
  'PASS: auth language switching updates its hint, keeps handoff/query/fragment and records success once'
)

// A promotion formatter is a pure helper, callable without a React render.
const pricingSource = ts.createSourceFile(
  'cloud-pricing.tsx',
  await readFile(
    new URL('../src/pages/cloud-pricing.tsx', import.meta.url),
    'utf8'
  ),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
)
const formattingHelpers = pricingSource.statements
  .filter(
    (node) =>
      ts.isFunctionDeclaration(node) &&
      ['pricingFormats', 'formatPromotionEndsAt'].includes(node.name?.text)
  )
  .map((node) => node.getText(pricingSource))
  .join('\n')
const formattingCode = ts.transpileModule(formattingHelpers, {
  compilerOptions: { target: ts.ScriptTarget.ES2020 },
}).outputText
const formatPromotion = new Function(
  `${formattingCode}; return formatPromotionEndsAt`
)()
const now = new Date('2026-10-03T00:00:00Z')
for (const locale of locales) {
  assert.equal(formatPromotion(undefined, now, locale).kind, 'none')
  assert.equal(formatPromotion('invalid', now, locale).kind, 'none')
  assert.equal(
    formatPromotion('2026-10-02T00:00:00Z', now, locale).kind,
    'expired'
  )
  const end = '2026-10-04T00:00:00Z'
  const active = formatPromotion(end, now, locale)
  assert.equal(active.kind, 'active')
  assert.equal(
    active.absolute,
    new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(end))
  )
}
console.log(
  `PASS: promotion date formatting is safe outside React in all ${locales.length} languages`
)

const catalogs = await Promise.all(
  locales
    .filter((l) => l !== 'en')
    .map(async (locale) => [
      locale,
      JSON.parse(
        await readFile(
          new URL(`../src/i18n/messages/${locale}.json`, import.meta.url),
          'utf8'
        )
      ),
    ])
)
const referenceKeys = Object.keys(catalogs[0][1]).sort()
for (const [locale, messages] of catalogs) {
  assert.deepEqual(
    Object.keys(messages).sort(),
    referenceKeys,
    `${locale} catalog keys`
  )
  for (const [key, value] of Object.entries(messages)) {
    assert.ok(
      key.trim() && typeof value === 'string' && value.trim(),
      `${locale}: empty message`
    )
    assert.deepEqual(
      (value.match(/\{\w+\}/g) || []).sort(),
      (key.match(/\{\w+\}/g) || []).sort(),
      `${locale}: placeholders in ${key}`
    )
  }
}
async function files(dir) {
  return (
    await Promise.all(
      (
        await readdir(dir, { withFileTypes: true })
      ).map((entry) =>
        entry.isDirectory()
          ? files(new URL(`${entry.name}/`, dir))
          : new URL(entry.name, dir)
      )
    )
  ).flat()
}
for (const file of [
  ...(await files(new URL('../src/pages/', import.meta.url))),
  ...(await files(new URL('../src/components/', import.meta.url))),
].filter((u) => u.pathname.endsWith('.tsx'))) {
  const source = ts.createSourceFile(
    file.pathname,
    await readFile(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
  function visit(node) {
    if (ts.isJsxAttribute(node) && node.name.getText(source) === 'source') {
      const literal = ts.isStringLiteral(node.initializer)
        ? node.initializer
        : ts.isJsxExpression(node.initializer) && node.initializer.expression
      if (literal && ts.isStringLiteral(literal)) {
        const key = literal.text.replace(/\s+/g, ' ').trim()
        for (const [locale, messages] of catalogs)
          assert.ok(
            Object.hasOwn(messages, key),
            `${locale}: missing complete sentence ${key}`
          )
      }
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(source) === 't' &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      const key = node.arguments[0].text.replace(/\s+/g, ' ').trim()
      if (key)
        for (const [locale, messages] of catalogs)
          assert.ok(
            Object.hasOwn(messages, key),
            `${locale}: missing ${key} in ${file.pathname}`
          )
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
}
console.log(
  `PASS: ${referenceKeys.length} messages in all ${catalogs.length} catalogs, placeholders and literal call sites`
)

const { filterUseCases, ALL_USE_CASES } = await loadTs(
  '../src/lib/useCaseDiscovery.ts'
)
const items = [
  {
    title: 'Pair your iPhone',
    description: 'Reach your Mac',
    category: 'Everyday Tools',
    slug: 'pair',
  },
]
const chinese = {
  'Pair your iPhone': '配对你的 iPhone',
  'Reach your Mac': '连接你的 Mac',
  'Everyday Tools': '日常工具',
}
assert.equal(
  filterUseCases(items, ALL_USE_CASES, '配对', (s) => chinese[s] || s).length,
  1
)
assert.equal(
  filterUseCases(items, 'Everyday Tools', 'iPhone', (s) => chinese[s] || s)
    .length,
  1
)
assert.equal(
  filterUseCases(items, 'Workflows', '配对', (s) => chinese[s] || s).length,
  0
)
assert.equal(
  filterUseCases(items, ALL_USE_CASES, 'absent', (s) => chinese[s] || s).length,
  0
)
console.log(
  'PASS: translated and English discovery search preserve stable category filtering'
)

// Capture the analytics payload at an HTTP sink; language events must never send URLs or identity.
const payloads = []
const sink = createServer((req, res) => {
  let data = ''
  req.on('data', (part) => {
    data += part
  })
  req.on('end', () => {
    payloads.push(JSON.parse(data))
    res.end('ok')
  })
})
await new Promise((resolve) => sink.listen(0, '127.0.0.1', resolve))
const pending = []
globalThis.window = {
  location: { pathname: '/redeem/PRIVATE-CODE' },
  gtag: (...args) => {
    pending.push(
      fetch(`http://127.0.0.1:${sink.address().port}`, {
        method: 'POST',
        body: JSON.stringify(args),
      })
    )
  },
}
const { trackEvent } = await loadTs('../src/lib/analytics.ts')
for (const language of locales)
  for (const name of [
    'website_language_picker_opened',
    'website_language_changed',
  ])
    trackEvent(
      name,
      {
        language,
        placement: 'navigation',
        ...(name === 'website_language_changed'
          ? { previous_language: 'en' }
          : {}),
      },
      { includePagePath: false }
    )
trackEvent('download_click', { arch: 'arm64', placement: 'hero' })
await Promise.all(pending)
assert.equal(payloads.length, locales.length * 2 + 1)
const languagePayloads = payloads.filter((event) =>
  event[1].startsWith('website_language_')
)
assert.equal(languagePayloads.length, locales.length * 2)
assert.deepEqual(
  new Set(languagePayloads.map((event) => event[2].language)),
  new Set(locales)
)
for (const event of languagePayloads) {
  assert.equal(event[0], 'event')
  assert.ok(locales.includes(event[2].language))
  assert.equal(event[2].page_location, 'https://www.enconvo.com/')
  assert.equal(event[2].page_title, 'Enconvo')
  assert.equal(event[2].page_referrer, '')
  assert.deepEqual(Object.keys(event[2]).sort(), [
    'language',
    'page_location',
    'page_referrer',
    'page_title',
    'placement',
    ...(event[1] === 'website_language_changed' ? ['previous_language'] : []),
    'transport_type',
  ])
}
assert.equal(
  payloads.find((event) => event[1] === 'download_click')[2].page_path,
  '/redeem/PRIVATE-CODE',
  'Existing events retain their existing payload behavior'
)
delete globalThis.window
await new Promise((resolve) => sink.close(resolve))
console.log(
  'PASS: language analytics wire payload excludes URL/identity and existing events retain their behavior'
)
