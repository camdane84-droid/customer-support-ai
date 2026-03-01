import { supabase, type Conversation, type Message } from '@/lib/api/supabase';

export async function getConversations(businessId: string): Promise<Conversation[]> {
  console.log('📞 Fetching conversations for business:', businessId);

  if (!businessId) {
    console.warn('⚠️ No businessId provided to getConversations');
    return [];
  }

  // Retry logic for 403 errors (membership might not be propagated yet)
  let retries = 3;
  let lastError: any = null;

  while (retries > 0) {
    try {
      const response = await fetch(`/api/conversations?businessId=${businessId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error('❌ Failed to parse error response');
        }

        if (response.status === 401) {
          console.error('❌ Unauthorized - User not signed in');
          return [];
        } else if (response.status === 403) {
          lastError = errorData;
          console.warn(`⚠️ Forbidden (attempt ${4 - retries}/3) - Retrying in 1s...`);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          } else {
            console.error('❌ Forbidden after 3 retries - User does not have access to this business');
            return [];
          }
        } else {
          console.error('❌ API error fetching conversations:', errorData);
          return [];
        }
      }

      const { conversations } = await response.json();
      console.log('✅ Fetched', conversations?.length || 0, 'conversations');
      return conversations || [];
    } catch (error: any) {
      console.error('❌ Failed to fetch conversations:', error?.message || error);
      return [];
    }
  }

  return [];
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  console.log('💬 Fetching messages for conversation:', conversationId);

  try {
    const response = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API error fetching messages:', errorData);
      return [];
    }

    const { messages } = await response.json();
    console.log('✅ Fetched', messages?.length || 0, 'messages');
    return messages || [];
  } catch (error: any) {
    console.error('❌ Failed to fetch messages:', error?.message || error);
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
