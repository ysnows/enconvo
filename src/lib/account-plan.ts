// What GET /api/account/plan answers: the Worker's entitlements
// (`/api/points_usage/balance?v=2`, docs/adr/0012) as the Enconvo app's
// Account settings read them, with the balance and active device count.

export type Entitlements = {
  license: {
    tier: 'none' | 'standard' | 'premium' | 'teams'
    since: string | null
    seats: number
  }
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
  cloud: {
    plan: 'none',
    tier: 'none',
    endTime: null,
    active: false,
    cancelAtPeriodEnd: false,
  },
  deviceLimit: 1,
}
