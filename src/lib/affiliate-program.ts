// The Affiliate program (CONTEXT.md "Affiliate program", ADR 0090): an Enconvo account
// applies on /affiliate, an admin reviews it in the admin console, and an approved
// Affiliate earns a commission on every payment made by a customer its link brought in.
// The Worker owns the terms and the ledger; this file only calls it and formats results.
// Amounts are in cents (USD).

import { workerPost, workerRequest, type WorkerResult } from '@/lib/worker-api'
import { affiliateSub } from '@/lib/affiliate-journey'

export { affiliateSub }

export const SITE_ORIGIN = 'https://enconvo.com'
export const SUPPORT_EMAIL = 'support@enconvo.com'

export type AffiliateStatus = 'pending' | 'approved' | 'rejected' | 'suspended'
export type PayoutMethod = 'paypal' | 'wise'
export type CommissionKind = 'purchase' | 'renewal' | 'upgrade' | 'reversal' | 'chargeback' | 'reinstatement' | 'voided' | 'adjustment'
export type CommissionStatus = 'pending' | 'payable' | 'paid' | 'reversed'

export interface ProgramTerms {
    commission_rate: number
    hold_days: number
    cookie_days: number
    /** Cents. */
    minimum_payout: number
    currency: string
    payout_methods: PayoutMethod[]
}

/** What the Worker answers before its terms arrive; kept equal to PROGRAM_TERMS there. */
export const DEFAULT_TERMS: ProgramTerms = {
    commission_rate: 20,
    hold_days: 30,
    cookie_days: 90,
    minimum_payout: 5000,
    currency: 'usd',
    payout_methods: ['paypal', 'wise'],
}

export interface AffiliateApplication {
    status: AffiliateStatus
    code: string
    /** A promotion code we linked to the Affiliate, lowercase; customers who enter it at checkout count as theirs. */
    promotion_code: string | null
    commission_rate: number
    name: string
    website: string | null
    audience: string
    promotion_plan: string
    payout_method: PayoutMethod | null
    payout_account: string | null
    applied_at: string
    approved_at: string | null
}

export interface AffiliateBalances {
    pending: number
    payable: number
    earned: number
    reversed: number
    paid: number
    currency: string
}

/** Pending money that becomes payable on a UTC day (`YYYY-MM-DD`), soonest first. */
export interface AffiliateRelease {
    day: string
    /** Net of refunds and deductions due the same day; can be negative. */
    amount: number
}

export interface AffiliateReferral {
    /** Masked, e.g. `j***@gmail.com`. */
    customer: string
    joined_at: string
    signed_up: boolean
    plan: string | null
    purchases: number
    paid: number
    commission: number
    /** Voided: Enconvo took back the referral's commissions after review, and its renewals earn nothing. */
    status: 'signed_up' | 'customer' | 'refunded' | 'voided'
    /** The sub ID of the link the customer first came through. */
    sub: string | null
    /** The Affiliate's promotion code, when the customer used it at checkout instead of coming through the link. */
    promotion_code: string | null
    /** Where a paying customer's plan stands now; null for anyone else, or a customer with no plan. */
    subscription?: ReferralPlan | null
    /** The billing period of a renewing or cancelling Cloud plan. */
    billing?: 'monthly' | 'yearly' | null
    /**
     * For a referral that signed up or signed in through the link and hasn't bought: `open` while a purchase would
     * still credit the Affiliate, `closed` once the window passed or the account came through another link since.
     */
    credit_window?: 'open' | 'closed' | null
    /** The last UTC day (`YYYY-MM-DD`) of an open window. */
    credit_until?: string | null
}

export type ReferralPlan = 'renewing' | 'cancelling' | 'ended' | 'lifetime'

export interface AffiliateCommission {
    id: string
    kind: CommissionKind
    /** Masked; null for an adjustment, which belongs to no customer. */
    customer: string | null
    /** What an adjustment (a bonus, correction or carried-over balance) is for; null for every other kind. */
    note?: string | null
    sub: string | null
    promotion_code: string | null
    plan: string | null
    base_amount: number
    rate: number
    amount: number
    currency: string
    earned_at: string
    available_at: string
    status: CommissionStatus
    /** Unpaid, and waiting for Enconvo to review its referral (it looks like the Affiliate's own purchase). */
    in_review?: boolean
}

export interface AffiliatePayout {
    id: string
    amount: number
    currency: string
    method: PayoutMethod
    reference: string | null
    paid_at: string
}

