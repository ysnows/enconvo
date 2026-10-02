import Stripe from 'stripe'
import type { NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '@/utils/auth'
import { isLtdOfferEligible, LTD_OFFER } from '@/data/ltdOffer'
import { ltdCheckoutParams, LtdCheckoutError } from '@/lib/ltd-checkout'
import { affiliateJourneyFrom, affiliateMetadata, reportAffiliateCheckout } from '@/lib/affiliate-journey'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const discount = await ltdCheckoutParams(stripe, req.body)
    const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.enconvo.com')
    // Local previews can return to their own origin. Production redirects are
    // fixed to the website and never come from a client-provided return URL.
    if (process.env.NODE_ENV !== 'production' && req.headers.origin) {
      const candidate = new URL(req.headers.origin)
      if (['localhost', '127.0.0.1'].includes(candidate.hostname)) origin.href = candidate.href
    }
    const referral = typeof req.body.endorsely_referral === 'string'
      ? req.body.endorsely_referral.slice(0, 200) : undefined
    const cancelParams = new URLSearchParams({ canceled: 'true', plan: req.body.lookupKey })
    if (typeof req.body.via === 'string' && req.body.via) cancelParams.set('via', req.body.via.slice(0, 200))
    if (referral) cancelParams.set('referral', referral)
    const journey = affiliateJourneyFrom(req.cookies)
    const session = await stripe.checkout.sessions.create({
      ...discount,
      mode: 'payment',
      success_url: `${origin.origin}/pay_success?success=true&session_id={CHECKOUT_SESSION_ID}&from=subscription`,
      cancel_url: `${origin.origin}${LTD_OFFER.path}?${cancelParams}`,
      automatic_tax: { enabled: true },
      client_reference_id: req.user.email,
      customer_email: req.user.email,
      invoice_creation: { enabled: true },
      metadata: {
        campaign: isLtdOfferEligible(req.body.via) ? LTD_OFFER.couponId : 'enconvo-ltd',
        ...(referral ? { endorsely_referral: referral } : {}),
        ...affiliateMetadata(journey),
      },
    })
    if (!session.url) throw new LtdCheckoutError('Checkout is temporarily unavailable. Please try again.')
    await reportAffiliateCheckout(req.accessToken, journey, session.id, req.body.lookupKey)
    return res.status(200).json({ url: session.url })
  } catch (error) {
    if (error instanceof LtdCheckoutError) {
      return res.status(error.statusCode).json({ error: error.message })
    }
    return res.status(503).json({ error: 'Checkout is temporarily unavailable. Please try again.' })
  }
}

export default withAuth(handler)
