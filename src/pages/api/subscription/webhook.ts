import { buffer } from 'micro';
import Cors from 'micro-cors';
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createSuperClient } from "@/utils/supabase/server";

// Stripe webhook secret
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const config = {
  api: {
    bodyParser: false,
  },
};


const cors = Cors({
  allowMethods: ['POST', 'HEAD'],
});

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).json({ error: 'No signature found' });
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      buf,
      sig,
      webhookSecret
    );


    let result;

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        console.log(`handled checkout.session.completed`);
        result = await handleCheckoutComplete(event);
        break;
      // Add other event types as needed
      default:
        console.log(`Unhandled event type: ${event.type}`);
        return res.status(200).json({ received: true });
    }

    return res.status(200).json({ received: true, result });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(400).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

export default cors(handler);


async function handleCheckoutComplete(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  // Retrieve line items
  const { line_items } = await stripe.checkout.sessions.retrieve(
    session.id,
    {
      expand: ["line_items"],
    }
  );

  if (!line_items?.data.length) {
    throw new Error('No line items found');
  }

  console.log(line_items.data);
  // Get the first line item and its price
  const lineItem = line_items.data[0];
  const price = lineItem.price;

  if (!price) {
    throw new Error('No price found for line item');
  }

  console.log("session.customer_details", session.customer_details);
  // Extract necessary information
  const email = session.customer_details?.email;

  if (!email) {
    throw new Error('No email found in session');
  }

  // Verify session status
  if (session.status !== 'complete') {
    throw new Error(`Invalid session status: ${session.status}`);
  }

  if (session.payment_status !== 'paid') {
    throw new Error(`Invalid payment status: ${session.payment_status}`);
  }

  // Determine subscription type
  let type = price.lookup_key as string;
  if (type === "test") {
    type = "yearly";
  }

  // Add subscription
  // return addSubscription(email, type, {
  //   event: {
  //     id: event.id,
  //     type: event.type,
  //     livemode: event.livemode,
  //   },
  //   line_items: line_items.data,
  // });
}



async function addSubscription(email: string, type: string = "premium", info: any) {
  const supabase = await createSuperClient();

  const { data, error } = await supabase
    .from("subscription")
    .select("*")
    .eq("email", email);
  if (error) throw error;

  // Set end time based on subscription type
  const endTime = new Date();
  let subscription = "vip";

  if (type === "monthly") {
    endTime.setMonth(endTime.getMonth() + 1);
    subscription = "subscription";
  } else if (type === "yearly") {
    endTime.setFullYear(endTime.getFullYear() + 1);
    subscription = "subscription";
  } else if (type === "standard" || type === "premium") {
    endTime.setFullYear(endTime.getFullYear() + 100);
  }

  // Update subscription in database
  const { error: upsertError } = await supabase
    .from("subscription")
    .upsert({
      email: email,
      client_id: "",
      end_time: endTime,
      subscription: subscription,
      type: type,
      log: info
    });
  if (upsertError) throw upsertError;

  // Call external API to update subscription
  try {
    const params = {
      "tinqun_wuvxi6_zUkwev": email,
      "wawkE2_tabpin_kevwog": subscription === "vip" ? type : "subscription",
    };
    const resp = await fetch("https://api.enconvo.com/zosrob_zoTqe0_fycsyx/getnym_5farzy_Cypvud", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(params)
    });

    if (!resp.ok) {
      console.error('External API error:', await resp.text());
    }
  } catch (error) {
    console.error('Error calling external API:', error);
  }

  return "Purchase successful";
}