/** One payout with every ledger entry it settled. `added` plus `taken_back` (negative) is the payout's amount. */
export interface AffiliatePayoutStatement {
    affiliate: { name: string | null; code: string }
    payout: AffiliatePayout & { account: string }
    /** Newest first; cut short at 1,000, while the totals still cover every entry and the CSV fetches the rest. */
    entries: AffiliateCommission[]
    entries_truncated: boolean
    totals: { entries: number; added: number; taken_back: number }
}

export interface AffiliateDay {
    day: string
    visitors: number
    signups: number
    purchases: number
}

/**
 * One sub ID's results (`sub` is null for the link without one), or the promotion code's for the customers who used it
 * without the link. Paid and commission are net of reversals.
 */
export interface AffiliateSource {
    sub: string | null
    promotion_code: string | null
    visitors: number
    signups: number
    customers: number
    paid: number
    commission: number
}

/** A referring host (without `www.`) or landing path, by each visitor's first visit through the link; null when the browser sent none. */
export interface AffiliateTrafficRow {
    value: string | null
    visitors: number
    /** Of those visitors, the accounts that bought. */
    customers: number
}

/**
 * One UTC month (`YYYY-MM`) of the monthly statement. Commissions count in the month of the payment, and refunds,
 * disputes, voids (net of disputes won) and adjustments in the month they happened, so `net` can be negative. A bonus
 * adds to `earned` and a deduction to `taken_back`. Amounts in cents.
 */
export interface AffiliateMonth {
    month: string
    visitors: number
    /** First payments that earned a commission; renewals and upgrades aren't counted. */
    purchases: number
    earned: number
    taken_back: number
    net: number
    /** Payouts sent that month. */
    paid: number
}

export interface AffiliateDashboard {
    program: ProgramTerms
    affiliate: AffiliateApplication | null
    /** The rest is only there for an approved or suspended Affiliate. */
    /**
     * The link's results; `commission` (net, in cents) leaves out customers of the promotion code alone.
     * `renewing` counts the paying referrals whose Cloud plan renews, `open_windows` the referrals with an open window.
     */
    totals?: { visitors: number; signups: number; customers: number; commission?: number; renewing?: number; open_windows?: number }
    balances?: AffiliateBalances
    /**
     * The unpaid commissions in review: the referrals they belong to and their total in cents. `holds_payout` once one is
     * past its refund window, since no payout goes out until the review is done.
     */
    review?: { referrals: number; amount: number; holds_payout: boolean }
    releases?: AffiliateRelease[]
    daily?: AffiliateDay[]
    sources?: AffiliateSource[]
    sources_truncated?: boolean
    /** The top 10 of each, by visitors; the rest is `totals.visitors` minus what they add up to. */
    traffic?: { referrers: AffiliateTrafficRow[]; landing_pages: AffiliateTrafficRow[] }
    /** Up to the last 12 months, newest first. */
    months?: AffiliateMonth[]
    referrals?: AffiliateReferral[]
    referrals_truncated?: boolean
    commissions?: AffiliateCommission[]
    commissions_truncated?: boolean
    payouts?: AffiliatePayout[]
}

export interface ApplicationInput {
    code: string
    name: string
    website?: string
    audience: string
    promotion_plan: string
    payout_method?: PayoutMethod
    payout_account?: string
    accept_terms: boolean
}

/** Mirrors the Worker's `affiliateProgramCode`. */
const CODE = /^[a-z0-9][a-z0-9_-]{2,31}$/

export function normalizeAffiliateCode(value: string): string {
    return value.trim().toLowerCase()
}

export function isAffiliateCode(value: string): boolean {
    return CODE.test(value)
}

export const PAYOUT_METHOD_LABEL: Record<PayoutMethod, string> = { paypal: 'PayPal', wise: 'Wise' }

/** Pages worth linking to, all of which record the visit (`useAffiliateJourney` runs site-wide). */
export const LINK_PAGES = [
    { path: '/', label: 'Home page' },
    { path: '/cloud-pricing', label: 'Cloud plans' },
    { path: '/downloads', label: 'Downloads' },
    { path: '/use-cases', label: 'Use cases' },
    { path: '/changelog', label: 'Release notes' },
] as const

