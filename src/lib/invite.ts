// Invites ("Give $5, get $5"). An Invite link (/i/<CODE>) keeps its code in a
// first-party cookie; the site-wide auth hook (`useInviteAutoRedeem`) redeems it
// once a session exists. Dollar amounts always come from the Worker's `*_usd`
// fields; this file never converts points itself.

import { normalizeCode } from '@/lib/codes'
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

export interface InviteSummary {
    code: string
    link: string
    code_disabled: boolean
    reward_points: number
    reward_usd: number
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

export const normalizeInviteCode = normalizeCode

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
    if (rewards.length === 1 && inviter.length === 1) return `You earned ${total}: ${inviter[0].email} joined Enconvo with your invite.`
    if (rewards.length === 1) return `Your ${total} invite reward has arrived.`
    if (inviter.length === rewards.length) return `You earned ${total}: ${rewards.length} friends joined Enconvo with your invite.`
    return `You earned ${total} in invite rewards.`
}

/** Where the invite reward is paid out: the app, on a device new to Enconvo. */
export const INVITE_DEVICE_COPY = "a Mac, Windows PC, Linux PC or iPhone that's new to Enconvo"

/** The one wording for an automatic Redemption's outcome (site toast and landing page). */
export function describeRedeemOutcome(result: RedeemResult): { title: string; body: string } {
    if (result.ok) {
        const reward = formatRewardUsd(result.data.reward_usd)
        return {
            title: 'Invite code redeemed',
            body: result.data.qualified
                ? `You and your friend each got ${reward} in Cloud points.`
                : `Sign in to the Enconvo app on ${INVITE_DEVICE_COPY}, and you both get ${reward} in Cloud points.`,
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
