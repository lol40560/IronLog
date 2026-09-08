import Stripe from 'npm:stripe@14.21.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const stripe = new Stripe(secrets.get('STRIPE_SECRET_KEY'));
    const sig = req.headers.get('stripe-signature') || '';
    const rawBody = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      sig,
      secrets.get('STRIPE_WEBHOOK_SECRET')
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata && session.metadata.user_id;
      if (userId) {
        await base44.asServiceRole.entities.User.update(userId, { subscription_tier: 'pro' });
      }
    }
    return Response.json({ received: true });
  } catch (error) {
    console.error('stripe-webhook error', error.message);
    return Response.json({ error: error.message }, { status: 400 });
  }
}