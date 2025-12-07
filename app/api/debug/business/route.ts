import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/api/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get current user - using direct supabase call for API routes
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    console.log('[Debug] User check:', { user: user?.email, error: userError });

    if (!user) {
      // Try to get session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[Debug] Session:', session?.user?.email);

      return NextResponse.json({
        error: 'Not authenticated',
        debug: {
          hasUser: !!user,
          hasSession: !!session,
          userError,
        }
      }, { status: 401 });
    }

    // Get all businesses
    const { data: allBusinesses, error: allError } = await supabase
      .from('businesses')
      .select('*');

    // Get business by email
    const { data: businessByEmail, error: emailError } = await supabase
      .from('businesses')
      .select('*')
      .eq('email', user.email)
      .maybeSingle();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      businessByEmail,
      allBusinesses,
      errors: {
        allError,
        emailError,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
