'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingScreen from '@/components/LoadingScreen';
import ConversationListSkeleton from '@/components/inbox/ConversationListSkeleton';
import MessageThreadSkeleton from '@/components/inbox/MessageThreadSkeleton';
import ConversationList from '@/components/inbox/ConversationList';
import MessageThread from '@/components/inbox/MessageThread';
import { getConversations } from '@/lib/api/conversations';
import { supabase } from '@/lib/api/supabase';
import { useAuth } from '@/lib/context/AuthContext';
import type { Conversation } from '@/lib/api/supabase';
import { MessageSquare, Clock, Mail } from 'lucide-react';

function InboxContent() {
  const { currentBusiness: business, user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  console.log('🔍 [INBOX] Component render:', {
    authLoading,
    hasUser: !!user,
    hasBusiness: !!business,
    businessId: business?.id,
    businessName: business?.name,
    conversationsCount: conversations.length,
    loading,
    error,
    hasLoadedRef: hasLoadedRef.current,
  });

  // Define loadConversations before useEffect that uses it
  const loadConversations = useCallback(async (showLoading = true) => {
    console.log('🔄 [INBOX] loadConversations called:', { showLoading, hasBusiness: !!business, businessId: business?.id });

    if (!business) {
      console.log('⏭️ [INBOX] No business, skipping load and setting loading=false');
      setLoading(false);
      return;
    }

    console.log('📥 [INBOX] Loading conversations for business:', business.id);
    if (showLoading) {
      console.log('⏳ [INBOX] Setting loading=true');
      setLoading(true);
    }
    setError(null);

    try {
      console.log('🌐 [INBOX] Fetching conversations from API...');
      const convos = await getConversations(business.id);
      console.log('✅ [INBOX] Loaded conversations:', convos.length);

      const sortedConvos = convos.sort((a, b) =>
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );

      setConversations(sortedConvos);

      // Update selected conversation with fresh data (always, even during polling)
      setSelectedConversation(currentSelected => {
        // During initial load, handle auto-selection
        if (showLoading && sortedConvos.length > 0 && !currentSelected) {
          // Check if there's a pre-selected conversation from URL params
          const preselectedId = searchParams.get('conversation');
          console.log('📍 Inbox: Looking for preselected ID from URL:', preselectedId);
          console.log('📍 Inbox: Available conversations:', sortedConvos.map(c => ({ id: c.id, name: c.customer_name })));
          if (preselectedId) {
            const preselected = sortedConvos.find(c => c.id === preselectedId);
            if (preselected) {
              console.log('✅ Inbox: Found and selecting conversation from dashboard:', preselected.customer_name);

              // Immediately clear unread badge when selecting from dashboard
              if (preselected.unread_count > 0) {
                setConversations(prev =>
                  prev.map(c =>
                    c.id === preselected.id ? { ...c, unread_count: 0 } : c
                  )
                );
              }

              return { ...preselected, unread_count: 0 };
            } else {
              console.log('❌ Inbox: Could not find preselected conversation, selecting first');
              const firstConvo = sortedConvos[0];

              // Clear unread badge for first conversation too
              if (firstConvo.unread_count > 0) {
                setConversations(prev =>
                  prev.map(c =>
                    c.id === firstConvo.id ? { ...c, unread_count: 0 } : c
                  )
                );
              }

              return { ...firstConvo, unread_count: 0 };
            }
          } else {
            console.log('👆 Inbox: No preselected ID, selecting first conversation');
            const firstConvo = sortedConvos[0];

            // Clear unread badge for first conversation
            if (firstConvo.unread_count > 0) {
              setConversations(prev =>
                prev.map(c =>
                  c.id === firstConvo.id ? { ...c, unread_count: 0 } : c
                )
              );
            }

            return { ...firstConvo, unread_count: 0 };
          }
        }

        // Always update selected conversation with fresh data (including unread_count)
        if (currentSelected) {
          const updatedSelected = sortedConvos.find(c => c.id === currentSelected.id);
          if (updatedSelected) {
            return updatedSelected;
          }
        }

        return currentSelected;
      });
    } catch (error: any) {
      console.error('❌ [INBOX] Failed to load conversations:', error);
      setError(error.message || 'Failed to load conversations');
    } finally {
      if (showLoading) {
        console.log('✅ [INBOX] Loading complete, setting loading=false');
        setLoading(false);
      } else {
        console.log('🔄 [INBOX] Polling complete, not changing loading state');
      }
    }
  }, [business]); // Only depend on business - searchParams and selectedConversation accessed via closure/functional updates

  useEffect(() => {
    if (authLoading || !business) {
      if (!authLoading && !business) {
        setLoading(false);
        setError('No business found');
      }
      return;
    }

    // Only show loading spinner on first load
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadConversations(true);
    }

    // Always set up polling (re-creates with latest loadConversations if deps change)
    const pollInterval = setInterval(() => {
      if (!document.hidden) {
        loadConversations(false);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [loadConversations, authLoading]);

  function setupRealtimeSubscription() {
    if (!business) return;

    console.log('🔌 Setting up realtime subscription for business:', business.id);

    const conversationChannel = supabase
      .channel(`business-conversations-${business.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          console.log('🔄 Conversation changed via realtime:', payload.eventType, payload);
          handleConversationUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          console.log('💬 New message received via realtime:', payload);
          handleNewMessage(payload);
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Subscription status:', status);
        if (err) {
          console.error('❌ Subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to realtime updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error - realtime may not be enabled');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Subscription timed out');
        }
      });

    return () => {
      console.log('🔌 Cleaning up subscription');
      supabase.removeChannel(conversationChannel);
    };
  }

  function handleConversationUpdate(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    setConversations(prev => {
      let updated = [...prev];

      if (eventType === 'INSERT') {
        updated = [newRecord as Conversation, ...prev];
      } else if (eventType === 'UPDATE') {
        updated = prev.map(c => c.id === newRecord.id ? newRecord as Conversation : c);
      } else if (eventType === 'DELETE') {
        updated = prev.filter(c => c.id !== oldRecord.id);
      }

      return updated.sort((a, b) =>
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
    });

    // Update selected conversation if it's the one that changed
    if (selectedConversation?.id === newRecord?.id) {
      console.log('📍 Updating selected conversation:', newRecord);
      setSelectedConversation(newRecord as Conversation);
    }
  }

  function handleNewMessage(payload: any) {
    const message = payload.new;
    const conversationId = message.conversation_id;

    console.log('💬 Handling new message for conversation:', conversationId);

    // Reload the specific conversation to get updated last_message_at and unread_count
    supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()
      .then(({ data: updatedConversation }) => {
        if (updatedConversation) {
          setConversations(prev => {
            // Check if conversation exists
            const exists = prev.some(c => c.id === conversationId);

            if (exists) {
              // Update existing conversation and move to top
              const updated = prev
                .map(c => c.id === conversationId ? updatedConversation as Conversation : c)
                .sort((a, b) =>
                  new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
                );
              return updated;
            } else {
              // Add new conversation at the top
              return [updatedConversation as Conversation, ...prev].sort((a, b) =>
                new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
              );
            }
          });

          // Update selected conversation if it's the one that received the message
          if (selectedConversation?.id === conversationId) {
            setSelectedConversation(updatedConversation as Conversation);
          }
        }
      });
  }

  function handleConversationDeleted() {
    // Remove deleted conversation from list
    setConversations(prev => prev.filter(c => c.id !== selectedConversation?.id));

    // Select the first remaining conversation or null
    setConversations(prev => {
      if (prev.length > 0) {
        setSelectedConversation(prev[0]);
      } else {
        setSelectedConversation(null);
      }
      return prev;
    });
  }

  if (authLoading) {
    console.log('⏳ Auth still loading...');
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <div className="text-gray-500 dark:text-slate-400">Loading authentication...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show loading state while auth is initializing
  if (authLoading) {
    console.log('⏳ Auth still loading...');
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error if no business after auth loaded
  if (!business) {
    console.log('❌ No business available');
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-red-600 mb-4 text-4xl">⚠️</div>
            <div className="text-gray-900 font-medium mb-2">Unable to Load Business Data</div>
            <div className="text-gray-500 dark:text-slate-400 text-sm">
              {error || 'Unable to load your business account'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show loading while fetching conversations
  if (loading) {
    console.log('⏳ Loading conversations...');
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <div className="text-gray-500 dark:text-slate-400">Loading inbox...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  console.log('✅ Rendering inbox with', conversations.length, 'conversations');

  // Handle conversation selection with instant unread badge clear
  function handleSelectConversation(conversation: Conversation) {
    // Immediately update the conversation in the list to clear unread badge
    if (conversation.unread_count > 0) {
      setConversations(prev =>
        prev.map(c =>
          c.id === conversation.id ? { ...c, unread_count: 0 } : c
        )
      );
    }

    // Set as selected conversation
    setSelectedConversation({ ...conversation, unread_count: 0 });
  }

  // Bulk archive conversations
  async function handleBulkArchive(conversationIds: string[]) {
    console.log('📦 Archiving conversations:', conversationIds);

    try {
      // Archive each conversation
      await Promise.all(
        conversationIds.map(async (id) => {
          const response = await fetch(`/api/conversations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'archived' }),
          });

          if (!response.ok) {
            throw new Error(`Failed to archive conversation ${id}`);
          }
        })
      );

      // Remove archived conversations from list
      setConversations(prev => prev.filter(c => !conversationIds.includes(c.id)));

      // Clear selection if the selected conversation was archived
      if (selectedConversation && conversationIds.includes(selectedConversation.id)) {
        const remaining = conversations.filter(c => !conversationIds.includes(c.id));
        setSelectedConversation(remaining.length > 0 ? remaining[0] : null);
      }

      console.log('✅ Bulk archive complete');
    } catch (error) {
      console.error('❌ Bulk archive failed:', error);
      alert('Failed to archive conversations');
    }
  }

  // Bulk delete conversations
  async function handleBulkDelete(conversationIds: string[]) {
    console.log('🗑️ Deleting conversations:', conversationIds);

    try {
      // Delete each conversation
      await Promise.all(
        conversationIds.map(async (id) => {
          const response = await fetch(`/api/conversations/${id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error(`Failed to delete conversation ${id}`);
          }
        })
      );

      // Remove deleted conversations from list
      setConversations(prev => prev.filter(c => !conversationIds.includes(c.id)));

      // Clear selection if the selected conversation was deleted
      if (selectedConversation && conversationIds.includes(selectedConversation.id)) {
        const remaining = conversations.filter(c => !conversationIds.includes(c.id));
        setSelectedConversation(remaining.length > 0 ? remaining[0] : null);
      }

      console.log('✅ Bulk delete complete');
    } catch (error) {
      console.error('❌ Bulk delete failed:', error);
      alert('Failed to delete conversations');
    }
  }

  // Calculate stats
  const totalConversations = conversations.length;
  const openConversations = conversations.filter(c => c.status === 'open').length;
  const unreadConversations = conversations.filter(c => c.unread_count > 0).length;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900">
        {/* Compact Stats Bar */}
        <div className="flex items-center justify-start gap-6 px-4 py-2 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            <span className="text-gray-500 dark:text-slate-400">Total:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{totalConversations}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-green-500" />
            <span className="text-gray-500 dark:text-slate-400">Open:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{openConversations}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-orange-500" />
            <span className="text-gray-500 dark:text-slate-400">Unread:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{unreadConversations}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0 hidden md:block">
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
            onBulkArchive={handleBulkArchive}
            onBulkDelete={handleBulkDelete}
          />
        </div>

        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <MessageThread
              key={selectedConversation.id}
              conversation={selectedConversation}
              businessId={business.id}
              onConversationDeleted={handleConversationDeleted}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400">
              <div className="text-center">
                <p className="text-lg font-medium">No conversation selected</p>
                <p className="text-sm mt-2">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function InboxPage() {
  return (
    <Suspense fallback={<DashboardLayout><div className="flex items-center justify-center h-full"><p className="text-gray-500">Loading inbox...</p></div></DashboardLayout>}>
      <InboxContent />
    </Suspense>
  );
}
