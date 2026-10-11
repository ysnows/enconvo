// What GET /api/account/plan answers: the Worker's entitlements
// (`/api/points_usage/balance?v=2`, docs/adr/0012) as the Enconvo app's
// Account settings read them, with the balance and active device count.

export type Entitlements = {
  license: {
    // `teams` when a Seat is the account's license in effect (ADR 0112).
    tier: 'none' | 'standard' | 'premium' | 'teams'
    since: string | null
    /** Seats this account owns as Team admin, 0 when it isn't one. */
    seats: number
  }
  /**
   * Teams (ADR 0112): `seats` > 0 marks a Team admin; `holdsSeat` is whether
   * the account holds a Seat, and `admin` the Team admin whose Seat it holds
   * (its own email for an admin holding the first Seat, null for a v1 license).
   * Missing from Worker deploys before ADR 0112.
   */
  team?: { seats: number; holdsSeat: boolean; admin: string | null }
  cloud: {
    plan: 'none' | 'monthly' | 'yearly'
    tier: 'none' | 'plus' | 'pro' | 'max'
    endTime: string | null
    active: boolean
    cancelAtPeriodEnd: boolean
  }
  deviceLimit: number
}

export type AccountPlan = {
  total: number
  /** Null for an account without a subscription row: it's free. */
  entitlements: Entitlements | null
  /** Active devices, or null when the list couldn't be read. */
  devicesUsed: number | null
}

export const FREE_ENTITLEMENTS: Entitlements = {
  license: { tier: 'none', since: null, seats: 0 },
  team: { seats: 0, holdsSeat: false, admin: null },
  cloud: {
    plan: 'none',
    tier: 'none',
    endTime: null,
    active: false,
    cancelAtPeriodEnd: false,
  },
  deviceLimit: 1,
}

/** The Seats this account manages as Team admin, or 0 (ADR 0112). */
export function teamAdminSeats(ent: Entitlements): number {
  return Math.max(ent.team?.seats ?? ent.license.seats ?? 0, 0)
}

/**
 * The Team admin who manages this account's Seat when that is someone else,
 * otherwise null: a Team admin holding their own Seat manages it themselves.
 */
export function seatManagedBy(
  ent: Entitlements,
  email: string | null | undefined
): string | null {
  const admin = ent.team?.holdsSeat ? ent.team.admin : null
  if (!admin || !email) return null
  return admin.toLowerCase() === email.toLowerCase() ? null : admin
}
