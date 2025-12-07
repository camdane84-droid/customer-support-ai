'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import type { Conversation, Message } from '@/lib/api/supabase';
import { getConversationMessages, createMessage, retryFailedMessage } from '@/lib/api/conversations';
import { supabase } from '@/lib/api/supabase';
import { formatDistanceToNow } from 'date-fns';
import AISuggestion from './AISuggestion';
import CannedResponsePicker from './CannedResponsePicker';
import MessageStatusBadge from './MessageStatusBadge';
import Toast from '@/components/ui/Toast';

interface MessageThreadProps {
  conversation: Conversation;
  businessId: string;
}

export default function MessageThread({ conversation, businessId }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  console.log('[MessageThread] Rendered with businessId:', businessId);

  useEffect(() => {
    loadMessages();

    // Subscribe to new messages and message updates in this conversation
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadMessages() {
    try {
      setLoading(true);
      const msgs = await getConversationMessages(conversation.id);
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || sending) return;

    try {
      setSending(true);
      await createMessage({
        conversation_id: conversation.id,
        business_id: businessId,
        sender_type: 'business',
        sender_name: 'Support Team',
        content: replyText,
        channel: conversation.channel,
      });

      // Message will be added via realtime subscription
      setReplyText('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  async function handleRetryMessage(messageId: string) {
    try {
      setRetryingMessageId(messageId);
      await retryFailedMessage(messageId);
      setToast({ type: 'success', message: 'Message sent successfully!' });
      // Status will update via realtime subscription
    } catch (error: any) {
      console.error('Failed to retry message:', error);

      // Show more helpful error message
      const errorMessage = error.message || 'Failed to retry message';

      if (errorMessage.includes('Email service not configured')) {
        setToast({
          type: 'warning',
          message: 'Email service not configured. Please contact your administrator to set up SendGrid.',
        });
      } else if (errorMessage.includes('not found')) {
        setToast({
          type: 'error',
          message: 'Message information not found. Please refresh the page and try again.',
        });
      } else {
        setToast({
          type: 'error',
          message: `Failed to retry message: ${errorMessage}`,
        });
      }
    } finally {
      setRetryingMessageId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{conversation.customer_name}</h3>
            <p className="text-sm text-gray-500">
              {conversation.customer_email || conversation.customer_instagram_id || 'No contact info'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`
              px-3 py-1 rounded-full text-xs font-medium
              ${conversation.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
            `}>
              {conversation.status}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            No messages yet
          </div>
        ) : (
          messages.map((message) => {
            const isCustomer = message.sender_type === 'customer';
            return (
              <div
                key={message.id}
                className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`
                    max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm
                    ${isCustomer
                      ? 'bg-white border border-gray-200 text-gray-900'
                      : 'bg-blue-500 text-white'
                    }
                  `}
                >
                  <p className="text-xs font-medium mb-1 opacity-75">
                    {message.sender_name || (isCustomer ? 'Customer' : 'You')}
                  </p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  <div className={`flex items-center justify-between mt-2 ${isCustomer ? 'text-gray-500' : 'text-blue-100'}`}>
                    <p className="text-xs">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </p>
                    {!isCustomer && message.status && (
                      <MessageStatusBadge
                        status={message.status}
                        errorMessage={message.error_message}
                      />
                    )}
                  </div>
                  {!isCustomer && message.status === 'failed' && (
                    <button
                      onClick={() => handleRetryMessage(message.id)}
                      disabled={retryingMessageId === message.id}
                      className="mt-2 text-xs text-blue-200 hover:text-white underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      {retryingMessageId === message.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Retrying...</span>
                        </>
                      ) : (
                        <span>Retry</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* AI Suggestion */}
      <AISuggestion
        conversationId={conversation.id}
        businessId={businessId}
        onUseSuggestion={(suggestion) => setReplyText(suggestion)}
      />

      {/* Reply Box */}
      <div className="border-t border-gray-200 bg-white p-4">
        <form onSubmit={handleSendMessage} className="space-y-3">
          <div className="flex space-x-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type your reply... (Press Enter to send, Shift+Enter for new line)"
              rows={3}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!replyText.trim() || sending}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 h-fit"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Reply Button */}
          <div className="relative">
            <CannedResponsePicker
              businessId={businessId}
              onSelect={(content) => setReplyText(content)}
            />
          </div>

          <p className="text-xs text-gray-500">
            💡 Tip: Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
