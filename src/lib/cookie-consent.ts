// Cookie consent (the Cookie Policy, /cookies). Strictly necessary storage needs no consent:
// the sign-in session, the language, an Invite or Welcome offer the visitor opened, dismissed
// notices and this choice itself. The two optional categories run only after the visitor allows
// them, and stop, with what they stored removed, when the visitor withdraws:
//
// - analytics: Google Analytics (gtag.js and its `_ga` cookies) and the browser storage that keeps
//   its sign-up events from counting twice;
// - marketing: the Campaign and Affiliate journeys (`enconvo_utm`, `enconvo_via` and their pending
//   visits) and the MacWorthy referral.
//
// Nothing in either category loads or writes before the visitor chooses. The choice is a
// first-party cookie shared by the bare and www domains, kept for 180 days, then asked again.

export type ConsentCategory = 'analytics' | 'marketing'
export interface CookieConsent {
  analytics: boolean
  marketing: boolean
  /** When the visitor chose, in seconds since the epoch. */
  at: number
}

export const CONSENT_COOKIE = 'enconvo_consent'
export const GA_MEASUREMENT_ID = 'G-JBLMBKBEN2'
const VERSION = '1'
const MAX_AGE_SECONDS = 180 * 24 * 60 * 60
const CHANGE_EVENT = 'enconvo:cookie-consent'
const OPEN_EVENT = 'enconvo:cookie-settings'
const SITE_DOMAINS = ['enconvo.com', 'www.enconvo.com']

const ANALYTICS_COOKIE = /^_ga(?:_.+)?$|^_gid$|^_gat(?:_.+)?$/
const ANALYTICS_STORAGE = [
  'enconvo_signup_reported_v1',
  'enconvo_google_signup_intent_v1',
]
const MARKETING_COOKIES = ['enconvo_utm', 'enconvo_via']
const MARKETING_STORAGE_PREFIXES = ['enconvo_utm:', 'enconvo_via:']
const MARKETING_STORAGE = ['enconvo_marketing_referral_v1']

/** `1.<analytics>.<marketing>.<seconds>`; anything else, or another version, means no choice yet. */
export function parseCookieConsent(value: unknown): CookieConsent | null {
  if (typeof value !== 'string') return null
  const match = /^1\.([01])\.([01])\.(\d{1,12})$/.exec(value)
  if (!match) return null
  const at = Number(match[3])
  const now = Date.now() / 1000
  if (at > now + 60 || now - at > MAX_AGE_SECONDS) return null
  return { analytics: match[1] === '1', marketing: match[2] === '1', at }
}

export function formatCookieConsent(consent: CookieConsent): string {
  return `${VERSION}.${consent.analytics ? 1 : 0}.${
    consent.marketing ? 1 : 0
  }.${Math.floor(consent.at)}`
}

function cookieDomain(): string {
  return SITE_DOMAINS.includes(location.hostname) ? '; Domain=enconvo.com' : ''
}

export function readCookieConsent(): CookieConsent | null {
  if (typeof document === 'undefined') return null
  try {
    const entry = document.cookie
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${CONSENT_COOKIE}=`))
    return parseCookieConsent(entry?.slice(CONSENT_COOKIE.length + 1))
  } catch {
    return null
  }
}

/** False until the visitor has allowed `category`. */
export function hasConsent(category: ConsentCategory): boolean {
  return readCookieConsent()?.[category] === true
}

function expireCookie(name: string) {
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  // Each cookie may have been set on this host or on the parent domain, so both go.
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
  for (const domain of ['enconvo.com', '.enconvo.com', location.hostname]) {
    document.cookie = `${name}=; Path=/; Max-Age=0; Domain=${domain}; SameSite=Lax${secure}`
  }
}

function cookieNames(): string[] {
  return document.cookie
    .split(';')
    .map((part) => part.trim().split('=')[0])
    .filter(Boolean)
}

function removeStorage(names: string[], prefixes: string[] = []) {
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      for (const key of Object.keys(storage)) {
        if (
          names.includes(key) ||
          prefixes.some((prefix) => key.startsWith(prefix))
        ) {
          storage.removeItem(key)
        }
      }
    } catch {
      // Storage blocked: nothing was kept there.
    }
  }
}

/** Removes what Google Analytics stored and stops a gtag.js that already loaded. */
export function clearAnalyticsStorage() {
  if (typeof window === 'undefined') return
  try {
    ;(window as unknown as Record<string, unknown>)[
      `ga-disable-${GA_MEASUREMENT_ID}`
    ] = true
    window.gtag?.('consent', 'update', { analytics_storage: 'denied' })
    for (const name of cookieNames())
      if (ANALYTICS_COOKIE.test(name)) expireCookie(name)
  } catch {
    // Nothing to remove.
  }
  removeStorage(ANALYTICS_STORAGE)
}

/** Removes the Campaign and Affiliate journeys and the MacWorthy referral from this browser. */
export function clearMarketingStorage() {
  if (typeof window === 'undefined') return
  try {
    for (const name of MARKETING_COOKIES) expireCookie(name)
  } catch {
    // Nothing to remove.
  }
  removeStorage(MARKETING_STORAGE, MARKETING_STORAGE_PREFIXES)
}

/** Records the visitor's choice and removes what a category they don't allow stored. */
export function saveCookieConsent(choice: {
  analytics: boolean
  marketing: boolean
}) {
  const consent: CookieConsent = { ...choice, at: Date.now() / 1000 }
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${CONSENT_COOKIE}=${formatCookieConsent(
    consent
  )}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${cookieDomain()}${secure}`
  if (!consent.analytics) clearAnalyticsStorage()
  else
    (window as unknown as Record<string, unknown>)[
      `ga-disable-${GA_MEASUREMENT_ID}`
    ] = false
  if (!consent.marketing) clearMarketingStorage()
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

/** Opens the cookie settings, from the footer or the Cookie Policy. */
export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT))
}

export function onCookieSettingsOpen(listener: () => void): () => void {
  window.addEventListener(OPEN_EVENT, listener)
  return () => window.removeEventListener(OPEN_EVENT, listener)
}

/** Calls `listener` whenever this page saves a choice (`saveCookieConsent`). */
export function onCookieConsentChange(listener: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, listener)
  return () => window.removeEventListener(CHANGE_EVENT, listener)
}
