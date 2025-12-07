import { supabase, type Conversation, type Message } from '@/lib/api/supabase';

export async function getConversations(businessId: string): Promise<Conversation[]> {
  console.log('📞 Fetching conversations for business:', businessId);

  // Add a timeout
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000)
  );

  const fetchPromise = supabase
    .from('conversations')
    .select('*')
    .eq('business_id', businessId)
    .order('last_message_at', { ascending: false });

  try {
    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

    if (error) {
      console.error('❌ Error fetching conversations:', {
        businessId,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error
      });
      throw error;
    }

    console.log('✅ Fetched', data?.length || 0, 'conversations');
    return data || [];
  } catch (error: any) {
    console.error('❌ Failed to fetch conversations:', error?.message || error);
    throw error;
  }
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  console.log('💬 Fetching messages for conversation:', conversationId);

  // Add a timeout
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000)
  );

  const fetchPromise = supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  try {
    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

    if (error) {
      console.error('❌ Error fetching messages:', {
        conversationId,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error
      });
      throw error;
    }

    console.log('✅ Fetched', data?.length || 0, 'messages');
    return data || [];
  } catch (error: any) {
    console.error('❌ Failed to fetch messages:', error?.message || error);
    throw error;
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
