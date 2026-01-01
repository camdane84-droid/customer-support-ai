import { supabase } from '@/lib/api/supabase';

export async function signUp(
  email: string,
  password: string,
  businessName: string,
  invitationToken?: string
) {
  console.log('🔐 Starting signup for:', email);

  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  console.log('Auth response:', { authData, authError });

  if (authError) throw authError;
  if (!authData.user) throw new Error('No user returned from signup');

  // Wait a moment for session to settle
  await new Promise(resolve => setTimeout(resolve, 500));

  const userId = authData.user.id;

  // Option 1: Accept invitation if token provided
  if (invitationToken) {
    console.log('✅ User created, accepting invitation...');
    try {
      const response = await fetch('/api/team/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: invitationToken }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Failed to accept invitation:', error);

        // User-friendly error messages
        if (response.status === 404) {
          throw new Error('This invitation link is invalid or has expired. Please ask your team admin for a new invite.');
        } else if (response.status === 400) {
          throw new Error('This invitation link has already been used. Please ask your team admin for a new invite.');
        } else {
          throw new Error('Unable to join the team. Please contact your team admin for help.');
        }
      }

      const { businessId } = await response.json();

      // Fetch the business details
      const { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();

      console.log('✅ Invitation accepted, joined business');
      return { user: authData.user, business };
    } catch (error) {
      console.error('❌ Invitation acceptance failed:', error);
      throw error;
    }
  }

  // Option 2: Create new business (ONLY if no invitation token)
  // Security: Users can ONLY join existing businesses via invitation links
  console.log('✅ User created, creating new business...');
  try {
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .insert({
        name: businessName,
        email: email,
      })
      .select()
      .single();

    if (businessError) {
      console.error('❌ Business creation error:', businessError);

      // User-friendly error messages
      if (businessError.code === '23505') {
        throw new Error('A business with this name already exists. Please choose a different name or ask the business owner for an invitation link.');
      } else {
        throw new Error('Unable to create your business. Please try again or contact support.');
      }
    }

    // Add user as owner in business_members
    const { error: memberError } = await supabase
      .from('business_members')
      .insert({
        business_id: businessData.id,
        user_id: userId,
        role: 'owner',
      });

    if (memberError) {
      console.error('❌ Failed to add user as owner:', memberError);
      throw new Error('Your account was created but there was an issue setting up your business. Please contact support.');
    }

    console.log('✅ Business created successfully and user added as owner');
    return { user: authData.user, business: businessData };
  } catch (error: any) {
    console.error('❌ Failed to create business:', error);

    // Re-throw with user-friendly message if it's already a user-friendly error
    if (error.message && !error.code) {
      throw error;
    }

    throw new Error('Unable to complete signup. Please try again or contact support.');
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentBusiness(userEmail: string) {
  console.log('🔍 getCurrentBusiness called for email:', userEmail);

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('email', userEmail)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('❌ Error fetching business:', {
      email: userEmail,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      fullError: error
    });
    throw error;
  }

  console.log('✅ getCurrentBusiness result:', data ? `Found: ${data.name} (${data.id})` : 'No business found');
  return data;
}
