import { workerPost, workerRequest } from './worker-api'

// Affiliate journeys (CONTEXT.md "Affiliate journey"): our own record of a visitor who
// arrived through an Affiliate link (`?via=<code>`), kept apart from Endorsely's
// attribution. The `enconvo_via` cookie names the browser with a random visitor id and
// holds the latest Affiliate code; the Worker stores each step (visit, signup or
// sign-in, Checkout, purchase) and decides which journey a step joins. A link's sub ID
// (`?sub=youtube`) goes only to the visit; later steps take it from there.
//
// Every later step joins the journey through its stored visit, so a visit that never
// reached the Worker (offline, a server error) would lose the Affiliate its sale. It waits
// in localStorage and is sent again on the next page, or when the browser is back online.
//
// Safari keeps a cookie a script wrote for at most 7 days, or 24 hours when the visitor came
// from a link on a site it classes as a tracker, so the website's own server sends the cookie
// back (`/api/affiliate/journey`): a cookie set by the site's response keeps all 90 days.

export const AFFILIATE_COOKIE = 'enconvo_via'
const MAX_AGE_SECONDS = 90 * 24 * 60 * 60
const CODE = /^[A-Za-z0-9_-]{1,64}$/
const VISITOR = /^[A-Za-z0-9-]{16,64}$/
const SUB = /^[a-z0-9][a-z0-9_.-]{0,63}$/
const PENDING_VISIT = `${AFFILIATE_COOKIE}:pending`
// The Worker dates a visit when it arrives, so a late one only stretches the window a little.
const PENDING_MAX_AGE_MS = 48 * 60 * 60 * 1000
const PENDING_MAX_TRIES = 10

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

/** The `enconvo_via` cookie for `journey`, the same whether the page or the server sets it. */
export function affiliateCookie(journey: AffiliateJourney, secure: boolean): string {
  return `${AFFILIATE_COOKIE}=${journey.visitor}.${journey.via}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure ? '; Secure' : ''}`
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
  document.cookie = affiliateCookie({ visitor, via: code }, location.protocol === 'https:')
  void fetch('/api/affiliate/journey', { method: 'POST', credentials: 'same-origin', keepalive: true }).catch(() => null)
  await sendVisit({ visitor, via: code, sub: affiliateSub(sub), path: location.pathname, referrer: document.referrer, at: Date.now(), tries: 0 })
  return { visitor, via: code }
}

interface PendingVisit {
  visitor: string
  via: string
  sub: string | null
  path: string
  referrer: string
  at: number
  tries: number
}

/** Send again a visit that didn't reach the Worker, while this browser's journey still names it. True once it got through. */
export async function retryPendingAffiliateVisit(): Promise<boolean> {
  const visit = readPendingVisit()
  if (!visit) return false
  const journey = readAffiliateJourney()
  const current = journey?.visitor === visit.visitor && journey.via === visit.via
  if (current && Date.now() - visit.at <= PENDING_MAX_AGE_MS && visit.tries < PENDING_MAX_TRIES) return sendVisit(visit)
  clearPendingVisit(visit)
  return false
}

async function sendVisit(visit: PendingVisit): Promise<boolean> {
  writePendingVisit({ ...visit, tries: visit.tries + 1 })
  // The Worker keeps only the path and the referring host.
  const result = await workerRequest('/api/affiliate/visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitor: visit.visitor, via: visit.via, sub: visit.sub ?? undefined, path: visit.path, referrer: visit.referrer }),
    keepalive: true,
  })
  // Recorded (or left out on purpose) or refused for good: either way, don't send it again.
  if (result.ok || result.terminal) clearPendingVisit(visit)
  return result.ok
}

function readPendingVisit(): PendingVisit | null {
  try {
    const visit = JSON.parse(localStorage.getItem(PENDING_VISIT) ?? 'null')
    return visit && typeof visit.at === 'number' && typeof visit.tries === 'number' ? visit : null
  } catch {
    return null
  }
}

function writePendingVisit(visit: PendingVisit) {
  try {
    localStorage.setItem(PENDING_VISIT, JSON.stringify(visit))
  } catch {
    // Storage blocked: the visit gets this one try.
  }
}

/** Forget `visit`, unless a newer visit took its place in the meantime. */
function clearPendingVisit(visit: PendingVisit) {
  try {
    const stored = readPendingVisit()
    if (stored && (stored.at !== visit.at || stored.via !== visit.via)) return
    localStorage.removeItem(PENDING_VISIT)
  } catch {
    // See above.
  }
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
  const result = await workerPost<{ recorded: boolean; via?: string }>('/api/affiliate/sign_in', accessToken, { visitor: journey.visitor })
  // No `via`: the Worker has no visit for this browser yet (one still waiting to be sent), so report again later.
  if (!result.ok || !result.data.via) return
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
