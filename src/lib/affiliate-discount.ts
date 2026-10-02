import type Stripe from 'stripe'

// An Affiliate's promotion code, applied for the visitor its link brought (ADR 0090): the
// Worker names the code of the Affiliate behind the visitor's latest recorded visit, and the
// Checkout opens with it applied, as if the visitor had typed it. Stripe can't show the code
// box next to an applied code, so a code that wouldn't take (inactive, used up, for other
// products, above the order's minimum) is left out and the visitor gets the box instead.

type PaymentClient = Pick<Stripe, 'prices' | 'promotionCodes'>

/** The Checkout discount for the Affiliate's `code`, or null to keep the promotion code box. */
export async function affiliateDiscounts(
    stripe: PaymentClient,
    code: string | null,
    lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
    now = Date.now()
): Promise<Stripe.Checkout.SessionCreateParams.Discount[] | null> {
    if (!code) return null
    try {
        const {
            data: [promotion],
        } = await stripe.promotionCodes.list({ code, active: true, limit: 1, expand: ['data.coupon.applies_to'] })
        const coupon = promotion?.coupon
        if (!promotion || !coupon?.valid || promotion.customer) return null
        if (promotion.expires_at && promotion.expires_at * 1000 <= now) return null
        if (promotion.max_redemptions && promotion.times_redeemed >= promotion.max_redemptions) return null

        // The plan is the first line item; Teams seats ride along on the second.
        const prices = await Promise.all(lineItems.map((item) => stripe.prices.retrieve(item.price as string)))
        const plan = prices[0]
        const product = typeof plan?.product === 'string' ? plan.product : plan?.product?.id
        if (!plan || (coupon.applies_to && !coupon.applies_to.products.includes(product))) return null
        if (coupon.amount_off && coupon.currency !== plan.currency) return null
        const { minimum_amount, minimum_amount_currency } = promotion.restrictions
        if (minimum_amount) {
            const subtotal = prices.reduce((sum, price, i) => sum + (price.unit_amount ?? 0) * (lineItems[i].quantity ?? 1), 0)
            if (minimum_amount_currency !== plan.currency || subtotal < minimum_amount) return null
        }
        return [{ promotion_code: promotion.id }]
    } catch (error) {
        console.warn('Affiliate promotion code left out:', (error as Error).message)
        return null
    }
}

/** True for Stripe refusing a Checkout's parameters, which a Checkout without the discount may not hit. */
export function isInvalidRequest(error: unknown): boolean {
    return (error as { type?: string })?.type === 'StripeInvalidRequestError'
}
