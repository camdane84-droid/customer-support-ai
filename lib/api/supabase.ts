import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Get environment variables - trim to remove any whitespace
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

// Always log what we're using
console.log('🔧 [SUPABASE] Initializing with URL:', supabaseUrl);
console.log('🔧 [SUPABASE] URL length:', supabaseUrl?.length);
console.log('🔧 [SUPABASE] URL type:', typeof supabaseUrl);
console.log('🔧 [SUPABASE] URL first/last chars:', supabaseUrl.charCodeAt(0), supabaseUrl.charCodeAt(supabaseUrl.length - 1));
console.log('🔧 [SUPABASE] Anon key present:', !!supabaseAnonKey);
console.log('🔧 [SUPABASE] Anon key length:', supabaseAnonKey?.length);
console.log('🔧 [SUPABASE] Anon key first/last chars:', supabaseAnonKey.charCodeAt(0), supabaseAnonKey.charCodeAt(supabaseAnonKey.length - 1));
console.log('🔧 [SUPABASE] Full URL:', JSON.stringify(supabaseUrl));
console.log('🔧 [SUPABASE] First 50 chars of anon key:', supabaseAnonKey.substring(0, 50));

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
}

// Create browser client using @supabase/ssr (proper Next.js App Router pattern)
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
);

// Types for our database
export type Business = {
  id: string;
  name: string;
  email: string;
  business_type: string | null;
  hours_of_operation: Record<string, string> | null;
  services: string[] | null;
  policies: string | null;
  auto_generate_notes?: boolean;
  auto_reply_enabled?: boolean;
  auto_reply_mode?: 'after_hours' | 'all_day' | 'custom';
  auto_reply_start?: string;   // "18:00"
  auto_reply_end?: string;     // "06:00"
  ai_parse_enabled?: boolean;
  ai_parse_urgent?: boolean;
  ai_parse_important?: boolean;
  ai_parse_urgent_keywords?: string[];
  ai_parse_important_keywords?: string[];
  ai_parse_notify_email?: string | null;
  ai_parse_notify_phone?: string | null;
  ai_parse_notify_urgent?: boolean;
  ai_parse_notify_important?: boolean;
  profile_categories?: {
    allergies: boolean;
    favorite_category: boolean;
    past_orders: boolean;
    issues: boolean;
    sizes_dimensions: boolean;
    preferences: boolean;
    best_times: boolean;
  };
  subscription_status: string;
  subscription_plan: string;
  subscription_tier?: 'free' | 'starter' | 'pro';
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  ai_suggestions_used_today?: number;
  ai_suggestions_reset_at?: string;
  conversations_used_this_month?: number;
  conversations_reset_at?: string;
  message_count: number;
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  id: string;
  business_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_instagram_id: string | null;
  customer_tiktok_id: string | null;
  channel: 'email' | 'instagram' | 'sms' | 'whatsapp' | 'tiktok';
  status: 'open' | 'closed' | 'pending' | 'archived';
  unread_count: number;
  last_message_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  business_id: string;
  sender_type: 'customer' | 'business' | 'ai';
  sender_name: string | null;
  content: string;
  channel: string;
  is_ai_suggested: boolean;
  metadata: Record<string, any> | null;
  created_at: string;
  status?: string;
  sent_at?: string | null;
  failed_at?: string | null;
  error_message?: string | null;
  priority?: 'normal' | 'important' | 'urgent';
  priority_reason?: string | null;
};

export type Notification = {
  id: string;
  business_id: string;
  message_id: string | null;
  conversation_id: string | null;
  type: 'urgent' | 'important';
  title: string;
  summary: string | null;
  read: boolean;
  created_at: string;
};

export type KnowledgeBase = {
  id: string;
  business_id: string;
  question: string;
  answer: string;
  category: string | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
};

// Team collaboration types
export type BusinessMember = {
  id: string;
  business_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'agent' | 'viewer';
  invited_by: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
};

export type TeamInvitation = {
  id: string;
  business_id: string;
  email: string;
  role: 'admin' | 'agent' | 'viewer';
  invited_by: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

export type UserPreferences = {
  user_id: string;
  active_business_id: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessWithRole = Business & {
  member_role: 'owner' | 'admin' | 'agent' | 'viewer';
  member_joined_at: string;
};
