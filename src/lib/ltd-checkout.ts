import type Stripe from 'stripe'
import { getLtdPlan, isLtdOfferEligible, LTD_OFFER } from '../data/ltdOffer'
import { lifetimeSale } from './lifetime-pricing'

export class LtdCheckoutError extends Error {
  constructor(message: string, public statusCode = 503) {
    super(message)
    this.name = 'LtdCheckoutError'
  }
}

type PaymentClient = Pick<Stripe, 'prices' | 'coupons' | 'promotionCodes'>

/**
 * The license prices on sale at `now` (lifetime-pricing.ts), whose ids the webhook grants by.
 * The KenMoo code takes its 40% until the offer ends; anyone else gets a running sale's coupon.
 */
export async function ltdCheckoutParams(
  stripe: PaymentClient,
  input: { lookupKey?: unknown; seats?: unknown; quantity?: unknown; via?: unknown },
  now = Date.now(),
): Promise<Pick<Stripe.Checkout.SessionCreateParams, 'line_items' | 'discounts'>> {
  const plan = getLtdPlan(input?.lookupKey, now)
  if (!plan || input.quantity !== undefined ||
      (input.seats !== undefined && input.seats !== 5) ||
      (plan.key !== 'teams' && input.seats !== undefined)) {
    throw new LtdCheckoutError('Choose a Standard, Premium, or five-device Teams license.', 400)
  }

  const price = await stripe.prices.retrieve(plan.priceId)
  if (!price.active || price.type !== 'one_time' || price.currency !== 'usd' ||
      price.unit_amount !== plan.originalCents) {
    throw new LtdCheckoutError('This offer is temporarily unavailable. No payment has been started.')
  }

  const line_items = [{ price: plan.priceId, quantity: 1 }]
  const productId = typeof price.product === 'string' ? price.product : price.product.id
  // Attribution alone does not grant this community's discount. The purchase
  // must carry the same explicit KenMoo entry code as the displayed offer.
  if (!isLtdOfferEligible(input.via, now)) {
    const sale = lifetimeSale(now)
    if (!sale) return { line_items }
    // A sale coupon that is gone or set up differently from the page's price stops the
    // checkout rather than charging a price the page didn't show.
    try {
      const coupon = await stripe.coupons.retrieve(sale.coupon, { expand: ['applies_to'] })
      if (coupon.valid && coupon.percent_off === sale.percentOff && coupon.applies_to?.products.includes(productId))
        return { line_items, discounts: [{ coupon: coupon.id }] }
    } catch (error) {
      if ((error as { code?: string }).code !== 'resource_missing') throw error
    }
    throw new LtdCheckoutError('This offer is temporarily unavailable. No payment has been started.')
  }

  // KENMOO2026 is set up in Stripe ahead of the campaign, never created here:
  // a coupon limited to the three license products, plus the promotion code
  // buyers see applied at checkout. Deactivating that code in Stripe ends the offer.
  let coupon: Stripe.Coupon
  try {
    coupon = await stripe.coupons.retrieve(LTD_OFFER.couponId, { expand: ['applies_to'] })
  } catch (error) {
    if ((error as { code?: string }).code !== 'resource_missing') throw error
    throw new LtdCheckoutError('This offer is temporarily unavailable. No payment has been started.')
  }

  if (!coupon.valid || coupon.percent_off !== LTD_OFFER.discountPercent ||
      coupon.duration !== 'once' || !coupon.applies_to?.products.includes(productId)) {
    throw new LtdCheckoutError('This offer is temporarily unavailable. No payment has been started.')
  }

  const { data: [promotionCode] } = await stripe.promotionCodes.list({
    code: LTD_OFFER.promotionCode, coupon: coupon.id, active: true, limit: 1,
  })
  if (!promotionCode ||
      (promotionCode.expires_at && promotionCode.expires_at * 1000 <= now) ||
      (promotionCode.max_redemptions && promotionCode.times_redeemed >= promotionCode.max_redemptions)) {
    throw new LtdCheckoutError('The KenMoo offer has ended. No payment has been started.', 410)
  }

  return {
    line_items,
    discounts: [{ promotion_code: promotionCode.id }],
  }
}
