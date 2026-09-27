// Invites ("Give $5, get $5"). An Invite link (/i/<CODE>) keeps its code in a
// first-party cookie; whichever sign-in entry point runs next redeems it once.
// Amounts always come from the Worker (`reward_usd`), never from this file.

export const INVITE_COOKIE = 'enconvo_invite'
export const INVITE_COOKIE_MAX_AGE = 7 * 24 * 60 * 60
export const INVITE_API_ORIGIN = process.env.NEXT_PUBLIC_INVITE_API_ORIGIN || 'https://api.enconvo.com'
/** Fired on `window` after an automatic Redemption finishes; `detail` is the RedeemResult. */
export const INVITE_REDEEMED_EVENT = 'enconvo:invite-redeemed'
export const INVITE_POINTS_PER_USD = 50_000

export type InviteSource = 'link' | 'code'

export interface InviteCodeInfo {
    code: string
    valid: boolean
    reward_points: number
    reward_usd: number
}

export interface InviteRedemption {
    redeemed: boolean
    qualified: boolean
    reward_points: number
    reward_usd: number
    inviter: string
}

export interface InviteSummary {
    code: string
    link: string
    code_disabled: boolean
    reward_points: number
    reward_usd: number
    stats: { invited: number; qualified: number; points_earned: number }
    invitees: {
        id: string
        email: string
        status: 'pending' | 'qualified' | 'revoked'
        reward_points: number
        redeemed_at: string | null
        qualified_at: string | null
    }[]
    redemption: {
        redeemed: boolean
        can_redeem: boolean
        window_ends_at: string | null
        inviter: string | null
        status: 'pending' | 'qualified' | 'revoked' | null
        reward_points: number
    }
}

// Both branches list every field so reads type-check without strictNullChecks
// (this project has `strict: false`, which turns off discriminated-union narrowing).
export type InviteResult<T> =
    | { ok: true; data: T; status?: undefined; reason?: undefined; message?: undefined; terminal?: undefined }
    // status 0 = the request never got a response.
    | { ok: false; data?: undefined; status: number; reason: string; message: string; terminal: boolean }

export type RedeemResult = InviteResult<InviteRedemption> & { code: string }

const GENERIC_ERROR = 'Something went wrong. Please try again.'

/** Mirrors the Worker: accepts a bare code or a pasted link, e.g. `enconvo.com/i/ab-cd23`. */
export function normalizeInviteCode(raw: unknown): string {
    if (typeof raw !== 'string') return ''
    let value = raw.trim()
    const slash = value.lastIndexOf('/')
    if (slash >= 0) value = value.slice(slash + 1)
    value = value.split(/[?#]/)[0].toUpperCase().replace(/[\s-]/g, '')
    return /^[A-Z0-9]{4,16}$/.test(value) ? value : ''
}

/** `5` → `$5`, `2.5` → `$2.50`. */
export function formatRewardUsd(usd: number): string {
    const digits = Number.isInteger(usd) ? 0 : 2
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(usd)
}

export function pointsToUsd(points: number): number {
    return points / INVITE_POINTS_PER_USD
}

/** The Set-Cookie value the landing page sends for a valid code. */
export function inviteCookieHeader(code: string, secure = process.env.NODE_ENV === 'production'): string {
    return `${INVITE_COOKIE}=${code}; Path=/; Max-Age=${INVITE_COOKIE_MAX_AGE}; SameSite=Lax${secure ? '; Secure' : ''}`
}

export function readInviteCookie(): string {
    if (typeof document === 'undefined') return ''
    const prefix = `${INVITE_COOKIE}=`
    const entry = document.cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix))
    if (!entry) return ''
    try {
        return normalizeInviteCode(decodeURIComponent(entry.slice(prefix.length)))
    } catch {
        return ''
    }
}

export function clearInviteCookie() {
    if (typeof document === 'undefined') return
    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${INVITE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
}

async function inviteRequest<T>(path: string, init: RequestInit = {}): Promise<InviteResult<T>> {
    let response: Response
    try {
        response = await fetch(`${INVITE_API_ORIGIN}${path}`, init)
    } catch {
        return {
            ok: false,
            status: 0,
            reason: 'network_error',
            message: 'Could not reach Enconvo. Check your connection and try again.',
            terminal: false,
        }
    }
    const body = await response.json().catch(() => null)
    if (response.ok && body?.data) return { ok: true, data: body.data as T }

    const reason = typeof body?.reason === 'string' ? body.reason : ''
    return {
        ok: false,
        status: response.status,
        reason: reason || 'server_error',
        message: typeof body?.message === 'string' && body.message ? body.message : GENERIC_ERROR,
        // Only a decision the Worker explains is final. A bare 4xx from the edge
        // (missing route, challenge page) or a 401/408/429 is worth another try.
        terminal: !!reason
            && response.status >= 400
            && response.status < 500
            && ![401, 408, 429].includes(response.status),
    }
}

/** Public: is this code live, and what is the reward? */
export function fetchInviteCode(code: string, signal?: AbortSignal) {
    return inviteRequest<InviteCodeInfo>(`/api/invite/code/${encodeURIComponent(code)}`, { signal })
}

export function redeemInvite(accessToken: string, code: string, source: InviteSource) {
    return inviteRequest<InviteRedemption>('/api/invite/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', accessToken },
        body: JSON.stringify({ code, source }),
    })
}

export function getInviteSummary(accessToken: string) {
    return inviteRequest<InviteSummary>('/api/invite/summary', { headers: { accessToken } })
}

let pendingRedeem: Promise<RedeemResult | null> | null = null

/**
 * Redeem the code left by an Invite link, if any. Safe to call from every sign-in
 * entry point: calls share one in-flight request, and the cookie is cleared on
 * success or a final refusal (kept for network errors, 5xx and 401 so a later
 * sign-in retries). Resolves to null when there is nothing to redeem.
 * Callers should not await this before navigating.
 */
export function redeemPendingInvite(
    accessToken: string | null | undefined,
    { notify = true }: { notify?: boolean } = {},
): Promise<RedeemResult | null> {
    if (typeof window === 'undefined' || !accessToken) return Promise.resolve(null)
    if (pendingRedeem) return pendingRedeem
    const code = readInviteCookie()
    if (!code) return Promise.resolve(null)

    pendingRedeem = redeemInvite(accessToken, code, 'link')
        .then((result) => {
            if (result.ok || result.terminal) clearInviteCookie()
            const outcome: RedeemResult = { ...result, code }
            if (notify && (result.ok || result.terminal)) {
                window.dispatchEvent(new CustomEvent(INVITE_REDEEMED_EVENT, { detail: outcome }))
            }
            return outcome
        })
        .finally(() => {
            pendingRedeem = null
        })
    return pendingRedeem
}
