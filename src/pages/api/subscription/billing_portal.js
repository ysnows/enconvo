import Stripe from 'stripe';
import { withAuth } from '@/utils/auth';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


async function handler(req, res) {

  try {
    // 通过email获取customer_id
    const customer = await stripe.customers.list({
      email: req.user.email,
    });
    console.log(customer);

    // Create Checkout Sessions from body params.
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.data[0].id,
      return_url: `${req.headers.origin || 'https://enconvo.com'}/account`,
    });

    res.json({ url: session.url });
    res.end();
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ statusCode: 500, message: err.message });
  }
}

export default withAuth(handler);