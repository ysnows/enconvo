import { getLocale, localizePath } from '@/i18n/locale'
import Stripe from 'stripe'
import { NextApiRequest, NextApiResponse } from 'next'
import { withAuth } from '@/utils/auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

interface AuthenticatedRequest extends NextApiRequest {
  user: {
    email: string
  }
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    // 通过email获取customer_id
    const email = req.user.email
    const customer = await stripe.customers.list({
      email: email,
    })
    // Nothing to manage for an account that never paid through Stripe
    // (a free account, or a license from a code).
    if (!customer.data.length) {
      return res
        .status(404)
        .json({ reason: 'no_customer', message: 'No billing records.' })
    }

    // Create Checkout Sessions from body params.
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.data[0].id,
      return_url: `${req.headers.origin || 'https://enconvo.com'}${localizePath(
        '/account',
        getLocale(req.body?.locale)
      )}`,
    })

    res.json({ url: session.url })
    res.end()
  } catch (err) {
    console.error('Stripe error:', err)
    const error = err as Error
    res.status(500).json({ statusCode: 500, message: error.message })
  }
}

export default withAuth(handler)
