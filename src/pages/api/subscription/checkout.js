import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import Stripe from 'stripe'

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ code: 405, message: 'Method not allowed' })
  }

  try {
    // Create authenticated Supabase client
    const supabase = createServerSupabaseClient({ req, res })
    
    // Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession()
    
    // Check if user is authenticated
    if (!session) {
      return res.status(401).json({ code: 401, message: 'Unauthorized' })
    }
    
    const { lookupKey, successUrl, cancelUrl } = req.body
    
    if (!lookupKey) {
      return res.status(400).json({ code: 400, message: 'Missing lookup key' })
    }
    
    // Get the user details from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', session.user.id)
      .single()
    
    if (userError) {
      console.error('Error fetching user data:', userError)
      return res.status(500).json({ code: 500, message: 'Error fetching user data' })
    }
    
    // Get or create Stripe customer
    let customerId = userData.stripe_customer_id
    
    if (!customerId) {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          supabase_id: session.user.id,
        },
      })
      
      customerId = customer.id
      
      // Update user with Stripe customer ID
      const { error: updateError } = await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', session.user.id)
      
      if (updateError) {
        console.error('Error updating user with Stripe customer ID:', updateError)
      }
    }
    
    // Get the price from Stripe using the lookup key
    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      expand: ['data.product'],
    })
    
    if (!prices.data.length) {
      return res.status(404).json({ code: 404, message: 'Price not found' })
    }
    
    // Create checkout session
    const session_data = {
      customer: customerId,
      line_items: [
        {
          price: prices.data[0].id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/account?success=cloud_points`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/cloud-points?canceled=true`,
      metadata: {
        user_id: session.user.id,
        product_type: 'cloud_points',
        lookup_key: lookupKey,
      },
    }
    
    const checkoutSession = await stripe.checkout.sessions.create(session_data)
    
    res.status(200).json({ code: 200, url: checkoutSession.url })
  } catch (error) {
    console.error('Checkout session error:', error)
    res.status(500).json({ code: 500, message: 'Internal server error', error: error.message })
  }
} 