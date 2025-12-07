'use client';

import { useState, useEffect } from 'react';
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

export default function InboxPage() {
  const { business, user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('📊 Inbox Page State:', {
    authLoading,
    hasUser: !!user,
    hasBusiness: !!business,
    businessId: business?.id,
    businessName: business?.name,
    conversationsCount: conversations.length,
    loading,
    error,
  });

  useEffect(() => {
    console.log('🔄 Auth changed:', { user: !!user, business: !!business, authLoading });

    if (!authLoading && business) {
      console.log('✅ Auth ready, loading conversations for business:', business.id);
      loadConversations();
      setupRealtimeSubscription();
    } else if (!authLoading && !business) {
      console.log('❌ No business after auth loaded');
      setLoading(false);
      setError('No business found');
    }
  }, [business, authLoading]);

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
          console.log('🔄 Conversation changed via realtime:', payload.eventType);
          handleConversationUpdate(payload);
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
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

    if (selectedConversation?.id === payload.new?.id) {
      setSelectedConversation(payload.new as Conversation);
    }
  }

  async function loadConversations() {
    if (!business) {
      console.log('⏭️ No business, skipping load');
      return;
    }

    console.log('📥 Loading conversations...');
    setLoading(true);
    setError(null);

    try {
      const convos = await getConversations(business.id);
      console.log('✅ Loaded conversations:', convos.length);

      const sortedConvos = convos.sort((a, b) =>
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );

      setConversations(sortedConvos);

      if (sortedConvos.length > 0 && !selectedConversation) {
        console.log('👆 Selecting first conversation');
        setSelectedConversation(sortedConvos[0]);
      }

      if (selectedConversation) {
        const updatedSelected = sortedConvos.find(c => c.id === selectedConversation.id);
        if (updatedSelected) {
          setSelectedConversation(updatedSelected);
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to load conversations:', error);
      setError(error.message || 'Failed to load conversations');
    } finally {
      console.log('✅ Loading complete');
      setLoading(false);
    }
  }

  if (authLoading) {
    console.log('⏳ Auth still loading...');
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-500">Loading authentication...</div>
          </div>
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
            <div className="text-gray-900 font-medium mb-2">Business Not Found</div>
            <div className="text-gray-500 text-sm">
              {error || 'Unable to load your business account'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-500">Loading inbox...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  console.log('✅ Rendering inbox with', conversations.length, 'conversations');

  return (
    <DashboardLayout>
      <div className="flex h-full bg-gray-50">
        <div className="w-80 border-r border-gray-200 bg-white flex-shrink-0 hidden md:block">
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
          />
        </div>

        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <MessageThread
              conversation={selectedConversation}
              businessId={business.id}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-lg font-medium">No conversation selected</p>
                <p className="text-sm mt-2">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
