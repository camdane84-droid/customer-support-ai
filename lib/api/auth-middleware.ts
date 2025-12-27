import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export interface AuthenticatedRequest {
  userId: string;
  businessId: string;
}

/**
 * Verify user is authenticated and has access to the requested businessId
 */
export async function authenticateRequest(
  request: NextRequest,
  businessIdParam?: string
): Promise<{ success: true; data: AuthenticatedRequest } | { success: false; response: NextResponse }> {
  try {
    // Create Supabase client with cookies
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

    // Verify user owns this business (check both user_id and email for legacy accounts)
    let { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, email, user_id')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Forbidden - Business not found' },
          { status: 403 }
        ),
      };
    }

    // Check if user owns this business (by user_id OR email for legacy accounts)
    const ownsBusinessByUserId = business.user_id === user.id;
    const ownsBusinessByEmail = business.email === user.email;

    if (!ownsBusinessByUserId && !ownsBusinessByEmail) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Forbidden - You do not have access to this business' },
          { status: 403 }
        ),
      };
    }

    return {
      success: true,
      data: {
        userId: user.id,
        businessId: business.id,
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

    if (authError || !user) {
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
