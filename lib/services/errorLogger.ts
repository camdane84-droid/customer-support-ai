import { supabase } from '@/lib/api/supabase';

export async function logError(params: {
  businessId: string;
  errorType: string;
  errorMessage: string;
  context?: Record<string, any>;
}) {
  try {
    await supabase.from('error_logs').insert({
      business_id: params.businessId,
      error_type: params.errorType,
      error_message: params.errorMessage,
      context: params.context || {},
    });

    console.error('🔴 Error logged:', params.errorType, params.errorMessage);
  } catch (error) {
    // Failed to log error - just console log it
    console.error('Failed to log error to database:', error);
  }
}
