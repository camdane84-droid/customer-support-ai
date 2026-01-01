import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    console.log('🍪 Debug: All cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();

    return NextResponse.json({
      authenticated: !!user,
      userId: user?.id,
      email: user?.email,
      error: error?.message,
      cookieCount: allCookies.length,
      supabaseCookies: allCookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-')).length
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
