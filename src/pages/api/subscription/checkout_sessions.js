import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  'standard': 'price_1PUW7FP5mwiRKlICsPPMLgB4',
  'premium': 'price_1PUW8sP5mwiRKlICu3jOnFRR',

  'monthly': 'price_1PU2qFP5mwiRKlICLgcGWQXD',
  'yearly': 'price_1PU2qFP5mwiRKlICvOCDQOLw',
};

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const { lookupKey } = req.body;

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
      mode: 'payment',
      success_url: `${req.headers.origin}/pay_success?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pay_success?canceled=true`,
      automatic_tax: { enabled: true },
      allow_promotion_codes: true
    });

    res.json({ url: session.url });
    res.end();
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ statusCode: 500, message: err.message });
  }
}