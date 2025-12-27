import { NextResponse } from 'next/server';
import { supabase } from '@/lib/api/supabase';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    console.log('🔐 [TEST-AUTH] Testing server-side sign in for:', email);

    // Test sign in on server side
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ [TEST-AUTH] Server-side sign in failed:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        errorName: error.name,
        errorStatus: error.status,
      }, { status: 400 });
    }

    console.log('✅ [TEST-AUTH] Server-side sign in successful');
    return NextResponse.json({
      success: true,
      message: 'Server-side auth works',
      userEmail: data.user?.email,
    });
  } catch (err: any) {
    console.error('❌ [TEST-AUTH] Unexpected error:', err);
    return NextResponse.json({
      success: false,
      error: err.message,
      errorType: err.constructor.name,
    }, { status: 500 });
  }
}
