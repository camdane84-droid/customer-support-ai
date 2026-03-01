'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Archive, Trash2, StickyNote, CheckCircle, RotateCcw, Eye } from 'lucide-react';
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
import { getCustomerDisplayName, getCustomerInitials } from '@/lib/utils/customerDisplay';
import { useAuth } from '@/lib/context/AuthContext';
import { hasPermission } from '@/lib/permissions';

interface MessageThreadProps {
  conversation: Conversation;
  businessId: string;
  onConversationDeleted?: () => void;
}

export default function MessageThread({ conversation, businessId, onConversationDeleted }: MessageThreadProps) {
  const { currentBusiness } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [returning, setReturning] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notes, setNotes] = useState(conversation.notes || '');
  const [tags, setTags] = useState<TagType[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Optimistic message state for instant UI updates
  const [optimisticMessages, setOptimisticMessages] = useState<Map<string, Message>>(new Map());
  const [animatingMessageIds, setAnimatingMessageIds] = useState<Set<string>>(new Set());

  // Check if user can send messages (agents, admins, and owners can)
  const canSendMessages = currentBusiness ? hasPermission(currentBusiness.member_role, 'SEND_MESSAGES') : false;

  console.log('[MessageThread] Rendered with businessId:', businessId);
  console.log('[MessageThread] Current business:', currentBusiness?.name, 'Role:', currentBusiness?.member_role, 'Can send:', canSendMessages);

  useEffect(() => {
    loadMessages();
    markConversationAsRead();

    // Poll for new messages every 3 seconds as primary update mechanism
    const pollInterval = setInterval(async () => {
      if (document.hidden) return;
      try {
        const msgs = await getConversationMessages(conversation.id);
        setMessages((prev) => {
          // Only update if message count changed or last message differs
          if (
            msgs.length !== prev.length ||
            (msgs.length > 0 && prev.length > 0 && msgs[msgs.length - 1].id !== prev[prev.length - 1].id)
          ) {
            // Clear optimistic messages that now have real counterparts
            setOptimisticMessages((currentOptimistic) => {
              if (currentOptimistic.size === 0) return currentOptimistic;
              const next = new Map(currentOptimistic);
              currentOptimistic.forEach((optMsg, tempId) => {
                const match = msgs.find(
                  (m) =>
                    m.content === optMsg.content &&
                    m.sender_type === optMsg.sender_type &&
                    Math.abs(new Date(m.created_at).getTime() - new Date(optMsg.created_at).getTime()) < 10000
                );
                if (match) next.delete(tempId);
              });
              return next;
            });
            markConversationAsRead();
            return msgs;
          }
          // Update statuses even if count is same (e.g. sending → sent)
          const statusChanged = msgs.some((m, i) => prev[i] && m.status !== prev[i].status);
          if (statusChanged) return msgs;
          return prev;
        });
      } catch (error) {
        // Silent fail on poll
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, optimisticMessages]);

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
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    });
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || sending) return;

    const messageContent = replyText;
    const tempId = `temp-${crypto.randomUUID()}`;

    // Create optimistic message for instant UI feedback
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: conversation.id,
      business_id: businessId,
      sender_type: 'business',
      sender_name: 'Support Team',
      content: messageContent,
      channel: conversation.channel,
      is_ai_suggested: false,
      metadata: null,
      created_at: new Date().toISOString(),
      status: 'sending',
      sent_at: null,
      failed_at: null,
      error_message: null,
    };

    try {
      setSending(true);

      console.log('🚀 [SEND] Creating optimistic message:', tempId);

      // 1. Add to optimistic messages immediately (instant UI update)
      setOptimisticMessages((prev) => {
        const next = new Map(prev).set(tempId, optimisticMessage);
        console.log('✅ [SEND] Added optimistic message. Total optimistic:', next.size);
        return next;
      });

      // 2. Mark as animating for entrance animation
      setAnimatingMessageIds((prev) => {
        const next = new Set(prev).add(tempId);
        console.log('🎬 [SEND] Marked as animating. Total animating:', next.size);
        return next;
      });

      // 3. Clear input immediately for better UX
      setReplyText('');
      console.log('🧹 [SEND] Cleared input field');

      // 4. Remove animation state after animation completes (400ms)
      setTimeout(() => {
        setAnimatingMessageIds((prev) => {
          const next = new Set(prev);
          next.delete(tempId);
          console.log('🎬 [SEND] Animation complete, removed from animating set');
          return next;
        });
      }, 400);

      // 5. Send to API (background operation)
      await createMessage({
        conversation_id: conversation.id,
        business_id: businessId,
        sender_type: 'business',
        sender_name: 'Support Team',
        content: messageContent,
        channel: conversation.channel,
      });

      // Update optimistic message to 'sent' immediately on API success
      // Realtime will eventually replace it with the real message
      console.log('✅ [SEND] API success - updating optimistic message to sent');
      setOptimisticMessages((prev) => {
        const next = new Map(prev);
        const msg = next.get(tempId);
        if (msg) {
          next.set(tempId, { ...msg, status: 'sent', sent_at: new Date().toISOString() });
        }
        return next;
      });
    } catch (error) {
      console.error('❌ [SEND] Failed to send message:', error);

      // Update optimistic message to failed status
      setOptimisticMessages((prev) => {
        const next = new Map(prev);
        const msg = next.get(tempId);
        if (msg) {
          next.set(tempId, {
            ...msg,
            status: 'failed',
            failed_at: new Date().toISOString(),
            error_message: 'Failed to send message',
          });
        }
        return next;
      });

      // Show error toast
      setToast({
        type: 'error',
        message: 'Failed to send message. Click retry to try again.',
      });
    } finally {
      setSending(false);
    }
  }

  async function handleRetryMessage(messageId: string) {
    try {
      setRetryingMessageId(messageId);
      await retryFailedMessage(messageId);
      setToast({ type: 'success', message: 'Message sent successfully!' });

      // Update message status locally since Realtime may not fire
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, status: 'sent', sent_at: new Date().toISOString(), failed_at: null, error_message: null }
            : msg
        )
      );
      // Also update optimistic messages if the retry was on an optimistic message
      setOptimisticMessages((prev) => {
        const next = new Map(prev);
        const msg = next.get(messageId);
        if (msg) {
          next.set(messageId, { ...msg, status: 'sent', sent_at: new Date().toISOString(), failed_at: null, error_message: null });
        }
        return next;
      });
    } catch (error: any) {
      console.error('Failed to retry message:', error);

      // Show more helpful error message
      const errorMessage = error.message || 'Failed to retry message';

      if (errorMessage.includes('Email service not configured')) {
        setToast({
          type: 'warning',
          message: 'Email service not configured. Please contact your administrator to set up the email service.',
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
        body: JSON.stringify({ action: 'archive', archive_type: 'archived' }),
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

  async function handleResolveConversation() {
    try {
      setResolving(true);

      console.log('Resolving conversation:', conversation.id);

      // Resolve the conversation
      const response = await fetch(`/api/conversations/${conversation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive', archive_type: 'resolved' }),
      });

      console.log('Resolve response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Resolve failed:', errorData);
        throw new Error(errorData.error || 'Failed to resolve conversation');
      }

      const result = await response.json();
      console.log('Resolve successful:', result);

      setToast({ type: 'success', message: 'Conversation resolved successfully!' });
      setShowResolveModal(false);

      // Call the callback to let parent handle the UI update
      if (onConversationDeleted) {
        onConversationDeleted();
      }
    } catch (error: any) {
      console.error('Failed to resolve conversation:', error);
      setToast({
        type: 'error',
        message: error.message || 'Failed to resolve conversation',
      });
      setShowResolveModal(false);
    } finally {
      setResolving(false);
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

  async function handleReturnToInbox() {
    try {
      setReturning(true);

      console.log('Returning conversation to inbox:', conversation.id);

      // Update the conversation status back to 'open'
      const response = await fetch(`/api/conversations/${conversation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'open' }),
      });

      console.log('Return to inbox response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Return to inbox failed:', errorData);
        throw new Error(errorData.error || 'Failed to return conversation to inbox');
      }

      const result = await response.json();
      console.log('Return to inbox successful:', result);

      // Show brief success message
      setToast({ type: 'success', message: 'Returned to inbox!' });

      // Immediately trigger parent to remove this conversation from view
      // This will cause the conversation to disappear from the archives list
      if (onConversationDeleted) {
        onConversationDeleted();
      }

      // Small delay to show the toast, then redirect to inbox
      setTimeout(() => {
        window.location.href = '/dashboard/inbox';
      }, 500);
    } catch (error: any) {
      console.error('Failed to return conversation to inbox:', error);
      setToast({
        type: 'error',
        message: error.message || 'Failed to return conversation to inbox',
      });
      setReturning(false);
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

  const displayName = getCustomerDisplayName(conversation);
  const initials = getCustomerInitials(displayName);

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
      <div className="border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1">
            {/* Clickable Avatar for Profile */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0 hover:shadow-lg transition-shadow cursor-pointer"
              title="View customer profile"
            >
              <span className="text-white font-semibold text-sm">
                {initials}
              </span>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{displayName}</h3>

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
              ${conversation.status === 'open' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'}
            `}>
              {conversation.status}
            </span>

            {/* Show Archive/Resolve buttons only if conversation is not archived */}
            {conversation.status !== 'archived' ? (
              <>
                {/* Archive Button with Expand Animation */}
                <button
                  onClick={() => setShowArchiveModal(true)}
                  className="group relative overflow-hidden p-2 text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-all duration-300 ease-in-out hover:pr-20"
                >
                  <div className="flex items-center space-x-2">
                    <Archive className="w-5 h-5 transition-transform duration-300" />
                    <span className="absolute left-9 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium whitespace-nowrap">
                      Archive
                    </span>
                  </div>
                </button>

                {/* Resolve Button with Expand Animation */}
                <button
                  onClick={() => setShowResolveModal(true)}
                  className="group relative overflow-hidden p-2 text-gray-600 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-slate-700 rounded-lg transition-all duration-300 ease-in-out hover:pr-20"
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 transition-transform duration-300" />
                    <span className="absolute left-9 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium whitespace-nowrap">
                      Resolve
                    </span>
                  </div>
                </button>
              </>
            ) : (
              /* Return to Inbox Button - shown only for archived conversations */
              <button
                onClick={handleReturnToInbox}
                disabled={returning}
                className="group relative overflow-hidden p-2 text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-all duration-300 ease-in-out hover:pr-32"
              >
                <div className="flex items-center space-x-2">
                  <RotateCcw className="w-5 h-5 transition-transform duration-300" />
                  <span className="absolute left-9 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium whitespace-nowrap">
                    {returning ? 'Returning...' : 'Return to Inbox'}
                  </span>
                </div>
              </button>
            )}

            {/* Delete Button with Expand Animation */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="group relative overflow-hidden p-2 text-gray-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-all duration-300 ease-in-out hover:pr-16"
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900">
        {messages.length === 0 && optimisticMessages.size === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            No messages yet
          </div>
        ) : (
          <>
            {/* Render confirmed messages */}
            {messages.map((message) => {
              const isCustomer = message.sender_type === 'customer';
              const shouldAnimate = animatingMessageIds.has(message.id);

              // Get proper display name for customer messages
              let senderDisplayName = message.sender_name || (isCustomer ? 'Customer' : 'You');
              if (isCustomer && conversation.channel === 'instagram') {
                // For Instagram, use the conversation's display name instead of numeric ID
                // Check if sender_name is all digits (Instagram ID)
                const isNumericId = /^\d+$/.test(message.sender_name || '');
                if (isNumericId) {
                  senderDisplayName = displayName; // Use the conversation's display name
                }
              }

              return (
                <div
                  key={message.id}
                  className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`
                      max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm
                      ${isCustomer
                        ? 'bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white'
                        : 'bg-indigo-500 text-white'
                      }
                      ${shouldAnimate ? 'animate-message-in' : ''}
                    `}
                  >
                    <p className="text-xs font-medium mb-1 opacity-75">
                      {senderDisplayName}
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
            })}

            {/* Render optimistic messages */}
            {Array.from(optimisticMessages.values()).map((message) => {
              const shouldAnimate = animatingMessageIds.has(message.id);

              return (
                <div
                  key={message.id}
                  className="flex justify-end"
                >
                  <div
                    className={`
                      max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm
                      bg-indigo-500 text-white
                      ${shouldAnimate ? 'animate-message-in' : ''}
                    `}
                  >
                    <p className="text-xs font-medium mb-1 opacity-75">
                      You
                    </p>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <div className="flex items-center justify-between mt-2 text-blue-100">
                      <p className="text-xs">
                        Just now
                      </p>
                      {message.status && (
                        <MessageStatusBadge
                          status={message.status}
                          errorMessage={message.error_message}
                        />
                      )}
                    </div>
                    {message.status === 'failed' && (
                      <button
                        onClick={() => {
                          // Retry logic for optimistic messages
                          // Remove failed optimistic message and re-populate input
                          setOptimisticMessages((prev) => {
                            const next = new Map(prev);
                            next.delete(message.id);
                            return next;
                          });
                          setReplyText(message.content);
                        }}
                        className="mt-2 text-xs text-blue-200 hover:text-white underline flex items-center space-x-1"
                      >
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* AI Suggestion - Only show if user can send messages and AI insights are enabled */}
      {canSendMessages && currentBusiness?.auto_generate_notes && (
        <AISuggestion
          conversationId={conversation.id}
          businessId={businessId}
          onUseSuggestion={(suggestion) => setReplyText(suggestion)}
        />
      )}

      {/* Reply Box */}
      <div className="border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        {!canSendMessages && (
          <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg flex items-start space-x-2">
            <Eye className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                View-Only Access
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                You have viewer permissions and cannot send messages. Contact your team admin or owner to upgrade your role.
              </p>
            </div>
          </div>
        )}
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
              placeholder={canSendMessages ? "Type your reply... (Press Enter to send, Shift+Enter for new line)" : "You don't have permission to send messages"}
              rows={3}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent resize-none text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={sending || !canSendMessages}
            />
            <button
              type="submit"
              disabled={!replyText.trim() || sending || !canSendMessages}
              className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 h-fit"
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

          {/* Quick Reply Button - Only show if user can send messages */}
          {canSendMessages && (
            <div className="relative">
              <CannedResponsePicker
                businessId={businessId}
                onSelect={(content) => setReplyText(content)}
              />
            </div>
          )}

          {canSendMessages && (
            <p className="text-xs text-gray-500 dark:text-slate-400">
              💡 Tip: Press Enter to send, Shift+Enter for new line
            </p>
          )}
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
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-slate-700 flex items-center justify-center">
                <Archive className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Archive Conversation</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">Move to archives</p>
              </div>
            </div>

            <p className="text-gray-700 dark:text-slate-300 mb-6">
              Are you sure you want to archive this conversation? You can find it later in the Archives section organized by date.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowArchiveModal(false)}
                disabled={archiving}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveConversation}
                disabled={archiving}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
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

      {/* Resolve Confirmation Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-slate-700 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resolve Conversation</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">Mark as resolved</p>
              </div>
            </div>

            <p className="text-gray-700 dark:text-slate-300 mb-6">
              Are you sure you want to mark this conversation as resolved? You can find it later in the Resolved section of Archives organized by date.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowResolveModal(false)}
                disabled={resolving}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveConversation}
                disabled={resolving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {resolving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Resolving...</span>
                  </>
                ) : (
                  <span>Resolve</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-slate-700 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Conversation</h3>
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
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
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
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <StickyNote className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notes</h3>
                <p className="text-sm text-gray-500">Add personal notes about this customer</p>
              </div>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Type your notes here..."
              className="w-full h-64 p-4 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-purple-500 focus:border-transparent resize-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400"
            />

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setNotes(conversation.notes || '');
                  setShowNotesModal(false);
                }}
                disabled={savingNotes}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
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
        <>
          {console.log('🔍 [MessageThread] Current Business:', currentBusiness)}
          {console.log('🔍 [MessageThread] Profile Categories:', currentBusiness?.profile_categories)}
          <CustomerProfileModal
            conversationId={conversation.id}
            customerName={displayName}
            customerEmail={conversation.customer_email}
            customerInstagram={conversation.customer_instagram_id}
            aiInsightsEnabled={currentBusiness?.auto_generate_notes || false}
            profileCategories={currentBusiness?.profile_categories}
            onClose={() => setShowProfileModal(false)}
          />
        </>
      )}
    </div>
  );
}
