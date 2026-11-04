// Sign in with Apple on the website (ADR 0216). The flow is the Worker's: Continue with Apple
// opens `/auth/v1/apple/start?to=web`, Apple posts back to the Worker, and the Worker returns
// this tab to /login/apple with a single-use handoff code or an error in the address's fragment,
// which no server sees, and nothing else. So the login page keeps its own query (the app to
// open, the page to return to) and language in this tab's sessionStorage before it leaves, and
// /login/apple reads them back. Only a tab that kept them redeems a code: one opened from a link
// someone sent would otherwise sign its visitor in to the sender's account.
//
// Never logged, stored or sent to analytics: the handoff code, the tokens and the email.

import { WORKER_API_ORIGIN } from '@/lib/worker-api'

const CONTEXT_KEY = 'enconvo:apple-sign-in'
// Apple's page has 10 minutes (the Worker's state cookie); anything older is another visit's.
const CONTEXT_TTL_MS = 30 * 60 * 1000

export interface AppleSignInContext {
  /** The login page's query with its `?`, or empty. */
  search: string
  locale: string
  /** When Continue with Apple was chosen, in ms since the epoch. */
  startedAt: number
}

/**
 * The Worker's answer on /login/apple: `handoff` or `error`, from the fragment, or from the query
 * the Worker used before it moved them to the fragment.
 */
export function appleReturnParams(): URLSearchParams {
  const params = new URLSearchParams(window.location.search)
  new URLSearchParams(window.location.hash.slice(1)).forEach((value, key) =>
    params.set(key, value)
  )
  return params
}

/** Where Continue with Apple goes. The site has no analytics id to pass as `client`. */
export function appleStartUrl() {
  return `${WORKER_API_ORIGIN}/auth/v1/apple/start?to=web`
}

export function saveAppleSignInContext(
  search: string,
  locale: string,
  now = Date.now()
) {
  try {
    sessionStorage.setItem(
      CONTEXT_KEY,
      JSON.stringify({ search, locale, startedAt: now })
    )
  } catch {
    // Storage blocked: /login/apple can't tell this tab started the sign-in, and refuses it.
  }
}

export function readAppleSignInContext(
  now = Date.now()
): AppleSignInContext | null {
  try {
    const stored = JSON.parse(sessionStorage.getItem(CONTEXT_KEY) || 'null')
    const { search, locale, startedAt } = stored ?? {}
    if (
      typeof search !== 'string' ||
      typeof locale !== 'string' ||
      !Number.isFinite(startedAt) ||
      now - startedAt > CONTEXT_TTL_MS ||
      startedAt > now + 60_000
    )
      return null
    return {
      search: !search || search.startsWith('?') ? search : `?${search}`,
      locale,
      startedAt,
    }
  } catch {
    return null
  }
}

export function clearAppleSignInContext() {
  try {
    sessionStorage.removeItem(CONTEXT_KEY)
  } catch {
    // Storage blocked: nothing was kept.
  }
}

/** The login page's query, as the query object the Google path reads. */
export function appleContextQuery(context: AppleSignInContext | null) {
  return Object.fromEntries(
    new URLSearchParams(context?.search || '')
  ) as Record<string, string>
}

/** /login with the query it had when the tab left for Apple. */
export function appleLoginPath(context: AppleSignInContext | null) {
  return `/login${context?.search || ''}`
}

/** What the page tells the visitor for a Worker reason (the return's `error`, or the handoff's `code`). */
export type AppleSignInProblem =
  | 'cancelled'
  | 'unavailable'
  | 'blocked'
  | 'expired'
  | 'failed'

export function appleSignInProblem(reason: string): AppleSignInProblem {
  if (reason === 'cancelled') return 'cancelled'
  // `unavailable` from the start, `signin_unavailable` when Apple's key is missing at the callback.
  if (reason === 'unavailable' || reason === 'signin_unavailable')
    return 'unavailable'
  if (reason === 'account_blocked') return 'blocked'
  if (reason === 'handoff_invalid') return 'expired'
  return 'failed'
}

export interface AppleHandoff {
  accessToken: string
  refreshToken: string
  /** The sign-in made a new account. */
  created: boolean
  /** The account's email is an Apple Hide My Email relay address. */
  hiddenEmail: boolean
}

// Both branches list every field so reads type-check without strictNullChecks.
export type AppleHandoffResult =
  | { ok: true; session: AppleHandoff; reason?: undefined }
  | { ok: false; session?: undefined; reason: string }

/** Redeems the handoff code once. A failure is final: the code may already be spent. */
export async function redeemAppleHandoff(
  code: string,
  analyticsAllowed: boolean
): Promise<AppleHandoffResult> {
  let response: Response
  try {
    response = await fetch(`${WORKER_API_ORIGIN}/auth/v1/handoff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(analyticsAllowed ? {} : { analytics: 'off' }),
      },
      body: JSON.stringify({ code }),
      cache: 'no-store',
    })
  } catch {
    return { ok: false, reason: 'network_error' }
  }
  const body = await response.json().catch(() => null)
  if (
    response.ok &&
    typeof body?.accessToken === 'string' &&
    typeof body?.refreshToken === 'string'
  ) {
    return {
      ok: true,
      session: {
        accessToken: body.accessToken,
        refreshToken: body.refreshToken,
        created: body.created === true,
        hiddenEmail: body.hiddenEmail === true,
      },
    }
  }
  return {
    ok: false,
    reason: typeof body?.code === 'string' ? body.code : 'failed',
  }
}

/**
 * Removes the account Sign in with Apple just made, for "Use my existing account" on the
 * new-account notice: the Worker's account deletion, which also revokes Apple's token and frees
 * the Apple ID for the existing account. True once the Worker says it is deleted.
 */
export async function deleteNewAppleAccount(accessToken: string) {
  try {
    const response = await fetch(`${WORKER_API_ORIGIN}/user/account/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ confirmation: 'DELETE' }),
      cache: 'no-store',
    })
    const body = await response.json().catch(() => null)
    return response.ok && body?.deleted === true
  } catch {
    return false
  }
}
