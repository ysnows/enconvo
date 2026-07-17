import Stripe from 'stripe';
import { withAuth } from '@/utils/auth';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  'standard': 'price_1QVP9VP5mwiRKlICCifMKEDK',
  'premium': 'price_1QVPBWP5mwiRKlICa2MFNaR7',

  // Teams lifetime license (ADR 0036): base covers 5 seats; extra seats ride the
  // seat add-on price with quantity. `teams_seat` alone grows an existing license.
  'teams': 'price_1Tu3LuP5mwiRKlICy3h6oU6y',
  'teams_seat': 'price_1Tu2BSP5mwiRKlICmmKspOSI',

  'monthly': 'price_1PUnZ5P5mwiRKlICwO3oKaJZ',
  'yearly': 'price_1PUnbcP5mwiRKlICBAdbINOS',
  // Cloud tiers Pro/Max (ADR 0034)
  'pro_monthly': 'price_1TtzpnP5mwiRKlICF1zwDrRO',
  'pro_yearly': 'price_1TtzpxP5mwiRKlIC2O3cX0rd',
  'max_monthly': 'price_1TtzqDP5mwiRKlICEj5Nkmun',
  'max_yearly': 'price_1TtzqPP5mwiRKlIC3lNm6g81',
  '250000_points': 'price_1Qx9GDP5mwiRKlICDn53Og5c',
  '1500000_points': 'price_1Qx9NTP5mwiRKlIC8vIK1Ym1',
  '3000000_points': 'price_1Qx9QYP5mwiRKlICzdVj9Nx3',
};

const TEAMS_MIN_SEATS = 5;
const TEAMS_MAX_SEATS = 500;

async function handler(req, res) {

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const { lookupKey, endorsely_referral, seats, quantity } = req.body;
  console.log("endorsely_referral", endorsely_referral, lookupKey)
  const email = req.user.email

  let mode: 'payment' | 'subscription' = 'payment';
  if (['monthly', 'yearly', 'pro_monthly', 'pro_yearly', 'max_monthly', 'max_yearly'].includes(lookupKey)) {
    mode = 'subscription';
  }

  const isTopUpPoints = lookupKey === '250000_points' || lookupKey === '1500000_points' || lookupKey === '3000000_points';

  const from = isTopUpPoints ? 'points_top_up' : 'subscription';


  try {
    // Create Checkout Sessions from body params.
    const priceId = PRICE_IDS[lookupKey];
    if (!priceId) {
      res.status(400).json({ statusCode: 400, message: `Unknown plan: ${lookupKey}` });
      return;
    }

    let line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [{ price: priceId, quantity: 1 }];
    if (lookupKey === 'teams') {
      // `seats` is the TOTAL seat count; the base price includes the first 5.
      const totalSeats = Math.floor(Number(seats) || TEAMS_MIN_SEATS);
      if (totalSeats < TEAMS_MIN_SEATS || totalSeats > TEAMS_MAX_SEATS) {
        res.status(400).json({ statusCode: 400, message: `Teams seats must be between ${TEAMS_MIN_SEATS} and ${TEAMS_MAX_SEATS}` });
        return;
      }
      const extraSeats = totalSeats - TEAMS_MIN_SEATS;
      if (extraSeats > 0) {
        line_items.push({ price: PRICE_IDS['teams_seat'], quantity: extraSeats });
      }
    } else if (lookupKey === 'teams_seat') {
      // Add-on-only purchase: `quantity` extra seats for an existing Teams license.
      const qty = Math.floor(Number(quantity) || 0);
      if (qty < 1 || qty > TEAMS_MAX_SEATS) {
        res.status(400).json({ statusCode: 400, message: 'quantity must be at least 1' });
        return;
      }
      line_items = [{ price: priceId, quantity: qty }];
    }

    // Create a checkout session with Stripe
    // For one-time payments, we enable invoice creation to ensure customers receive an invoice
    const session_data: Stripe.Checkout.SessionCreateParams = {
      line_items,
      mode: mode,
      success_url: `${req.headers.origin}/pay_success?success=true&session_id={CHECKOUT_SESSION_ID}&from=${from}`,
      cancel_url: `${req.headers.origin}/pay_success?canceled=true&from=${from}`,
      automatic_tax: { enabled: true },
      client_reference_id: email,
      customer_email: email,
      // Send invoice for one-time payments (when mode is 'payment')
      invoice_creation: mode === 'payment' ? { enabled: true } : undefined,
      metadata: {
        endorsely_referral: endorsely_referral
      }
    }

    session_data.allow_promotion_codes = true;

    const session = await stripe.checkout.sessions.create(session_data);

    res.json({ url: session.url });
    res.end();
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ statusCode: 500, message: err.message });
  }
}

export default withAuth(handler);