/** `https://enconvo.com/cloud-pricing?via=kenmoo`, with `&sub=youtube` for a sub ID. */
export function affiliateLink(code: string, path = '/', sub: string | null = null): string {
    const link = `${SITE_ORIGIN}${path}?via=${encodeURIComponent(code)}`
    return sub ? `${link}&sub=${encodeURIComponent(sub)}` : link
}

/** `4780` → `$47.80`; whole dollars drop the cents unless `cents` is set. */
export function formatCents(amount: number, { cents = true }: { cents?: boolean } = {}): string {
    const value = (Number(amount) || 0) / 100
    const digits = !cents && Number.isInteger(value) ? 0 : 2
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(value)
}

export function formatDay(value: string | null | undefined): string {
    if (!value) return ''
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** A UTC day (`YYYY-MM-DD`) as `Dec 21, 2026`, the same day in every time zone. */
export function formatUtcDay(day: string | null | undefined): string {
    if (!day) return ''
    return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

/** `cloud_monthly` → `Cloud monthly`. */
export function planLabel(plan: string | null | undefined): string {
    if (!plan) return '—'
    const words = plan.replace(/[_-]+/g, ' ').trim()
    return words.charAt(0).toUpperCase() + words.slice(1)
}

/** Customers per visitor, as a percentage with one decimal, or null before any visit. */
export function conversionRate(visitors: number, customers: number): string | null {
    if (!(visitors > 0)) return null
    return `${(Math.round((customers / visitors) * 1000) / 10).toFixed(1)}%`
}

/** Net commission per visitor (EPC), or null without visitors. Below a cent it reads "<$0.01". */
export function earningsPerVisitor(visitors: number, commission: number | undefined): string | null {
    if (!(visitors > 0) || commission === undefined) return null
    const cents = Math.max(0, commission) / visitors
    return cents > 0 && cents < 0.5 ? '<$0.01' : formatCents(cents)
}

/** "Oct 2026" for a `YYYY-MM` month. */
export function formatMonth(month: string): string {
    return new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/** RFC 4180 CSV, with a byte order mark so spreadsheet apps read it as UTF-8. */
export function toCsv(header: string[], rows: (string | number | null | undefined)[][]): string {
    const cell = (value: string | number | null | undefined) => {
        const text = value === null || value === undefined ? '' : String(value)
        // A leading =, +, - or @ would run as a formula in a spreadsheet; a plain negative amount can't.
        const formula = /^[=+\-@]/.test(text) && typeof value !== 'number' && !/^-\d+(\.\d+)?$/.test(text)
        const safe = formula ? `'${text}` : text
        return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
    }
    return `﻿${[header, ...rows].map((row) => row.map(cell).join(',')).join('\r\n')}\r\n`
}

export function downloadCsv(filename: string, csv: string) {
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function fetchProgramTerms() {
    return workerRequest<ProgramTerms>('/api/affiliate/terms')
}

export function getAffiliateDashboard(accessToken: string) {
    return workerPost<AffiliateDashboard>('/api/affiliate/dashboard', accessToken)
}

/** Refused with status 404 when the payout isn't the signed-in Affiliate's. */
export function getPayoutStatement(accessToken: string, id: string) {
    return workerPost<AffiliatePayoutStatement>('/api/affiliate/payout', accessToken, { id })
}

/**
 * Every ledger entry of the signed-in Affiliate, newest first, or only those one of its payouts
 * settled: the dashboard and a payout statement list just the newest, so a CSV fetches the rest
 * a page at a time.
 */
export async function getAllCommissions(accessToken: string, payout?: string): Promise<WorkerResult<AffiliateCommission[]>> {
    const entries: AffiliateCommission[] = []
    for (let after: string | null = null; ; ) {
        const page = await getCommissionPage(accessToken, after, payout)
        if (page.ok === false) return page
        entries.push(...page.data.commissions)
        if (!page.data.next) return { ok: true, data: entries }
        after = page.data.next
    }
}

function getCommissionPage(accessToken: string, after: string | null, payout?: string) {
    return workerPost<{ commissions: AffiliateCommission[]; next: string | null }>('/api/affiliate/commissions', accessToken, { after, payout })
}

export function applyForAffiliate(accessToken: string, input: ApplicationInput) {
    return workerPost<AffiliateApplication>('/api/affiliate/apply', accessToken, input)
}

export function savePayoutMethod(accessToken: string, payout_method: PayoutMethod, payout_account: string) {
    return workerPost<AffiliateApplication>('/api/affiliate/payout_method', accessToken, { payout_method, payout_account })
}
