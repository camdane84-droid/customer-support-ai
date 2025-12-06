import { supabase } from './api/supabase';

export async function signUp(email: string, password: string, businessName: string) {
  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('No user returned from signup');

  // Create business record for this user
  const { data: businessData, error: businessError } = await supabase
    .from('businesses')
    .insert({
      name: businessName,
      email: email,
    })
    .select()
    .single();

  if (businessError) throw businessError;

  return { user: authData.user, business: businessData };
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
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('email', userEmail)
    .single();

  if (error) throw error;
  return data;
}
