import config from './config.json'

export const locales = config.locales as (
  | 'en'
  | 'zh-CN'
  | 'zh-TW'
  | 'ja'
  | 'ko'
  | 'es'
  | 'de'
  | 'fr'
  | 'it'
  | 'pt'
  | 'nl'
  | 'pl'
)[]
export type Locale = (typeof locales)[number]
export const localeNames: Record<Locale, string> = {
  en: 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  ja: '日本語',
  ko: '한국어',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands',
  pl: 'Polski',
}
export const openGraphLocales: Record<Locale, string> = {
  en: 'en_US',
  'zh-CN': 'zh_CN',
  'zh-TW': 'zh_TW',
  ja: 'ja_JP',
  ko: 'ko_KR',
  es: 'es_ES',
  de: 'de_DE',
  fr: 'fr_FR',
  it: 'it_IT',
  pt: 'pt_PT',
  nl: 'nl_NL',
  pl: 'pl_PL',
}
export function getLocale(value?: string): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : 'en'
}

export function rememberLocale(locale: Locale) {
  if (typeof document === 'undefined') return
  const domain = ['enconvo.com', 'www.enconvo.com'].includes(location.hostname)
    ? '; Domain=enconvo.com'
    : ''
  document.cookie = `NEXT_LOCALE=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${domain}${
    location.protocol === 'https:' ? '; Secure' : ''
  }`
}

/** Localize only website paths; APIs, assets, external URLs and app links stay intact. */
export function localizePath(path: string, locale: Locale): string {
  if (typeof path !== 'string') return path
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\'))
    return path
  const match = path.match(/^([^?#]*)(.*)$/)
  let pathname = match[1]
  const suffix = match[2]
  const prefix = pathname.split('/')[1]
  if (locales.includes(prefix as Locale))
    pathname = pathname.slice(prefix.length + 1) || '/'
  if (
    /^\/(?:api|_next)(?:\/|$)/.test(pathname) ||
    /\.[a-z0-9]+$/i.test(pathname)
  )
    return path
  return `${locale === 'en' ? '' : `/${locale}`}${
    pathname === '/' && locale !== 'en' ? '' : pathname
  }${suffix}`
}

export function canonicalUrl(path: string, locale: Locale): string {
  return `https://www.enconvo.com${localizePath(path.split(/[?#]/)[0], locale)}`
}

export type Messages = Record<string, string>
export type Values = Record<string, string | number>
export function translate(
  messages: Messages,
  source: unknown,
  values: Values = {}
): string {
  if (typeof source !== 'string') return source == null ? '' : String(source)
  const key = source.replace(/\s+/g, ' ').trim()
  const message = Object.hasOwn(messages, key)
    ? messages[key]
    : translateTemplate(messages, key)
  const translated =
    message === undefined
      ? source
      : `${source.match(/^\s*/)[0]}${message}${source.match(/\s*$/)[0]}`
  return translated.replace(/\{(\w+)\}/g, (match, key) =>
    Object.hasOwn(values, key) ? String(values[key]) : match
  )
}

// Data and server errors can arrive as an already interpolated English sentence.
// Match only complete, registered templates with a meaningful literal portion.
const patternCache = new WeakMap<
  Messages,
  { expression: RegExp; tokens: string[]; value: string; weight: number }[]
>()
function messagePatterns(messages: Messages) {
  if (patternCache.has(messages)) return patternCache.get(messages)
  const patterns = Object.entries(messages)
    .flatMap(([source, value]) => {
      const tokens = source.match(/\{\w+\}/g)
      if (!tokens || source.replace(/\{\w+\}/g, '').trim().length < 8) return []
      const expression = source
        .split(/\{\w+\}/g)
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('(.*?)')
      return [
        {
          expression: new RegExp(`^${expression}$`),
          tokens,
          value,
          weight: source.replace(/\{\w+\}/g, '').length,
        },
      ]
    })
    .sort((a, b) => b.weight - a.weight)
  patternCache.set(messages, patterns)
  return patterns
}
function translateTemplate(
  messages: Messages,
  source: string
): string | undefined {
  for (const pattern of messagePatterns(messages)) {
    const match = source.match(pattern.expression)
    if (!match) continue
    const values = Object.fromEntries(
      pattern.tokens.map((token, index) => [token, match[index + 1]])
    )
    return pattern.value.replace(/\{\w+\}/g, (token) => values[token] ?? token)
  }
  return undefined
}
