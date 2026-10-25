import type Stripe from 'stripe'

// The auto-renewal terms a subscription Checkout shows beside its Subscribe button
// (`custom_text.submit`), written from the Stripe price itself so the amount and the period
// can't drift from what is charged. Cancelling runs through the billing portal (Manage
// billing), whose default configuration cancels at the end of the paid period. Mirrors the
// Worker's src/billing/renewalTerms.ts, which does the same for Checkouts the app opens.

/** Stripe's limit for `custom_text.submit.message`. */
export const RENEWAL_TERMS_MAX_LENGTH = 1200

// Currencies Stripe counts in whole units rather than cents.
const ZERO_DECIMAL = new Set([
  'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf',
])

export type RecurringPrice = Pick<Stripe.Price, 'unit_amount' | 'currency' | 'recurring'>

/** `minor` units of `currency` as the price shows on an invoice, e.g. `$96.00`. */
export function formatPriceAmount(minor: number, currency: string): string {
  const code = currency.toLowerCase()
  const value = ZERO_DECIMAL.has(code) ? minor : minor / 100
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: code.toUpperCase() }).format(value)
}

/** The renewal terms for `quantity` of a recurring `price`, or null for a price that doesn't recur. */
export function renewalTerms(price: RecurringPrice, quantity = 1): string | null {
  const { recurring, unit_amount, currency } = price
  if (!recurring || unit_amount == null || !currency) return null
  const count = recurring.interval_count || 1
  const period = count === 1 ? recurring.interval : `${count} ${recurring.interval}s`
  const amount = formatPriceAmount(unit_amount * Math.max(1, quantity), currency)
  return (
    `Renews automatically every ${period} at ${amount} plus applicable tax until you cancel. ` +
    'A discount lasts only as long as its terms state. ' +
    'Cancel anytime in Manage billing (Settings → Account in the Enconvo app, or your account page on enconvo.com); ' +
    "your plan stays active until the end of the period you've paid for."
  )
}

/** The renewal terms for a subscription Checkout's first line item, or null when its price can't be read. Never throws. */
export async function checkoutRenewalTerms(
  stripe: Pick<Stripe, 'prices'>,
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[]
): Promise<string | null> {
  const [item] = lineItems
  if (!item?.price) return null
  try {
    return renewalTerms(await stripe.prices.retrieve(item.price), item.quantity ?? 1)
  } catch (error) {
    console.warn('Checkout renewal terms left out:', (error as Error).message)
    return null
  }
}
