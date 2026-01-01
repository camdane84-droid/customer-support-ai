import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/api/supabase-admin';
import type { Role } from '@/lib/permissions';

export interface AuthenticatedRequest {
  userId: string;
  businessId: string;
  role: Role;
}

/**
 * Verify user is authenticated and has access to the requested businessId
 */
export async function authenticateRequest(
  request: NextRequest,
  businessIdParam?: string,
  requiredPermissions?: Role[]
): Promise<{ success: true; data: AuthenticatedRequest } | { success: false; response: NextResponse }> {
  try {
    const cookieStore = await cookies();
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

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Unauthorized - Please sign in' },
          { status: 401 }
        ),
      };
    }

    // Get businessId from query params or use provided businessIdParam
    const searchParams = request.nextUrl.searchParams;
    const businessId = businessIdParam || searchParams.get('businessId');

    if (!businessId) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'businessId is required' },
          { status: 400 }
        ),
      };
    }

    // Check if user is a member of this business (using admin client to bypass RLS)
    console.log('🔍 [AUTH] Checking membership for:', { userId: user.id, businessId, email: user.email });

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('business_members')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .single();

    console.log('🔍 [AUTH] Membership check result:', {
      found: !!membership,
      error: membershipError?.message,
      errorCode: membershipError?.code,
      role: membership?.role
    });

    if (membershipError || !membership) {
      // Check if ANY memberships exist for this user
      const { data: allMemberships } = await supabaseAdmin
        .from('business_members')
        .select('business_id, role')
        .eq('user_id', user.id);

      console.error('❌ [AUTH] Membership not found.');
      console.error('   User ID:', user.id);
      console.error('   Requested businessId:', businessId);
      console.error('   User has', allMemberships?.length || 0, 'total memberships:', allMemberships);

      return {
        success: false,
        response: NextResponse.json(
          { error: 'Forbidden - You do not have access to this business' },
          { status: 403 }
        ),
      };
    }

    // Check role permissions if required
    if (requiredPermissions && !requiredPermissions.includes(membership.role)) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Forbidden - Insufficient permissions' },
          { status: 403 }
        ),
      };
    }

    return {
      success: true,
      data: {
        userId: user.id,
        businessId: businessId,
        role: membership.role,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authentication failed', details: error.message },
        { status: 500 }
      ),
    };
  }
}

/**
 * Verify user is authenticated (without businessId check)
 */
export async function authenticateUser(
  request: NextRequest
): Promise<{ success: true; userId: string } | { success: false; response: NextResponse }> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const supabaseCookies = allCookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-'));

    console.log('🍪 [authenticateUser] Cookies:', {
      total: allCookies.length,
      supabase: supabaseCookies.length,
      names: supabaseCookies.map(c => c.name)
    });

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

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('👤 [authenticateUser] Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      error: authError?.message
    });

    if (authError || !user) {
      console.error('❌ [authenticateUser] No authenticated user');
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Unauthorized - Please sign in' },
          { status: 401 }
        ),
      };
    }

    return {
      success: true,
      userId: user.id,
    };
  } catch (error: any) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authentication failed', details: error.message },
        { status: 500 }
      ),
    };
  }
}
