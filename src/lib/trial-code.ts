// Trial codes (CONTEXT.md "Trial code"): one-use codes Enconvo hands out for a free first
// month of the monthly Plus Cloud plan. /redeem/<CODE> looks the code up; redeeming opens
// a Stripe Checkout the Worker creates for the signed-in account (card required, $0 today).

import { normalizeCode } from '@/lib/codes'
import { workerPost, workerRequest } from '@/lib/worker-api'

export type TrialCodeStatus = 'available' | 'used' | 'disabled' | 'expired' | 'not_found'

export interface TrialCodeInfo {
    code: string
    valid: boolean
    status: TrialCodeStatus
    plan: 'plus'
    trial_days: number
    price_usd: number
}

export interface TrialCheckout {
    url: string
    code: string
    /** True when the account's still-open Checkout for this code was reopened. */
    reused: boolean
}

export const normalizeTrialCode = normalizeCode

/** `ABCDEFGHJKMN` → `ABCD-EFGH-JKMN`. */
export function formatTrialCode(code: string): string {
    return code.match(/.{1,4}/g)?.join('-') ?? ''
}

export function fetchTrialCode(code: string, signal?: AbortSignal) {
    return workerRequest<TrialCodeInfo>(`/api/trial_code/code/${encodeURIComponent(code)}`, { signal })
}

export function startTrialCheckout(accessToken: string, code: string) {
    return workerPost<TrialCheckout>('/api/trial_code/checkout', accessToken, { code })
}

/** Why a code can't be redeemed, for the redeem page. */
export function unavailableCopy(status: TrialCodeStatus, kind: 'trial' | 'license' = 'trial'): { title: string; body: string } {
    switch (status) {
        case 'used':
            return { title: 'This code has already been used', body: `Each ${kind} code works once.` }
        case 'expired':
            return { title: 'This code has expired', body: 'Codes can only be redeemed until their end date.' }
        case 'disabled':
            return { title: 'This code is no longer active', body: 'It was turned off by Enconvo.' }
        default:
            return { title: "This code doesn't exist", body: 'Check the code for typos. Codes have 12 letters and numbers.' }
    }
}
