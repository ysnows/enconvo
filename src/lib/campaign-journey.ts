import { workerPost, workerRequest } from './worker-api'

// Campaign journeys (CONTEXT.md "Campaign journey"): our own record of a visitor who arrived
// through a link Enconvo tagged with UTM parameters (`utm_source`, and optionally `utm_medium`,
// `utm_campaign`, `utm_content` and `utm_term`). The `enconvo_utm` cookie names the browser
// with a random visitor id; the Worker stores each step (visit, page, app download, signup or
// sign-in, Checkout, purchase) and joins it to the visitor's latest visit, whose UTM values it
// copies. It is separate from the Affiliate journey and never credits a commission.
//
// As in the Affiliate journey, a visit that never reached the Worker waits in localStorage and
// is sent again on the next page, and the website's own server sends the cookie back
// (`/api/campaign/journey`) so Safari keeps it for all 90 days.

export const CAMPAIGN_COOKIE = 'enconvo_utm'
const MAX_AGE_SECONDS = 90 * 24 * 60 * 60
const VISITOR = /^[A-Za-z0-9-]{16,64}$/
// Built from a string: the `u` flag needs an ES2015 target, which tsc doesn't assume here.
const UTM_VALUE = new RegExp('^[\\p{L}\\p{N}][\\p{L}\\p{N} ._+\\-/:]{0,99}$', 'u')
const PENDING_VISIT = `${CAMPAIGN_COOKIE}:pending`
// The Worker dates a visit when it arrives, so a late one only stretches the window a little.
const PENDING_MAX_AGE_MS = 48 * 60 * 60 * 1000
const PENDING_MAX_TRIES = 10

export interface CampaignUtm {
  source: string
  medium: string | null
  campaign: string | null
  content: string | null
  term: string | null
}

/** One UTM value, trimmed and lowercased the way the Worker stores it; anything else is left out. */
export function utmValue(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim().toLowerCase()
  return UTM_VALUE.test(text) ? text : null
}

/** A link's UTM values; null without a valid `utm_source`, which every Campaign journey needs. */
export function campaignUtm(params: URLSearchParams): CampaignUtm | null {
  const source = utmValue(params.get('utm_source'))
  if (!source) return null
  return {
    source,
    medium: utmValue(params.get('utm_medium')),
    campaign: utmValue(params.get('utm_campaign')),
    content: utmValue(params.get('utm_content')),
    term: utmValue(params.get('utm_term')),
  }
}

export function parseCampaignCookie(value: unknown): string | null {
  return typeof value === 'string' && VISITOR.test(value) ? value : null
}

/** The `enconvo_utm` cookie for `visitor`, the same whether the page or the server sets it. */
export function campaignCookie(visitor: string, secure: boolean): string {
  return `${CAMPAIGN_COOKIE}=${visitor}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure ? '; Secure' : ''}`
}

export function readCampaignVisitor(): string | null {
  try {
    const cookie = document.cookie.split(';').map(item => item.trim()).find(item => item.startsWith(`${CAMPAIGN_COOKIE}=`))
    return parseCampaignCookie(cookie?.slice(CAMPAIGN_COOKIE.length + 1))
  } catch {
    return null
  }
}

/**
 * Start or continue this browser's journey (the visitor stays, the latest link's UTM values win
 * in the Worker) and record the visit on `path`. Returns the visitor, or null for no UTM link.
 */
export async function recordCampaignVisit(utm: CampaignUtm | null, path: string = location.pathname): Promise<string | null> {
  if (!utm?.source) return null
  const visitor = readCampaignVisitor()
    ?? Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')
  document.cookie = campaignCookie(visitor, location.protocol === 'https:')
  void fetch('/api/campaign/journey', { method: 'POST', credentials: 'same-origin', keepalive: true }).catch(() => null)
  // The visit already counts its landing page, so the page step leaves it out this tab session.
  markOnce(pageKey(visitor, path))
  await sendVisit({ visitor, ...utm, path, referrer: document.referrer, at: Date.now(), tries: 0 })
  return visitor
}

interface PendingVisit extends CampaignUtm {
  visitor: string
  path: string
  referrer: string
  at: number
  tries: number
}

