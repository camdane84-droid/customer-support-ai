import { createClient } from '@supabase/supabase-js';

// Server-side only Supabase client with service role key
// This bypasses RLS policies - use only in API routes!
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
