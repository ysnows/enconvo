import type Stripe from 'stripe'
import { getLtdPlan, isLtdOfferEligible, LTD_OFFER } from '../data/ltdOffer'

export class LtdCheckoutError extends Error {
  constructor(message: string, public statusCode = 503) {
    super(message)
    this.name = 'LtdCheckoutError'
  }
}

type PaymentClient = Pick<Stripe, 'prices' | 'coupons'>

/** Preserve existing price IDs so the current webhook grants the same license. */
export async function ltdCheckoutParams(
  stripe: PaymentClient,
  input: { lookupKey?: unknown; seats?: unknown; quantity?: unknown; via?: unknown },
): Promise<Pick<Stripe.Checkout.SessionCreateParams, 'line_items' | 'discounts'>> {
  const plan = getLtdPlan(input?.lookupKey)
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
  // Attribution alone does not grant this community's discount. The purchase
  // must carry the same explicit KenMoo entry code as the displayed offer.
  if (!isLtdOfferEligible(input.via)) return { line_items }

  let coupon: Stripe.Coupon
  try {
    coupon = await stripe.coupons.retrieve(LTD_OFFER.couponId)
  } catch (error) {
    if ((error as { code?: string }).code !== 'resource_missing') throw error
    try {
      coupon = await stripe.coupons.create({
        id: LTD_OFFER.couponId,
        name: `Enconvo LTD ${LTD_OFFER.discountPercent}% off`,
        percent_off: LTD_OFFER.discountPercent,
        duration: 'once',
      }, { idempotencyKey: `${LTD_OFFER.couponId}-create` })
    } catch (creationError) {
      // Two checkouts can create the same coupon concurrently. Retrieve only
      // when Stripe reports that the stable ID already exists.
      if ((creationError as { code?: string }).code !== 'resource_already_exists') throw creationError
      coupon = await stripe.coupons.retrieve(LTD_OFFER.couponId)
    }
  }

  const productId = typeof price.product === 'string' ? price.product : price.product.id
  if (!coupon.valid || coupon.percent_off !== LTD_OFFER.discountPercent ||
      coupon.duration !== 'once' ||
      (coupon.applies_to && !coupon.applies_to.products.includes(productId))) {
    throw new LtdCheckoutError('This offer is temporarily unavailable. No payment has been started.')
  }

  return {
    line_items,
    discounts: [{ coupon: coupon.id }],
  }
}
