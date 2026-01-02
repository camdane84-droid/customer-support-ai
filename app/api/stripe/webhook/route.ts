import { NextRequest, NextResponse } from 'next/server';
import { stripe, getTierForPriceId } from '@/lib/stripe/config';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import Stripe from 'stripe';
import { logger } from '@/lib/logger';

// Disable body parsing, need raw body for signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    logger.error('[Stripe Webhook] Signature verification failed', err);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  logger.info('[Stripe Webhook] Event received', { eventType: event.type });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        logger.debug('[Stripe Webhook] Unhandled event type', { eventType: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error('[Stripe Webhook] Error processing event', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  logger.info('[Stripe Webhook] Checkout session completed', { sessionId: session.id });

  const businessId = session.metadata?.businessId;
  const tier = session.metadata?.tier as 'starter' | 'pro' | undefined;

  if (!businessId) {
    logger.error('[Stripe Webhook] Missing businessId in session metadata');
    return;
  }

  // Get subscription details
  const subscriptionId = session.subscription as string;

  if (!subscriptionId) {
    logger.error('[Stripe Webhook] No subscription ID in session');
    return;
  }

  // Update business with subscription details
  const { error } = await supabaseAdmin
    .from('businesses')
    .update({
      subscription_tier: tier || 'starter',
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: session.customer as string,
    })
    .eq('id', businessId);

  if (error) {
    logger.error('[Stripe Webhook] Error updating business', error);
    throw error;
  }

  logger.success('[Stripe Webhook] Successfully updated business subscription', { businessId });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logger.info('[Stripe Webhook] Subscription updated', { subscriptionId: subscription.id });

  const businessId = subscription.metadata?.businessId;

  if (!businessId) {
    logger.error('[Stripe Webhook] Missing businessId in subscription metadata');
    return;
  }

  // Determine tier from subscription items
  let tier: 'free' | 'starter' | 'pro' = 'free';

  if (subscription.items.data.length > 0) {
    const priceId = subscription.items.data[0].price.id;
    const detectedTier = getTierForPriceId(priceId);

    if (detectedTier) {
      tier = detectedTier;
    }
  }

  // Check subscription status
  const isActive = ['active', 'trialing'].includes(subscription.status);

  if (!isActive) {
    // Subscription is inactive, downgrade to free
    tier = 'free';
  }

  // Update business
  const { error } = await supabaseAdmin
    .from('businesses')
    .update({
      subscription_tier: tier,
      stripe_subscription_id: subscription.id,
    })
    .eq('id', businessId);

  if (error) {
    logger.error('[Stripe Webhook] Error updating business', error);
    throw error;
  }

  logger.success('[Stripe Webhook] Updated business tier', { tier });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logger.info('[Stripe Webhook] Subscription deleted', { subscriptionId: subscription.id });

  const businessId = subscription.metadata?.businessId;

  if (!businessId) {
    logger.error('[Stripe Webhook] Missing businessId in subscription metadata');
    return;
  }

  // Downgrade to free tier
  const { error } = await supabaseAdmin
    .from('businesses')
    .update({
      subscription_tier: 'free',
      stripe_subscription_id: null,
    })
    .eq('id', businessId);

  if (error) {
    logger.error('[Stripe Webhook] Error downgrading business', error);
    throw error;
  }

  logger.success('[Stripe Webhook] Downgraded business to free tier', { businessId });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  logger.info('[Stripe Webhook] Invoice payment succeeded', { invoiceId: invoice.id });
  // You can add logic here to send payment confirmation emails, etc.
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  logger.warn('[Stripe Webhook] Invoice payment failed', { invoiceId: invoice.id });
  // You can add logic here to notify the business about payment failure
}
