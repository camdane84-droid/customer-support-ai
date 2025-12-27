import { NextRequest, NextResponse } from 'next/server';
import { stripe, getPriceIdForTier } from '@/lib/stripe/config';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/api/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    const { businessId, tier, successUrl, cancelUrl } = await request.json();

    // Authenticate and authorize - verify user owns this business
    const auth = await authenticateRequest(request, businessId);
    if (!auth.success) {
      return auth.response;
    }

    if (!businessId || !tier) {
      return NextResponse.json(
        { error: 'businessId and tier are required' },
        { status: 400 }
      );
    }

    if (tier !== 'starter' && tier !== 'pro') {
      return NextResponse.json(
        { error: 'Invalid tier. Must be "starter" or "pro"' },
        { status: 400 }
      );
    }

    // Get business details
    const { data: business, error: businessError } = await supabaseServer
      .from('businesses')
      .select('id, name, email, stripe_customer_id')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Get or create Stripe customer
    let customerId = business.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: business.email,
        name: business.name,
        metadata: {
          businessId: business.id,
        },
      });

      customerId = customer.id;

      // Save customer ID to database
      await supabaseServer
        .from('businesses')
        .update({ stripe_customer_id: customerId })
        .eq('id', businessId);
    }

    // Get price ID for the selected tier
    const priceId = getPriceIdForTier(tier);

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        businessId: business.id,
        tier: tier,
      },
      subscription_data: {
        metadata: {
          businessId: business.id,
          tier: tier,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
