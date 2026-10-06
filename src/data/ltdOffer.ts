import { lifetimePrices, lifetimeSale } from '../lib/lifetime-pricing'

export const LTD_OFFER = {
  path: '/ltd',
  discountPercent: 40,
  // The community price ends when the new base prices start (lifetime-pricing.ts); the
  // promotion code expires at the same instant.
  endsAt: '2026-12-08T00:00:00-08:00',
  // Both live in Stripe: the coupon (40% once, license products only) and the
  // promotion code applied at checkout. Checkout refuses a coupon whose percent
  // differs, so a new discount level needs a new coupon and code.
  couponId: 'KENMOO2026',
  promotionCode: 'KENMOO2026',
  affiliateCode: 'kenmoo',
  communityUrl: 'https://www.facebook.com/groups/softwarelifetimedealsappsumosaasltdkenmoo',
  communityIcon: '/ltd/kenmoo.png',
} as const

// Prices come from the lifetime schedule (`ltdPlansAt`).
const LTD_PLAN_DETAILS = [
  {
    key: 'standard',
    name: 'Standard',
    description: 'Your everyday Mac assistant.',
    devices: '1 Mac device',
    deviceCount: 1,
    updates: '1 year of free updates',
    bonusPoints: '50,000 Cloud points',
  },
  {
    key: 'premium',
    name: 'Premium',
    description: 'For all your Macs, with lifetime updates.',
    devices: '3 Mac devices',
    deviceCount: 3,
    updates: 'Lifetime free updates',
    bonusPoints: '150,000 Cloud points',
  },
  {
    key: 'teams',
    name: 'Teams',
    description: 'Five Macs sharing one account.',
    devices: '5 Mac devices on one account',
    deviceCount: 5,
    updates: 'Lifetime free updates',
    bonusPoints: '250,000 Cloud points',
  },
] as const

export type LtdPlan = (typeof LTD_PLAN_DETAILS)[number] & {
  originalCents: number
  priceId: string
}
export type LtdPlanKey = LtdPlan['key']

/** The plans with the prices on sale at `now`. */
export function ltdPlansAt(now = Date.now()): LtdPlan[] {
  const prices = lifetimePrices(now)
  return LTD_PLAN_DETAILS.map(plan => ({
    ...plan,
    originalCents: prices[plan.key].cents,
    priceId: prices[plan.key].id,
  }))
}

export function getLtdPlan(key: unknown, now = Date.now()): LtdPlan | undefined {
  return ltdPlansAt(now).find(plan => plan.key === key)
}

export function isLtdOfferEligible(affiliateCode: unknown, now = Date.now()): boolean {
  return affiliateCode === LTD_OFFER.affiliateCode && now < Date.parse(LTD_OFFER.endsAt)
}

/** The percent taken off at `now`: the community's, else a running sale's, else 0. */
export function ltdDiscountPercent(affiliateCode: unknown, now = Date.now()): number {
  if (isLtdOfferEligible(affiliateCode, now)) return LTD_OFFER.discountPercent
  return lifetimeSale(now)?.percentOff ?? 0
}

export function ltdPriceCents(plan: LtdPlan, affiliateCode?: unknown, now = Date.now()): number {
  return Math.round(plan.originalCents * (100 - ltdDiscountPercent(affiliateCode, now)) / 100)
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2,
  }).format(cents / 100)
}

export function ltdLoginUrl(plan: LtdPlan, affiliateCode?: string): string {
  const params = new URLSearchParams({ plan: plan.key })
  if (affiliateCode) params.set('via', affiliateCode)
  return `/login?returnUrl=${encodeURIComponent(`${LTD_OFFER.path}?${params}`)}`
}
