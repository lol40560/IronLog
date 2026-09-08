import Stripe from 'npm:stripe@14.21.0';
import { secrets } from 'base44:runtime';

// Plan -> { priceId, mode }
// subscription mode = recurring (monthly / annual); payment mode = one-time (lifetime)
const PLANS = {
  monthly: { priceId: 'price_1TzqbSCmqihXuao9xD2jViJu', mode: 'subscription' },
  annual: { priceId: 'price_1TzqbSCmqihXuao9yycI9wzB', mode: 'subscription' },
  lifetime: { priceId: 'price_1TzqbSCmqihXuao9nDmzfeeo', mode: 'payment' },
};

export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId;
    if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

    const plan = PLANS[body.plan] ? body.plan : 'monthly';
    const { priceId, mode } = PLANS[plan];

    const stripe = new Stripe(secrets.get('STRIPE_SECRET_KEY'));
    const origin = body.origin || req.headers.get('origin') || 'https://app.base44app.com';

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/?upgrade=success`,
      cancel_url: `${origin}/?upgrade=cancelled`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_id: userId,
        email: body.email || '',
        plan,
      },
      ...(body.email ? { customer_email: body.email } : {}),
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('createCheckout error', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}