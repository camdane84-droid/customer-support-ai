import { supabase, type Conversation, type Message } from '@/lib/api/supabase';

export async function getConversations(businessId: string): Promise<Conversation[]> {
  console.log('📞 Fetching conversations for business:', businessId);

  try {
    // Increase timeout to 30 seconds and get the query result directly
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
    );

    const fetchPromise = (async () => {
      const result = await supabase
        .from('conversations')
        .select('*')
        .eq('business_id', businessId)
        .order('last_message_at', { ascending: false });

      return result;
    })();

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      console.error('❌ Error fetching conversations:', {
        businessId,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error
      });

      // Return empty array instead of throwing to prevent app crash
      console.warn('⚠️ Returning empty conversations array due to error');
      return [];
    }

    console.log('✅ Fetched', data?.length || 0, 'conversations');
    return data || [];
  } catch (error: any) {
    console.error('❌ Failed to fetch conversations:', error?.message || error);

    // Return empty array instead of throwing to prevent app crash
    console.warn('⚠️ Returning empty conversations array due to exception');
    return [];
  }
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  console.log('💬 Fetching messages for conversation:', conversationId);

  try {
    // Increase timeout to 30 seconds
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
    );

    const fetchPromise = (async () => {
      const result = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      return result;
    })();

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      console.error('❌ Error fetching messages:', {
        conversationId,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error
      });

      // Return empty array instead of throwing to prevent app crash
      console.warn('⚠️ Returning empty messages array due to error');
      return [];
    }

    console.log('✅ Fetched', data?.length || 0, 'messages');
    return data || [];
  } catch (error: any) {
    console.error('❌ Failed to fetch messages:', error?.message || error);

    // Return empty array instead of throwing to prevent app crash
    console.warn('⚠️ Returning empty messages array due to exception');
    return [];
  }
}

export async function createMessage(message: {
  conversation_id: string;
  business_id: string;
  sender_type: 'customer' | 'business' | 'ai';
  sender_name: string;
  content: string;
  channel: string;
}): Promise<Message> {
  // Use API route for server-side email sending
  const response = await fetch('/api/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create message');
  }

  return response.json();
}

export async function retryFailedMessage(messageId: string): Promise<{ success: boolean }> {
  // Use API route for server-side retry logic
  const response = await fetch('/api/messages/retry', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messageId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to retry message');
  }

  return response.json();
}
