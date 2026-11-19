// Invites, the points tier of Affiliate (ADR 0277): the Invitee gets the Invite
// reward when they first sign in to the app, and the Inviter gets a share of the
// Invitee's first payment. An Invite link (/i/<CODE>) keeps its code in a
// first-party cookie; the site-wide auth hook (`useInviteAutoRedeem`) redeems it
// once a session exists. Dollar amounts always come from the Worker's `*_usd`
// fields; this file never converts points itself.

import { workerPost, workerRequest, type WorkerResult } from '@/lib/worker-api'

export const INVITE_COOKIE = 'enconvo_invite'
export const INVITE_COOKIE_MAX_AGE = 7 * 24 * 60 * 60
/** Fired on `window` after an automatic Redemption finishes; `detail` is the RedeemResult. */
export const INVITE_REDEEMED_EVENT = 'enconvo:invite-redeemed'

export type InviteSource = 'link' | 'code'

export interface InviteCodeInfo {
    code: string
    valid: boolean
    reward_points: number
    reward_usd: number
    /** Whose link it is (ADR 0278); a Worker from before it leaves both out. */
    tier?: 'invite' | 'affiliate' | null
    /** An approved Affiliate's current code, which starts their Affiliate journey; null for anyone else. */
    affiliate_code?: string | null
}

export interface InviteRedemption {
    redeemed: boolean
    qualified: boolean
    reward_points: number
    reward_usd: number
    inviter: string
}

/** A reward the account has not seen yet: the arrival notice announces it once. */
export interface InviteReward {
    id: string
    role: 'inviter' | 'invitee'
    points: number
    usd: number
    /** The other side of the Invite, masked. */
    email: string
}

/** Where the Inviter's share of one Invite stands; a Worker from before ADR 0277 leaves it out. */
export type InviterState =
    | 'pending_payment'
    | 'on_hold'
    | 'earned'
    | 'refunded'
    | 'expired'
    | 'credited_to_affiliate'
    | 'revoked'

export interface InviteSummary {
    code: string
    link: string
    code_disabled: boolean
    reward_points: number
    reward_usd: number
    /** The Inviter's share of the Invitee's first payment, in percent. */
    inviter_rate_percent?: number
    /** Days after the Invitee's registration in which their first payment counts. */
    inviter_window_days?: number
    /** Days a refundable (Lifetime) payment's share waits before it is credited. */
    inviter_hold_days?: number
    /** True totals, even when `invitees` holds only the newest rows. */
    stats: { invited: number; qualified: number; points_earned: number; usd_earned: number }
    /** The newest Invites (the Worker returns at most 100). */
    invitees: {
        id: string
        email: string
        status: 'pending' | 'qualified' | 'revoked'
        reward_points: number
        reward_usd: number
        redeemed_at: string | null
        qualified_at: string | null
        inviter_state?: InviterState
    }[]
    redemption: {
        redeemed: boolean
        can_redeem: boolean
        window_ends_at: string | null
        inviter: string | null
        status: 'pending' | 'qualified' | 'revoked' | null
        reward_points: number
        reward_usd: number
    }
    unseen: { count: number; points: number; usd: number; rewards: InviteReward[] }
}

export type RedeemResult = WorkerResult<InviteRedemption> & { code: string }

// Any person's code an Invite link can carry (ADR 0278): an Invite code, an Affiliate code
// (`ken_moo`, up to 64 characters), a former one or a promotion code.
const REFERRAL_CODE = /^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$/

/**
 * The code an Invite link or the code field carries, as written: trimmed, the last path segment of
 * a pasted link without its query, and spaces taken out. Dashes and letter case stay, so two codes
 * that differ only by a dash never merge here; the Worker resolves the exact code first, then its
 * normalized form. `''` when it can't be a code.
 */
