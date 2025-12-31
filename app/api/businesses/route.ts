import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import { authenticateUser } from '@/lib/api/auth-middleware';

// GET /api/businesses - Get all businesses user belongs to
export async function GET(request: NextRequest) {
  const auth = await authenticateUser(request);
  if (!auth.success) return auth.response;

  const { userId } = auth;

  try {
    const { data, error } = await supabaseAdmin
      .from('business_members')
      .select(`
        role,
        joined_at,
        businesses (
          id,
          name,
          email,
          business_type,
          subscription_status,
          subscription_plan,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: true });

    if (error) throw error;

    const businesses = data.map(item => ({
      ...(item as any).businesses,
      member_role: item.role,
      member_joined_at: item.joined_at,
    }));

    return NextResponse.json({ businesses });
  } catch (error: any) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 }
    );
  }
}
