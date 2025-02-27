import Stripe from 'stripe';
import * as jose from 'jose';
import { withAuth } from '@/utils/auth';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  'standard': 'price_1QVP9VP5mwiRKlICCifMKEDK',
  'premium': 'price_1QVPBWP5mwiRKlICa2MFNaR7',

  'monthly': 'price_1PUnZ5P5mwiRKlICwO3oKaJZ',
  'yearly': 'price_1PUnbcP5mwiRKlICBAdbINOS',
  '250000_points': 'price_1Qx9GDP5mwiRKlICDn53Og5c',
  '1500000_points': 'price_1Qx9NTP5mwiRKlIC8vIK1Ym1',
  '3000000_points': 'price_1Qx9QYP5mwiRKlICzdVj9Nx3',
};

async function handler(req, res) {

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const { lookupKey, endorsely_referral } = req.body;
  console.log("endorsely_referral", endorsely_referral, lookupKey)
  const email = req.user.email

  let mode = 'payment';
  if (lookupKey === 'standard' || lookupKey === 'premium') {
    mode = 'payment';
  } else if (lookupKey === 'monthly' || lookupKey === 'yearly') {
    mode = 'subscription';
  }

  const isTopUpPoints = lookupKey === '250000_points' || lookupKey === '1500000_points' || lookupKey === '3000000_points';

  const from = isTopUpPoints ? 'points_top_up' : 'subscription';


  try {
    // Create Checkout Sessions from body params.
    const priceId = PRICE_IDS[lookupKey];
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: `${req.headers.origin}/pay_success?success=true&session_id={CHECKOUT_SESSION_ID}&from=${from}`,
      cancel_url: `${req.headers.origin}/pay_success?canceled=true&from=${from}`,
      automatic_tax: { enabled: true },
      allow_promotion_codes: true,
      client_reference_id: email,
      customer_email: email,
      metadata: {
        endorsely_referral: endorsely_referral
      }
    });

    res.json({ url: session.url });
    res.end();
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ statusCode: 500, message: err.message });
  }
}

export default withAuth(handler);