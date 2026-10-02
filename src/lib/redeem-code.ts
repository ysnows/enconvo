// /redeem takes every code Enconvo hands out (CONTEXT.md "Trial code", "License code"). The
// Worker says which kind a code is: a License code puts a lifetime license on the signed-in
// account on the spot, and a Trial code opens a Stripe Checkout for a free Cloud month.

import { workerPost, workerRequest } from '@/lib/worker-api'
import type { TrialCheckout, TrialCodeInfo, TrialCodeStatus } from '@/lib/trial-code'

export type LicenseCodeTier = 'standard' | 'premium'

export interface LicenseCodeInfo {
    code: string
    valid: boolean
    status: TrialCodeStatus
    tier: LicenseCodeTier
    points: number
}

export type RedeemCodeInfo = ({ kind: 'trial' } & TrialCodeInfo) | ({ kind: 'license' } & LicenseCodeInfo)

export interface LicenseGrant {
    code: string
    tier: LicenseCodeTier
    points: number
    balance: number
}

export type RedeemResult = ({ kind: 'license' } & LicenseGrant) | ({ kind: 'checkout' } & TrialCheckout)

export const LICENSES: Record<LicenseCodeTier, { name: string; devices: string; updates: string }> = {
    standard: { name: 'Standard', devices: '1 Mac', updates: '1 year of free updates' },
    premium: { name: 'Premium', devices: 'Up to 3 Macs', updates: 'Lifetime free updates' },
}

export function fetchRedeemCode(code: string, signal?: AbortSignal) {
    return workerRequest<RedeemCodeInfo>(`/api/redeem_code/code/${encodeURIComponent(code)}`, { signal })
}

/** Redeems a License code, or opens a Trial code's Checkout, for the signed-in account. */
export function redeemCode(accessToken: string, code: string) {
    return workerPost<RedeemResult>('/api/redeem_code', accessToken, { code })
}
