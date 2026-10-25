import { getLocale, localizePath } from '@/i18n/locale'
import Stripe from 'stripe'
import { withAuth } from '@/utils/auth'
import {
  affiliateJourneyFrom,
  affiliateMetadata,
  affiliatePromotionCode,
  reportAffiliateCheckout,
} from '@/lib/affiliate-journey'
import {
  campaignJourneyFrom,
  campaignMetadata,
  reportCampaignCheckout,
} from '@/lib/campaign-journey'
import {
  affiliateDiscountQuote,
  checkoutDiscount,
  isInvalidRequest,
} from '@/lib/affiliate-discount'
import { checkoutPriceId } from '@/lib/stripe-prices'
import { checkoutRenewalTerms } from '@/lib/renewal-terms'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const TEAMS_MIN_SEATS = 5
const TEAMS_MAX_SEATS = 500

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
    return
  }

  const { lookupKey, seats, quantity } = req.body
  const email = req.user.email

  let mode: 'payment' | 'subscription' = 'payment'
  if (
    [
      'monthly',
      'yearly',
      'pro_monthly',
      'pro_yearly',
      'max_monthly',
      'max_yearly',
    ].includes(lookupKey)
  ) {
    mode = 'subscription'
  }

  const isTopUpPoints =
    lookupKey === '250000_points' ||
    lookupKey === '1500000_points' ||
    lookupKey === '3000000_points'

  const from = isTopUpPoints ? 'points_top_up' : 'subscription'
  // The success page shows Team admins where to assign their Seats (ADR 0112).
  const planParam =
    lookupKey === 'teams' || lookupKey === 'teams_seat' ? '&plan=teams' : ''

  try {
    // Create Checkout Sessions from body params. Lifetime prices follow their schedule.
    const now = Date.now()
    const priceId = checkoutPriceId(lookupKey, now)
    if (!priceId) {
      res
        .status(400)
        .json({ statusCode: 400, message: `Unknown plan: ${lookupKey}` })
      return
    }

    let line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: priceId, quantity: 1 },
    ]
    if (lookupKey === 'teams') {
      // `seats` is the TOTAL seat count; the base price includes the first 5.
      const totalSeats = Math.floor(Number(seats) || TEAMS_MIN_SEATS)
      if (totalSeats < TEAMS_MIN_SEATS || totalSeats > TEAMS_MAX_SEATS) {
        res
          .status(400)
          .json({
            statusCode: 400,
            message: `Teams seats must be between ${TEAMS_MIN_SEATS} and ${TEAMS_MAX_SEATS}`,
          })
        return
      }
      const extraSeats = totalSeats - TEAMS_MIN_SEATS
      if (extraSeats > 0) {
        line_items.push({
          price: checkoutPriceId('teams_seat', now),
          quantity: extraSeats,
        })
      }
    } else if (lookupKey === 'teams_seat') {
      // Add-on-only purchase: `quantity` extra seats for an existing Teams license.
      const qty = Math.floor(Number(quantity) || 0)
      if (qty < 1 || qty > TEAMS_MAX_SEATS) {
        res
          .status(400)
          .json({ statusCode: 400, message: 'quantity must be at least 1' })
        return
      }
      line_items = [{ price: priceId, quantity: qty }]
    }

    const journey = affiliateJourneyFrom(req.cookies)
    const campaignVisitor = campaignJourneyFrom(req.cookies)

    // Create a checkout session with Stripe
    // For one-time payments, we enable invoice creation to ensure customers receive an invoice
    const session_data: Stripe.Checkout.SessionCreateParams = {
      line_items,
      mode: mode,
      success_url: `${req.headers.origin}${localizePath(
        '/pay_success',
        getLocale(req.body.locale)
      )}?success=true&session_id={CHECKOUT_SESSION_ID}&from=${from}${planParam}`,
      cancel_url: `${req.headers.origin}${localizePath(
        '/pay_success',
        getLocale(req.body.locale)
      )}?canceled=true&from=${from}`,
      automatic_tax: { enabled: true },
      client_reference_id: email,
      customer_email: email,
      // Send invoice for one-time payments (when mode is 'payment')
      invoice_creation: mode === 'payment' ? { enabled: true } : undefined,
      metadata: {
        ...affiliateMetadata(journey),
        ...campaignMetadata(campaignVisitor),
      },
    }

    // A subscription's Subscribe button carries its renewal terms, read from its price while
    // the Affiliate's code is checked.
    const renewalTerms =
      mode === 'subscription'
        ? checkoutRenewalTerms(stripe, line_items)
        : Promise.resolve(null)

    // A visitor an Affiliate's link brought gets that Affiliate's promotion code applied, and
    // a lifetime license gets a running sale's coupon when that takes more off; everyone else
    // can type a code. Stripe takes one or the other, never both.
    const affiliate = await affiliateDiscountQuote(
      stripe,
      await affiliatePromotionCode(req.accessToken, journey),
      line_items,
      now
    )
    const terms = await renewalTerms
    if (terms) session_data.custom_text = { submit: { message: terms } }
    const discounts = checkoutDiscount(lookupKey, line_items, affiliate, now)
    let session: Stripe.Checkout.Session
    try {
      session = await stripe.checkout.sessions.create(
        discounts
          ? { ...session_data, discounts }
          : { ...session_data, allow_promotion_codes: true }
      )
    } catch (err) {
      if (!discounts || !isInvalidRequest(err)) throw err
      console.warn('Checkout discount refused:', err.message)
      session = await stripe.checkout.sessions.create({
        ...session_data,
        allow_promotion_codes: true,
      })
    }
    // Both journeys record the Checkout step side by side, so neither slows the other.
    await Promise.all([
      reportAffiliateCheckout(req.accessToken, journey, session.id, lookupKey),
      reportCampaignCheckout(
        req.accessToken,
        campaignVisitor,
        session.id,
        lookupKey
      ),
    ])

    res.json({ url: session.url })
    res.end()
  } catch (err) {
    console.error('Stripe error:', err)
    res.status(500).json({ statusCode: 500, message: err.message })
  }
}

export default withAuth(handler)
