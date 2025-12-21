'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Archive, Trash2, StickyNote } from 'lucide-react';
import type { Conversation, Message } from '@/lib/api/supabase';
import { getConversationMessages, createMessage, retryFailedMessage } from '@/lib/api/conversations';
import { supabase } from '@/lib/api/supabase';
import { formatDistanceToNow } from 'date-fns';
import AISuggestion from './AISuggestion';
import CannedResponsePicker from './CannedResponsePicker';
import MessageStatusBadge from './MessageStatusBadge';
import CustomerProfileModal from './CustomerProfileModal';
import Tag from '@/components/ui/Tag';
import Toast from '@/components/ui/Toast';
import { detectTags, type Tag as TagType } from '@/lib/utils/auto-tagging';

interface MessageThreadProps {
  conversation: Conversation;
  businessId: string;
  onConversationDeleted?: () => void;
}

export default function MessageThread({ conversation, businessId, onConversationDeleted }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notes, setNotes] = useState(conversation.notes || '');
  const [tags, setTags] = useState<TagType[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  console.log('[MessageThread] Rendered with businessId:', businessId);

  useEffect(() => {
    loadMessages();
    markConversationAsRead();

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
          // Mark as read again when new messages arrive while viewing
          markConversationAsRead();
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

      // Auto-detect tags from messages
      if (msgs.length > 0) {
        const detectedTags = detectTags(msgs);
        setTags(detectedTags);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markConversationAsRead() {
    try {
      const response = await fetch(`/api/conversations/${conversation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unread_count: 0 }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      console.log('✅ Marked conversation as read');
    } catch (error) {
      console.error('❌ Failed to mark conversation as read:', error);
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

  async function handleArchiveConversation() {
    try {
      setArchiving(true);

      console.log('Archiving conversation:', conversation.id);

      // Archive the conversation
      const response = await fetch(`/api/conversations/${conversation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive' }),
      });

      console.log('Archive response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Archive failed:', errorData);
        throw new Error(errorData.error || 'Failed to archive conversation');
      }

      const result = await response.json();
      console.log('Archive successful:', result);

      setToast({ type: 'success', message: 'Conversation archived successfully!' });
      setShowArchiveModal(false);

      // Call the callback to let parent handle the UI update
      if (onConversationDeleted) {
        onConversationDeleted();
      }
    } catch (error: any) {
      console.error('Failed to archive conversation:', error);
      setToast({
        type: 'error',
        message: error.message || 'Failed to archive conversation',
      });
      setShowArchiveModal(false);
    } finally {
      setArchiving(false);
    }
  }

  async function handleDeleteConversation() {
    try {
      setDeleting(true);

      console.log('Deleting conversation:', conversation.id);

      // Delete the conversation
      const response = await fetch(`/api/conversations/${conversation.id}`, {
        method: 'DELETE',
      });

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete failed:', errorData);
        throw new Error(errorData.error || 'Failed to delete conversation');
      }

      const result = await response.json();
      console.log('Delete successful:', result);

      setToast({ type: 'success', message: 'Conversation deleted successfully!' });
      setShowDeleteModal(false);

      // Call the callback to let parent handle the UI update
      if (onConversationDeleted) {
        onConversationDeleted();
      }
    } catch (error: any) {
      console.error('Failed to delete conversation:', error);
      setToast({
        type: 'error',
        message: error.message || 'Failed to delete conversation',
      });
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  }

  async function handleSaveNotes() {
    try {
      setSavingNotes(true);

      console.log('Saving notes for conversation:', conversation.id);

      const response = await fetch(`/api/conversations/${conversation.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Save notes failed:', errorData);
        throw new Error(errorData.error || 'Failed to save notes');
      }

      const result = await response.json();
      console.log('Notes saved successfully:', result);

      setToast({ type: 'success', message: 'Notes saved successfully!' });
      setShowNotesModal(false);
    } catch (error: any) {
      console.error('Failed to save notes:', error);
      setToast({
        type: 'error',
        message: error.message || 'Failed to save notes',
      });
    } finally {
      setSavingNotes(false);
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
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1">
            {/* Clickable Avatar for Profile */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0 hover:shadow-lg transition-shadow cursor-pointer"
              title="View customer profile"
            >
              <span className="text-white font-semibold text-sm">
                {conversation.customer_name.charAt(0).toUpperCase()}
              </span>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900">{conversation.customer_name}</h3>

                {/* Notes Button with Expand Animation */}
                <button
                  onClick={() => setShowNotesModal(true)}
                  className="group relative overflow-hidden p-1.5 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-300 ease-in-out hover:pr-20"
                >
                  <div className="flex items-center space-x-2">
                    <StickyNote className="w-4 h-4 transition-transform duration-300" />
                    <span className="absolute left-7 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium whitespace-nowrap">
                      Notepad
                    </span>
                  </div>
                </button>
              </div>
              <p className="text-sm text-gray-500">
                {conversation.customer_email || conversation.customer_instagram_id || 'No contact info'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`
              px-3 py-1 rounded-full text-xs font-medium
              ${conversation.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
            `}>
              {conversation.status}
            </span>

            {/* Archive Button with Expand Animation */}
            <button
              onClick={() => setShowArchiveModal(true)}
              className="group relative overflow-hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300 ease-in-out hover:pr-20"
            >
              <div className="flex items-center space-x-2">
                <Archive className="w-5 h-5 transition-transform duration-300" />
                <span className="absolute left-9 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium whitespace-nowrap">
                  Archive
                </span>
              </div>
            </button>

            {/* Delete Button with Expand Animation */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="group relative overflow-hidden p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 ease-in-out hover:pr-16"
            >
              <div className="flex items-center space-x-2">
                <Trash2 className="w-5 h-5 transition-transform duration-300" />
                <span className="absolute left-9 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium whitespace-nowrap">
                  Delete
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map(tag => (
              <Tag key={tag.id} tag={tag} size="sm" />
            ))}
          </div>
        )}
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

      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Archive className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Archive Conversation</h3>
                <p className="text-sm text-gray-500">Move to archives</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to archive this conversation? You can find it later in the Archives section organized by date.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowArchiveModal(false)}
                disabled={archiving}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveConversation}
                disabled={archiving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {archiving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Archiving...</span>
                  </>
                ) : (
                  <span>Archive</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Conversation</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you'd like to <strong>delete</strong> this conversation instead of archiving?
              This will permanently remove all messages and cannot be recovered.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConversation}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Permanently</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <StickyNote className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
                <p className="text-sm text-gray-500">Add personal notes about this customer</p>
              </div>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Type your notes here..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setNotes(conversation.notes || '');
                  setShowNotesModal(false);
                }}
                disabled={savingNotes}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {savingNotes ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Notes</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Profile Modal */}
      {showProfileModal && (
        <CustomerProfileModal
          conversationId={conversation.id}
          customerName={conversation.customer_name}
          customerEmail={conversation.customer_email}
          customerInstagram={conversation.customer_instagram_id}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}
