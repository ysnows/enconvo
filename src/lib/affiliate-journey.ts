import { workerPost, workerRequest } from './worker-api'

// Affiliate journeys (CONTEXT.md "Affiliate journey"): our own record of a visitor who
// arrived through an Affiliate link (`?via=<code>`), kept apart from Endorsely's
// attribution. The `enconvo_via` cookie names the browser with a random visitor id and
// holds the latest Affiliate code; the Worker stores each step (visit, signup or
// sign-in, Checkout, purchase) and decides which journey a step joins. A link's sub ID
// (`?sub=youtube`) goes only to the visit; later steps take it from there.

export const AFFILIATE_COOKIE = 'enconvo_via'
const MAX_AGE_SECONDS = 90 * 24 * 60 * 60
const CODE = /^[A-Za-z0-9_-]{1,64}$/
const VISITOR = /^[A-Za-z0-9-]{16,64}$/
const SUB = /^[a-z0-9][a-z0-9_.-]{0,63}$/

export interface AffiliateJourney {
  visitor: string
  via: string
}

export function affiliateCode(value: unknown): string | null {
  return typeof value === 'string' && CODE.test(value) ? value : null
}

/** A link's sub ID, lowercased the way the Worker stores it; anything else is left out. */
export function affiliateSub(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const sub = value.trim().toLowerCase()
  return SUB.test(sub) ? sub : null
}

/** `<visitor>.<via>`: neither part can hold a character a cookie would need escaped. */
export function parseAffiliateCookie(value: unknown): AffiliateJourney | null {
  if (typeof value !== 'string') return null
  const dot = value.indexOf('.')
  const visitor = value.slice(0, dot)
  const via = value.slice(dot + 1)
  return dot > 0 && VISITOR.test(visitor) && CODE.test(via) ? { visitor, via } : null
}

export function readAffiliateJourney(): AffiliateJourney | null {
  try {
    const cookie = document.cookie.split(';').map(item => item.trim()).find(item => item.startsWith(`${AFFILIATE_COOKIE}=`))
    return parseAffiliateCookie(cookie?.slice(AFFILIATE_COOKIE.length + 1))
  } catch {
    return null
  }
}

/** Start or continue this browser's journey under `via` (the latest code wins, the visitor stays) and record the visit. */
export async function recordAffiliateVisit(via: string, sub: string | null = null): Promise<AffiliateJourney | null> {
  const code = affiliateCode(via)
  if (!code) return null
  const visitor = readAffiliateJourney()?.visitor
    ?? Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${AFFILIATE_COOKIE}=${visitor}.${code}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`
  // The Worker keeps only the path and the referring host.
  await workerRequest('/api/affiliate/visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitor, via: code, sub: affiliateSub(sub) ?? undefined, path: location.pathname, referrer: document.referrer }),
    keepalive: true,
  })
  return { visitor, via: code }
}

/** This browser's journey has a session: the Worker records a signup or sign-in. Once per tab session, visitor and account. */
export async function reportAffiliateSignIn(accessToken: string | undefined, userId: string | undefined) {
  const journey = readAffiliateJourney()
  if (!journey || !accessToken || !userId) return
  const key = `${AFFILIATE_COOKIE}:reported:${journey.visitor}:${userId}`
  try {
    if (sessionStorage.getItem(key)) return
  } catch {
    // Storage blocked: report again; the Worker records each step once.
  }
  const result = await workerPost('/api/affiliate/sign_in', accessToken, { visitor: journey.visitor })
  if (!result.ok) return
  try {
    sessionStorage.setItem(key, '1')
  } catch {
    // See above.
  }
}

/** The journey a checkout request's cookies carry. */
export function affiliateJourneyFrom(cookies: Partial<Record<string, string>> | undefined): AffiliateJourney | null {
  return parseAffiliateCookie(cookies?.[AFFILIATE_COOKIE])
}

/** Checkout metadata naming the journey, so the Worker's webhook can record the purchase step. */
export function affiliateMetadata(journey: AffiliateJourney | null): Record<string, string> {
  return journey ? { via: journey.via, via_visitor: journey.visitor } : {}
}

/** Record the Checkout step. Bookkeeping only: it gives up after `timeoutMs` and never throws. */
export async function reportAffiliateCheckout(accessToken: string | undefined, journey: AffiliateJourney | null, session: string | undefined, plan: string, timeoutMs = 1500) {
  if (!journey || !accessToken || !session) return
  try {
    await workerRequest('/api/affiliate/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', accessToken },
      body: JSON.stringify({ visitor: journey.visitor, session, plan }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch {
    // Never block a purchase on the journey record.
  }
}
