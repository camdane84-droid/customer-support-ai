import { NextResponse } from 'next/server';
import { supabase } from '@/lib/api/supabase';

export async function GET() {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('social_connections')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        hint: error.hint,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      canQueryTable: true,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
    }, { status: 500 });
  }
}
