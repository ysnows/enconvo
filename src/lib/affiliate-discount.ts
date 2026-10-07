import type Stripe from 'stripe'
import type { AffiliateOffer } from './affiliate-offer'
import { isLifetimeKey, lifetimeSale, lifetimeSubtotal } from './lifetime-pricing'
import { checkoutPriceId } from './stripe-prices'

// An Affiliate's promotion code, applied for the visitor its link brought (ADR 0090): the
// Worker names the code of the Affiliate behind the visitor's latest recorded visit, and the
// Checkout opens with it applied, as if the visitor had typed it. Stripe can't show the code
// box next to an applied code, so a code that wouldn't take (inactive, used up, for other
// products, above the order's minimum) is left out and the visitor gets the box instead.
// The pricing section says so beforehand (`affiliateOffer`), from the same checks.

type PaymentClient = Pick<Stripe, 'prices' | 'promotionCodes'>

/** The active promotion code `code`, with its coupon's products, if a Checkout could take it now; else null. */
export async function usablePromotion(stripe: PaymentClient, code: string, now = Date.now()): Promise<Stripe.PromotionCode | null> {
    const {
        data: [promotion],
    } = await stripe.promotionCodes.list({ code, active: true, limit: 1, expand: ['data.coupon.applies_to'] })
    const coupon = promotion?.coupon
    if (!promotion || !coupon?.valid || promotion.customer) return null
    if (promotion.expires_at && promotion.expires_at * 1000 <= now) return null
    if (promotion.max_redemptions && promotion.times_redeemed >= promotion.max_redemptions) return null
    return promotion
}

type Discounts = Stripe.Checkout.SessionCreateParams.Discount[]

/** An Affiliate's Checkout discount, with how much it takes off the order, in cents. */
export interface AffiliateDiscountQuote {
    discounts: Discounts
    off: number
}

/** The Checkout discount for the Affiliate's `code`, or null to keep the promotion code box. */
export async function affiliateDiscountQuote(
    stripe: PaymentClient,
    code: string | null,
    lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
    now = Date.now()
): Promise<AffiliateDiscountQuote | null> {
    if (!code) return null
    try {
        const promotion = await usablePromotion(stripe, code, now)
        if (!promotion) return null
        const { coupon } = promotion

        // The plan is the first line item; Teams seats ride along on the second.
        const prices = await Promise.all(lineItems.map((item) => stripe.prices.retrieve(item.price as string)))
        const plan = prices[0]
        const productOf = (price?: Stripe.Price) => (typeof price?.product === 'string' ? price.product : price?.product?.id)
        const product = productOf(plan)
        if (!plan || (coupon.applies_to && !coupon.applies_to.products.includes(product))) return null
        if (coupon.amount_off && coupon.currency !== plan.currency) return null
        const lineTotal = (price: Stripe.Price, i: number) => (price.unit_amount ?? 0) * (lineItems[i].quantity ?? 1)
        const { minimum_amount, minimum_amount_currency } = promotion.restrictions
        if (minimum_amount) {
            const subtotal = prices.reduce((sum, price, i) => sum + lineTotal(price, i), 0)
            if (minimum_amount_currency !== plan.currency || subtotal < minimum_amount) return null
        }
        const eligible = prices.reduce(
            (sum, price, i) =>
                !coupon.applies_to || coupon.applies_to.products.includes(productOf(price) ?? '') ? sum + lineTotal(price, i) : sum,
            0
        )
        const off = coupon.percent_off ? Math.round((eligible * coupon.percent_off) / 100) : Math.min(coupon.amount_off ?? 0, eligible)
        return { discounts: [{ promotion_code: promotion.id }], off }
    } catch (error) {
        console.warn('Affiliate promotion code left out:', (error as Error).message)
        return null
    }
}

/**
 * The discount a Checkout opens with, or null to keep the code box. During a lifetime sale
 * (lifetime-pricing.ts) a lifetime license gets the sale's coupon, unless the Affiliate's code
 * takes at least as much off: KENMOO2026's 40% stays the lowest price.
 */
export function checkoutDiscount(
    lookupKey: string,
    lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
    affiliate: AffiliateDiscountQuote | null,
    now = Date.now()
): Discounts | null {
    const sale = isLifetimeKey(lookupKey) ? lifetimeSale(now) : null
    if (!sale) return affiliate?.discounts ?? null
    const saleOff = Math.round((lifetimeSubtotal(lineItems) * sale.percentOff) / 100)
    return affiliate && affiliate.off >= saleOff ? affiliate.discounts : [{ coupon: sale.coupon }]
}

/** True for Stripe refusing a Checkout's parameters, which a Checkout without the discount may not hit. */
export function isInvalidRequest(error: unknown): boolean {
    return (error as { type?: string })?.type === 'StripeInvalidRequestError'
}

// The pricing section's plans, in its order, by the lookup keys their buttons send.
const OFFER_PLANS = [
    { label: 'Standard', keys: ['standard'], cloud: false },
    { label: 'Premium', keys: ['premium'], cloud: false },
    { label: 'Teams', keys: ['teams'], cloud: false },
    { label: 'Plus', keys: ['monthly', 'yearly'], cloud: true },
    { label: 'Pro', keys: ['pro_monthly', 'pro_yearly'], cloud: true },
    { label: 'Max', keys: ['max_monthly', 'max_yearly'], cloud: true },
]

// A price never moves to another product, so each is looked up once per server.
const productOfPrice = new Map<string, Promise<string>>()

function productOf(stripe: PaymentClient, price: string): Promise<string> {
    let product = productOfPrice.get(price)
    if (!product) {
        product = stripe.prices.retrieve(price).then((found) => (typeof found.product === 'string' ? found.product : found.product.id))
        product.catch(() => productOfPrice.delete(price))
        productOfPrice.set(price, product)
    }
    return product
}

/**
 * The offer behind the Affiliate promotion code `code`, if a Checkout could take it now and it
 * covers a plan of the pricing section (all of a plan's prices), in USD; else null. Stripe errors
 * are thrown, for the caller to show nothing.
 */
export async function affiliateOffer(stripe: PaymentClient, code: string, now = Date.now()): Promise<AffiliateOffer | null> {
    const promotion = await usablePromotion(stripe, code, now)
    if (!promotion) return null
    const { coupon, restrictions } = promotion
    if ((coupon.amount_off && coupon.currency !== 'usd') || (restrictions.minimum_amount && restrictions.minimum_amount_currency !== 'usd'))
        return null
    const covered = coupon.applies_to ? new Set(coupon.applies_to.products) : null
    let plans = OFFER_PLANS
    if (covered) {
        const coverage = await Promise.all(
            OFFER_PLANS.map(async (plan) =>
                (await Promise.all(plan.keys.map((key) => productOf(stripe, checkoutPriceId(key, now)!)))).every((product) =>
                    covered.has(product)
                )
            )
        )
        plans = OFFER_PLANS.filter((_, i) => coverage[i])
    }
    if (!plans.length) return null
    return {
        code: promotion.code,
        percentOff: coupon.percent_off ?? null,
        amountOff: coupon.amount_off ?? null,
        duration: coupon.duration,
        months: coupon.duration_in_months ?? null,
        plans: plans.map((plan) => plan.label),
        allPlans: !covered,
        cloud: plans.some((plan) => plan.cloud),
        minimum: restrictions.minimum_amount ?? null,
    }
}
