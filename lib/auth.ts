import { supabase } from '@/lib/api/supabase';

export async function signUp(email: string, password: string, businessName: string) {
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

  // Create business record
  console.log('✅ User created, now creating business...');

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
      // If it's a duplicate error, that's okay - business already exists
      if (businessError.code === '23505') {
        console.log('⚠️ Business already exists, fetching it...');
        const { data: existingBiz } = await supabase
          .from('businesses')
          .select('*')
          .eq('email', email)
          .single();

        return { user: authData.user, business: existingBiz };
      }

      console.error('❌ Business creation error:', businessError);
      throw businessError;
    }

    console.log('✅ Business created successfully');
    return { user: authData.user, business: businessData };
  } catch (error) {
    console.error('❌ Failed to create business:', error);
    // User is created but business failed - user can still log in
    // Business will be created by AuthContext if missing
    return { user: authData.user, business: null };
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
