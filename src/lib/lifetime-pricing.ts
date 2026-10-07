// Lifetime license prices on a schedule: each step's Stripe prices take over at its `from`
// instant with no deploy, and a sale's coupon applies itself between `from` and `until`.
// The ladder was set with the KenMoo community on 2026-10-06; its KENMOO2026 code (40% off)
// stays the lowest price, so a sale here stays below 40% and gives way to a larger
// Affiliate discount. Times are midnight in Los Angeles.
//
// Mirrors envonvo.api.workers/src/billing/lifetimePricing.ts, whose webhook resolves these
// prices' tiers by id (they carry no lookup keys), and the app's PlansDialog.

export type LifetimeKey = 'standard' | 'premium' | 'teams' | 'teams_seat'

export interface LifetimePrice {
  id: string
  cents: number
}

export interface LifetimeSale {
  coupon: string
  campaign: string
  /** The pricing cards' label, `{p0}` being the percent off. */
  badge: string
  percentOff: number
  from: string
  until: string
}

export const LIFETIME_PRICE_STEPS: {
  from: string
  prices: Record<LifetimeKey, LifetimePrice>
}[] = [
  {
    // The prices on sale when the ladder was set.
    from: '1970-01-01T00:00:00Z',
    prices: {
      standard: { id: 'price_1QVP9VP5mwiRKlICCifMKEDK', cents: 4900 },
      premium: { id: 'price_1QVPBWP5mwiRKlICa2MFNaR7', cents: 9900 },
      teams: { id: 'price_1Tu3LuP5mwiRKlICy3h6oU6y', cents: 13900 },
      teams_seat: { id: 'price_1Tu2BSP5mwiRKlICmmKspOSI', cents: 2000 },
    },
  },
  {
    from: '2026-11-01T00:00:00-07:00',
    prices: {
      standard: { id: 'price_1UNPkXP5mwiRKlICC5THTWr9', cents: 5900 },
      premium: { id: 'price_1UNPkZP5mwiRKlICl4eUzlkC', cents: 11900 },
      teams: { id: 'price_1UNPkbP5mwiRKlICLnmHjqVD', cents: 15900 },
      teams_seat: { id: 'price_1UNPkdP5mwiRKlICSFv8Kecb', cents: 2500 },
    },
  },
  {
    // KENMOO2026 expires at the same instant.
    from: '2026-12-08T00:00:00-08:00',
    prices: {
      standard: { id: 'price_1UNPkYP5mwiRKlICe3uvofoq', cents: 6900 },
      premium: { id: 'price_1UNPkaP5mwiRKlICEMO0dUXA', cents: 14900 },
      teams: { id: 'price_1UNPkcP5mwiRKlIC3SPKA0Vi', cents: 17900 },
      teams_seat: { id: 'price_1UNPkdP5mwiRKlIC1eSSmtnt', cents: 3500 },
    },
  },
]

// The coupon is limited to the lifetime products and stops redeeming at `until`.
export const LIFETIME_SALES: LifetimeSale[] = [
  {
    coupon: 'BLACKFRIDAY2026',
    campaign: 'black-friday-2026',
    badge: 'Black Friday −{p0}%',
    percentOff: 30,
    from: '2026-11-23T00:00:00-08:00',
    until: '2026-12-01T00:00:00-08:00',
  },
]

// A Teams license's base price covers this many seats (ADR 0036).
export const TEAMS_BASE_SEATS = 5

export function isLifetimeKey(key: unknown): key is LifetimeKey {
  return key === 'standard' || key === 'premium' || key === 'teams' || key === 'teams_seat'
}

/** The lifetime prices on sale at `now`. */
export function lifetimePrices(now = Date.now()): Record<LifetimeKey, LifetimePrice> {
  let current = LIFETIME_PRICE_STEPS[0]
  for (const step of LIFETIME_PRICE_STEPS) if (Date.parse(step.from) <= now) current = step
  return current.prices
}

/** The lifetime sale running at `now`, or null. */
export function lifetimeSale(now = Date.now()): LifetimeSale | null {
  return LIFETIME_SALES.find((sale) => Date.parse(sale.from) <= now && now < Date.parse(sale.until)) ?? null
}

/** A Teams license for `seats` seats at `now`, in cents, before any discount. */
export function teamsCents(seats: number, now = Date.now()): number {
  const { teams, teams_seat } = lifetimePrices(now)
  return teams.cents + Math.max(0, seats - TEAMS_BASE_SEATS) * teams_seat.cents
}

/** `cents` with the sale running at `now` taken off. */
export function saleCents(cents: number, now = Date.now()): number {
  const sale = lifetimeSale(now)
  return sale ? Math.round((cents * (100 - sale.percentOff)) / 100) : cents
}

/** What `lineItems` cost at their scheduled prices, in cents; lines off the schedule count as 0. */
export function lifetimeSubtotal(lineItems: { price?: string; quantity?: number }[]): number {
  const cents = new Map(
    LIFETIME_PRICE_STEPS.flatMap((step) => Object.values(step.prices).map((price) => [price.id, price.cents] as const))
  )
  return lineItems.reduce((sum, item) => sum + (cents.get(item.price ?? '') ?? 0) * (item.quantity ?? 1), 0)
}

/** Whole dollars without cents ($1,259), cents only when there are some ($41.30). */
export function usd(cents: number): string {
  const digits = cents % 100 ? 2 : 0
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
}