/** Send again a visit that didn't reach the Worker, while this browser still carries its visitor. True once it got through. */
export async function retryPendingCampaignVisit(): Promise<boolean> {
  const visit = readPendingVisit()
  if (!visit) return false
  const current = readCampaignVisitor() === visit.visitor
  if (current && Date.now() - visit.at <= PENDING_MAX_AGE_MS && visit.tries < PENDING_MAX_TRIES) return sendVisit(visit)
  clearPendingVisit(visit)
  return false
}

async function sendVisit(visit: PendingVisit): Promise<boolean> {
  writePendingVisit({ ...visit, tries: visit.tries + 1 })
  // Empty values stay out of the body; the Worker keeps only the path and the referring host.
  const result = await workerRequest('/api/campaign/visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      visitor: visit.visitor,
      source: visit.source,
      medium: visit.medium ?? undefined,
      campaign: visit.campaign ?? undefined,
      content: visit.content ?? undefined,
      term: visit.term ?? undefined,
      path: visit.path,
      referrer: visit.referrer,
    }),
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
    if (stored && (stored.at !== visit.at || stored.visitor !== visit.visitor)) return
    localStorage.removeItem(PENDING_VISIT)
  } catch {
    // See above.
  }
}

const pageKey = (visitor: string, path: string) => `${CAMPAIGN_COOKIE}:page:${visitor}:${path}`

/** True the first time `key` is seen this tab session; always true when storage is blocked (the Worker records each step once). */
function markOnce(key: string): boolean {
  try {
    if (sessionStorage.getItem(key)) return false
    sessionStorage.setItem(key, '1')
  } catch {
    // Storage blocked: report again.
  }
  return true
}

/**
 * A browser carrying a journey opened `path`: the Worker keeps one page step per visitor, path and
 * UTC day. Once per tab session, visitor and path.
 */
export function reportCampaignPage(path: string = location.pathname) {
  const visitor = readCampaignVisitor()
  if (!visitor || !markOnce(pageKey(visitor, path))) return
  void workerRequest('/api/campaign/page', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitor, path }),
    keepalive: true,
  })
}

/**
 * This browser's journey clicked to download the app: the Worker records the step once per
 * visitor and campaign. Once per tab session and visitor; it rides out the navigation the download starts.
 */
export function reportCampaignDownload() {
  const visitor = readCampaignVisitor()
  if (!visitor || !markOnce(`${CAMPAIGN_COOKIE}:downloaded:${visitor}`)) return
  void workerRequest('/api/campaign/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitor }),
    keepalive: true,
  })
}

/** This browser's journey has a session: the Worker records a signup or sign-in. Once per tab session, visitor and account. */
export async function reportCampaignSignIn(accessToken: string | undefined, userId: string | undefined) {
  const visitor = readCampaignVisitor()
  if (!visitor || !accessToken || !userId) return
  const key = `${CAMPAIGN_COOKIE}:reported:${visitor}:${userId}`
  try {
    if (sessionStorage.getItem(key)) return
  } catch {
    // Storage blocked: report again; the Worker records each step once.
  }
  const result = await workerPost<{ recorded: boolean; joined: boolean }>('/api/campaign/sign_in', accessToken, { visitor })
  // Not joined: the Worker has no visit for this browser yet (one still waiting to be sent), so report again later.
  if (!result.ok || !result.data.joined) return
  try {
    sessionStorage.setItem(key, '1')
  } catch {
    // See above.
  }
}

/** The visitor a checkout request's cookies carry. */
export function campaignJourneyFrom(cookies: Partial<Record<string, string>> | undefined): string | null {
  return parseCampaignCookie(cookies?.[CAMPAIGN_COOKIE])
}

/** Checkout metadata naming the visitor, so the Worker's webhook can record the purchase step. */
export function campaignMetadata(visitor: string | null): Record<string, string> {
  return visitor ? { utm_visitor: visitor } : {}
}

/** Record the Checkout step. Bookkeeping only: it gives up after `timeoutMs` and never throws; the Worker answers before it writes. */
export async function reportCampaignCheckout(accessToken: string | undefined, visitor: string | null, session: string | undefined, plan: string, timeoutMs = 1500) {
  if (!visitor || !accessToken || !session) return
  try {
    await workerRequest('/api/campaign/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', accessToken },
      body: JSON.stringify({ visitor, session, plan }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch {
    // Never block a purchase on the journey record.
  }
}
