// A bounded, last non-direct referral. Only public campaign enums are retained;
// URL query strings, referrer paths, email addresses and account ids are not.
const KEY = 'enconvo_marketing_referral_v1'
const MAX_AGE = 30 * 24 * 60 * 60 * 1000
const CONTENT = new Set(['app_website', 'facts_website', 'other'])
const OWN_HOSTS = new Set(['enconvo.com', 'www.enconvo.com'])

type Referral = { source: 'macworthy'; placement: string; at: number }
let fallback: Referral | null = null

export function readMarketingReferral(): Referral | null {
  if (typeof window === 'undefined') return null
  let value: unknown = fallback
  try { value = JSON.parse(window.localStorage.getItem(KEY) || 'null') } catch {}
  const referral = value as Referral | null
  return referral?.source === 'macworthy' && CONTENT.has(referral.placement) &&
    Number.isFinite(referral.at) && referral.at <= Date.now() && Date.now() - referral.at < MAX_AGE
    ? referral : null
}

/** Called once on initial page entry, before conversions can be recorded. */
export function captureMarketingReferral(): boolean {
  if (typeof window === 'undefined') return false
  // OAuth callbacks and app sign-in URLs are never acquisition entries.
  if (/^\/(?:[a-z]{2}(?:-[A-Z]{2})?\/)?(?:auth|login|register|reset_password|device|share)(?:\/|$)/.test(window.location.pathname)) return false
  const params = new URLSearchParams(window.location.search)
  let referrerHost = ''
  try { referrerHost = new URL(document.referrer).hostname } catch {}
  const source = params.get('utm_source')
  const macworthy = source === 'macworthy' || (!source && ['macworthy.com', 'www.macworthy.com'].includes(referrerHost))
  if (macworthy) {
    const content = params.get('utm_content') || 'other'
    fallback = { source: 'macworthy', placement: CONTENT.has(content) ? content : 'other', at: Date.now() }
    try { window.localStorage.setItem(KEY, JSON.stringify(fallback)) } catch {}
    return true
  }
  // Direct returns keep their referral. A later explicit campaign or another
  // referring website supersedes it, rather than crediting MacWorthy forever.
  if (source || (referrerHost && !OWN_HOSTS.has(referrerHost))) {
    fallback = null
    try { window.localStorage.removeItem(KEY) } catch {}
  }
  return false
}

export function marketingEventParams(): Record<string, string> {
  const referral = readMarketingReferral()
  return referral ? {
    referral_source: referral.source,
    referral_campaign: 'mac-app-directory',
    referral_placement: referral.placement,
  } : {}
}
