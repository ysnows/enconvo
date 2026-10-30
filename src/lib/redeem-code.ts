// /redeem takes every code Enconvo hands out (CONTEXT.md "Trial code", "License code"). The
// Worker says which kind a code is: a License code puts a lifetime license on the signed-in
// account on the spot (a Teams code makes it the Team admin of the code's Seats); Trial codes
// activate directly or through Stripe, according to mode.

import { workerPost, workerRequest } from '@/lib/worker-api'
import type { TrialCheckout, TrialCodeInfo, TrialCodeStatus } from '@/lib/trial-code'

export type LicenseCodeTier = 'standard' | 'premium' | 'teams'

export interface LicenseCodeInfo {
    code: string
    valid: boolean
    status: TrialCodeStatus
    tier: LicenseCodeTier
    points: number
    /** A Teams code's Seats */
    seats?: number
}

export type RedeemCodeInfo = ({ kind: 'trial' } & TrialCodeInfo) | ({ kind: 'license' } & LicenseCodeInfo)

export interface LicenseGrant {
    code: string
    tier: LicenseCodeTier
    points: number
    balance: number
    /** A Teams code's Seats */
    seats?: number
}

export interface TrialGrant {
    kind: 'trial'
    points: number
    balance: number
    trial_days: number
    ends_at: string
    requires_card: false
}

export type RedeemResult = ({ kind: 'license' } & LicenseGrant) | ({ kind: 'checkout' } & TrialCheckout) | TrialGrant

/**
 * The Worker's refusals of a Teams code. The page shows the Worker's message translated,
 * and a page ships only the translations named in its code (generate-i18n-message-map.mjs).
 */
export const TEAMS_CODE_REFUSALS = [
    "Your account already manages a team. A Teams code starts a new one, so redeem it with an account that isn't on a team.",
    "Your account has a Seat on another team. Ask that team's admin to unassign it, or redeem this code with an account that isn't on a team.",
] as const

export const LICENSES: Record<LicenseCodeTier, { name: string; devices: string; updates: string }> = {
    standard: { name: 'Standard', devices: '1 Mac', updates: '1 year of free updates' },
    premium: { name: 'Premium', devices: 'Up to 3 Macs', updates: 'Lifetime free updates' },
    teams: { name: 'Teams', devices: '1 per Seat', updates: 'Lifetime free updates' },
}

export function fetchRedeemCode(code: string, signal?: AbortSignal) {
    return workerRequest<RedeemCodeInfo>(`/api/redeem_code/code/${encodeURIComponent(code)}`, { signal })
}

/** Redeems a license or no-card trial, or opens a card-required trial's Checkout. */
export function redeemCode(accessToken: string, code: string) {
    return workerPost<RedeemResult>('/api/redeem_code', accessToken, { code })
}