export function normalizeInviteCode(raw: unknown): string {
    if (typeof raw !== 'string') return ''
    let value = raw.trim()
    const slash = value.lastIndexOf('/')
    if (slash >= 0) value = value.slice(slash + 1)
    value = value.split(/[?#]/)[0].replace(/\s/g, '')
    return REFERRAL_CODE.test(value) ? value : ''
}

/**
 * The Worker route that records a signed-in visitor's latest click on an Invite link, for
 * last-click attribution across both tiers. `null` until the Worker ships it: the landing page
 * then sends nothing.
 */
export const INVITE_CLICK_PATH: string | null = null

/** Records the click, fire-and-forget; the landing page calls it only with marketing consent. */
export async function recordInviteClick(accessToken: string, code: string): Promise<void> {
    if (!INVITE_CLICK_PATH) return
    await workerPost(INVITE_CLICK_PATH, accessToken, { code }, { keepalive: true }).catch(() => null)
}

/** What the Worker pays unless its summary says otherwise (ADR 0277). */
export const INVITER_TERMS = { ratePercent: 20, windowDays: 30, holdDays: 30 }

/** `250000` → `250,000`. */
export function formatPoints(points: number): string {
    return new Intl.NumberFormat('en-US').format(points)
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

/** The dollar total of several rewards, summed in cents so it never drifts. */
export function sumRewardsUsd(rewards: Pick<InviteReward, 'usd'>[]): number {
    return rewards.reduce((cents, reward) => cents + Math.round((Number(reward.usd) || 0) * 100), 0) / 100
}

/** The arrival notice's line for the rewards it announces. */
export function inviteArrivalMessage(rewards: InviteReward[]): string {
    const total = formatRewardUsd(sumRewardsUsd(rewards))
    const inviter = rewards.filter((reward) => reward.role === 'inviter')
    if (rewards.length === 1 && inviter.length === 1) return `You earned ${total}: ${inviter[0].email} made their first payment.`
    if (rewards.length === 1) return `Your ${total} invite reward has arrived.`
    if (inviter.length === rewards.length) return `You earned ${total}: ${rewards.length} people you invited made their first payment.`
    return `You earned ${total} in invite rewards.`
}

/** Where the Invitee's reward is paid out: the app, on a device new to Enconvo. */
export const INVITE_DEVICE_COPY = "a Mac, Windows PC, Linux PC or iPhone that's new to Enconvo"

/** The one wording for an automatic Redemption's outcome (site toast and landing page). */
export function describeRedeemOutcome(result: RedeemResult): { title: string; body: string } {
    if (result.ok) {
        const reward = formatPoints(result.data.reward_points)
        return {
            title: 'Invite code redeemed',
            body: result.data.qualified
                ? `You got ${reward} Cloud points.`
                : `Sign in to the Enconvo app on ${INVITE_DEVICE_COPY} to get ${reward} Cloud points.`,
        }
    }
    return {
        title: "We couldn't add this invite",
        body: result.terminal ? result.message : `${result.message} We'll try again the next time you sign in.`,
    }
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

/** Public: is this code live, and what is the reward? */
export function fetchInviteCode(code: string, signal?: AbortSignal) {
    return workerRequest<InviteCodeInfo>(`/api/invite/code/${encodeURIComponent(code)}`, { signal })
}

export function redeemInvite(accessToken: string, code: string, source: InviteSource) {
    return workerPost<InviteRedemption>('/api/invite/redeem', accessToken, { code, source })
}

export function getInviteSummary(accessToken: string) {
    return workerPost<InviteSummary>('/api/invite/summary', accessToken)
}

/**
 * Claim unseen rewards (claim first, then announce): the Worker marks them seen
 * and returns only the ids THIS call newly claimed. Announce those and nothing
 * else, so two open surfaces never show the same reward.
 */
export async function claimInviteRewards(accessToken: string, ids: string[]): Promise<string[] | null> {
    if (ids.length === 0) return []
    const result = await workerPost<{ ok: boolean; claimed?: unknown }>('/api/invite/seen', accessToken, { ids })
    if (!result.ok) return null
    const claimed = result.data.claimed
    // A Worker that does not report `claimed` proves nothing was claimed here: announce nothing.
    return Array.isArray(claimed) ? claimed.filter((id): id is string => typeof id === 'string') : []
}

let pendingRedeem: Promise<RedeemResult | null> | null = null
let lastRedeemOutcome: RedeemResult | null = null

/** The latest automatic Redemption outcome worth showing, for a page that mounts after it. */
export function getLastRedeemOutcome(): RedeemResult | null {
    return lastRedeemOutcome
}

/**
 * Redeem the code left by an Invite link, if any. Only `useInviteAutoRedeem`
 * calls this. Calls share one in-flight request, and the cookie is cleared on
 * success or a final refusal (kept for network errors, 5xx and 401 so a later
 * sign-in retries). `409 already_redeemed` (this account used a different code)
 * clears the cookie silently. Every other outcome is published through
 * INVITE_REDEEMED_EVENT. Resolves to null when there is nothing to redeem.
 */
export function redeemPendingInvite(accessToken: string | null | undefined): Promise<RedeemResult | null> {
    if (typeof window === 'undefined' || !accessToken) return Promise.resolve(null)
    if (pendingRedeem) return pendingRedeem
    const code = readInviteCookie()
    if (!code) return Promise.resolve(null)

    pendingRedeem = redeemInvite(accessToken, code, 'link')
        .then((result) => {
            if (result.ok || result.terminal) clearInviteCookie()
            const outcome: RedeemResult = { ...result, code }
            if (!result.ok && result.reason === 'already_redeemed') return outcome
            lastRedeemOutcome = outcome
            window.dispatchEvent(new CustomEvent(INVITE_REDEEMED_EVENT, { detail: outcome }))
            return outcome
        })
        .finally(() => {
            pendingRedeem = null
        })
    return pendingRedeem
}
