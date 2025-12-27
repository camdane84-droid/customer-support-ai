import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('🧪 [RAW-FETCH] Testing raw fetch to Supabase');
    console.log('🧪 URL:', supabaseUrl);
    console.log('🧪 Anon key present:', !!supabaseAnonKey);
    console.log('🧪 Anon key length:', supabaseAnonKey?.length);

    // Make raw fetch call to Supabase auth endpoint
    const authUrl = `${supabaseUrl}/auth/v1/token?grant_type=password`;

    console.log('🧪 Auth URL:', authUrl);

    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey || '',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    console.log('🧪 Response status:', response.status);
    console.log('🧪 Response data:', data);

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        status: response.status,
        error: data,
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Raw fetch worked!',
      userEmail: data.user?.email,
    });
  } catch (err: any) {
    console.error('🧪 [RAW-FETCH] Error:', err);
    return NextResponse.json({
      success: false,
      error: err.message,
      errorType: err.constructor.name,
    }, { status: 500 });
  }
}
