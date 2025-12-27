import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/api/auth-middleware';
import { supabaseAdmin } from '@/lib/api/supabase-admin';

export async function GET(request: NextRequest) {
  const auth = await authenticateUser(request);

  if (!auth.success) {
    return auth.response;
  }

  const { userId } = auth;

  // Get user info
  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
  const userEmail = userData?.user?.email;

  // Try to find business by user_id
  const { data: businessByUserId } = await supabaseAdmin
    .from('businesses')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Try to find business by email
  const { data: businessByEmail } = await supabaseAdmin
    .from('businesses')
    .select('*')
    .eq('email', userEmail)
    .single();

  return NextResponse.json({
    userId,
    userEmail,
    businessByUserId,
    businessByEmail,
    hasBusiness: !!(businessByUserId || businessByEmail),
  });
}
