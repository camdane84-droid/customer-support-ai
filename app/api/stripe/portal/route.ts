import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { authenticateUser } from '@/lib/api/auth-middleware';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  // Authenticate user
  const auth = await authenticateUser(request);
  if (!auth.success) {
    return auth.response;
  }

  try {
    const { customerId } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      );
    }

    // Verify user owns a business with this customer ID
    const { data: business } = await supabaseServer
      .from('businesses')
      .select('id')
      .eq('user_id', auth.userId)
      .eq('stripe_customer_id', customerId)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: 'Forbidden - Invalid customer ID' },
        { status: 403 }
      );
    }

    // Create a billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
