// The unsubscribe page's calls to the Enconvo Worker (api.enconvo.com,
// /api/email-preferences/link/*). Nobody signs in: the token from the email's link names the
// address, and the Worker only ever answers with that address masked.

import { WORKER_API_ORIGIN } from './worker-api'

export const UNSUBSCRIBE_REASONS = [
  ['too_many', 'Too many emails'],
  ['not_relevant', 'These aren’t relevant to me'],
  ['stopped_using', 'I don’t use Enconvo anymore'],
  ['never_signed_up', 'I never signed up for these'],
  ['other', 'Something else'],
] as const
export type UnsubscribeReason = (typeof UNSUBSCRIBE_REASONS)[number][0]

export const MAX_NOTE_CHARACTERS = 500

export interface LinkState {
  /** The address, masked: `m•••@example.com`. */
  email: string
  subscribed: boolean
  /** When the address stopped getting product updates, as an ISO 8601 time. */
  unsubscribed_at: string | null
  can_resubscribe: boolean
}

export type LinkAction = 'status' | 'unsubscribe' | 'resubscribe' | 'feedback'

// Both branches list every field so reads type-check without strictNullChecks.
export type LinkResult<T> =
  | { ok: true; data: T; status?: undefined; error?: undefined }
  // status 0 = the request never got a response.
  | { ok: false; data?: undefined; status: number; error: string }

export async function callUnsubscribeLink<T = LinkState>(
  action: LinkAction,
  body: {
    token: string
    reason?: UnsubscribeReason | null
    note?: string
    /** The issue the email's link named, when the token itself names none. */
    campaign?: string
  }
): Promise<LinkResult<T>> {
  let response: Response
  try {
    response = await fetch(
      `${WORKER_API_ORIGIN}/api/email-preferences/link/${action}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        // No cookies, and no address of this page: the token is all the Worker needs.
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
      }
    )
  } catch {
    return { ok: false, status: 0, error: 'network_error' }
  }
  const answer = await response.json().catch(() => null)
  if (response.ok && answer && typeof answer === 'object')
    return { ok: true, data: answer as T }
  return {
    ok: false,
    status: response.status,
    error: typeof answer?.error === 'string' ? answer.error : 'failed',
  }
}

const TOKEN_SHAPE = /^[A-Za-z0-9._-]{1,1024}$/
const CAMPAIGN_SHAPE = /^[a-z0-9][a-z0-9_-]{0,63}$/

/**
 * What the address bar says about the link:
 * - `token`: after `?t=` (a Broadcast's and a test email's link) or `#t=` (the Worker's redirect
 *   of an older link);
 * - `campaign`: the issue the email named beside it (`?c=`), which goes along with feedback;
 * - `invalid`: the link can't be used: the Worker found it broken (`?link=invalid`), the token
 *   isn't one of ours, or an email's link came without one (a Broadcast whose token Resend
 *   didn't fill in);
 * - `carried`: the address held something in the token's place, so it is cleared either way.
 */
export function readLinkAddress(location: { search: string; hash: string }): {
  token: string | null
  campaign: string | null
  invalid: boolean
  carried: boolean
} {
  const query = new URLSearchParams(location.search)
  const fragment = new URLSearchParams(location.hash.replace(/^#/, ''))
  const raw = fragment.get('t') || query.get('t')
  const token = raw && TOKEN_SHAPE.test(raw) ? raw : null
  const named = query.get('c')
  return {
    token,
    campaign: named && CAMPAIGN_SHAPE.test(named) ? named : null,
    invalid: query.has('link') || (!!raw && !token) || (!token && query.has('c')),
    carried: fragment.has('t') || query.has('t'),
  }
}

/** The note as the Worker will count it: trimmed, in characters rather than UTF-16 units. */
export function noteLength(note: string): number {
  return Array.from(note.trim()).length
}

/** Whether Send feedback has something to send that the Worker will take. */
export function feedbackReady(reason: string | null, note: string): boolean {
  const length = noteLength(note)
  return (!!reason || length > 0) && length <= MAX_NOTE_CHARACTERS
}

/** `November 12, 2026`, in the reader's own time zone; empty when the time can't be read. */
export function unsubscribedDate(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(date)
}
