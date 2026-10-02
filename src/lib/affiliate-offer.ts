// What a Checkout through an Affiliate's link gets applied (ADR 0090), as the pricing section
// says it: the server works it out from Stripe (`affiliateOffer`), the page words it.

export interface AffiliateOffer {
    /** The code as Stripe spells it, such as `KENMOO2026`. */
    code: string
    percentOff: number | null
    /** In USD cents. */
    amountOff: number | null
    /** For Cloud plans: Stripe's `once`, `repeating` (for `months`) or `forever`. */
    duration: 'once' | 'repeating' | 'forever'
    months: number | null
    /** The plans it covers, in the pricing section's order; every plan when `allPlans`. */
    plans: string[]
    allPlans: boolean
    /** Whether it covers a Cloud plan, whose renewals `duration` limits. */
    cloud: boolean
    /** The order minimum in USD cents. */
    minimum: number | null
}

function money(cents: number) {
    return `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`
}

function list(items: string[]) {
    return items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0]
}

/** The pricing section's sentence for `offer`, such as "40% off Standard, Premium and Teams." after the code. */
export function offerTerms(offer: AffiliateOffer): string {
    const discount = offer.percentOff ? `${offer.percentOff}% off` : money(offer.amountOff ?? 0) + ' off'
    let terms = `${discount} ${offer.allPlans ? 'any plan' : list(offer.plans)}.`
    if (offer.cloud && offer.duration === 'once') terms += ' On a Cloud plan, it covers the first payment.'
    if (offer.cloud && offer.duration === 'repeating' && offer.months)
        terms += ` On a Cloud plan, it covers the first ${offer.months === 1 ? 'month' : `${offer.months} months`}.`
    if (offer.minimum) terms += ` For orders of ${money(offer.minimum)} or more.`
    return terms
}
