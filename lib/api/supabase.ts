import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

// Types for our database
export type Business = {
  id: string;
  name: string;
  email: string;
  business_type: string | null;
  hours_of_operation: Record<string, string> | null;
  services: string[] | null;
  policies: string | null;
  subscription_status: string;
  subscription_plan: string;
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
  channel: 'email' | 'instagram' | 'sms';
  status: 'open' | 'closed' | 'pending';
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
