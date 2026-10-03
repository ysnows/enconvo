export const LTD_OFFER = {
  path: '/ltd',
  discountPercent: 40,
  // Both live in Stripe: the coupon (40% once, license products only) and the
  // promotion code applied at checkout. Checkout refuses a coupon whose percent
  // differs, so a new discount level needs a new coupon and code.
  couponId: 'KENMOO2026',
  promotionCode: 'KENMOO2026',
  affiliateCode: 'kenmoo',
  communityUrl: 'https://www.facebook.com/groups/softwarelifetimedealsappsumosaasltdkenmoo',
  communityIcon: '/ltd/kenmoo.png',
} as const

export const ltdPlans = [
  {
    key: 'standard',
    name: 'Standard',
    description: 'Your everyday Mac assistant.',
    originalCents: 4900,
    priceId: 'price_1QVP9VP5mwiRKlICCifMKEDK',
    devices: '1 Mac device',
    deviceCount: 1,
    updates: '1 year of free updates',
    bonusPoints: '50,000 Cloud points',
  },
  {
    key: 'premium',
    name: 'Premium',
    description: 'For all your Macs, with lifetime updates.',
    originalCents: 9900,
    priceId: 'price_1QVPBWP5mwiRKlICa2MFNaR7',
    devices: '3 Mac devices',
    deviceCount: 3,
    updates: 'Lifetime free updates',
    bonusPoints: '150,000 Cloud points',
  },
  {
    key: 'teams',
    name: 'Teams',
    description: 'Five Macs sharing one account.',
    originalCents: 13900,
    priceId: 'price_1Tu3LuP5mwiRKlICy3h6oU6y',
    devices: '5 Mac devices on one account',
    deviceCount: 5,
    updates: 'Lifetime free updates',
    bonusPoints: '250,000 Cloud points',
  },
] as const

export type LtdPlan = (typeof ltdPlans)[number]
export type LtdPlanKey = LtdPlan['key']

export function getLtdPlan(key: unknown): LtdPlan | undefined {
  return ltdPlans.find(plan => plan.key === key)
}

export function isLtdOfferEligible(affiliateCode: unknown): boolean {
  return affiliateCode === LTD_OFFER.affiliateCode
}

export function ltdPriceCents(plan: LtdPlan, affiliateCode?: unknown): number {
  const discount = isLtdOfferEligible(affiliateCode) ? LTD_OFFER.discountPercent : 0
  return Math.round(plan.originalCents * (100 - discount) / 100)
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
