'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ConversationList from '@/components/inbox/ConversationList';
import MessageThread from '@/components/inbox/MessageThread';
import { getConversations } from '@/lib/api/conversations';
import { supabase } from '@/lib/api/supabase';
import { useAuth } from '@/lib/context/AuthContext';
import type { Conversation } from '@/lib/api/supabase';

export default function InboxPage() {
  const { business } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (business) {
      loadConversations();

      // Subscribe to conversation updates
      const channel = supabase
        .channel('conversations-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'conversations',
            filter: `business_id=eq.${business.id}`,
          },
          (payload) => {
            console.log('🔄 Conversation updated:', payload);
            // Immediately update the conversation in state
            setConversations(prev => {
              const updated = prev.map(c =>
                c.id === payload.new.id ? payload.new as Conversation : c
              );
              // Re-sort by last_message_at
              return updated.sort((a, b) =>
                new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
              );
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [business]);

  async function loadConversations() {
    if (!business) return;

    try {
      const convos = await getConversations(business.id);

      // Sort by last_message_at (newest first)
      const sortedConvos = convos.sort((a, b) =>
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );

      setConversations(sortedConvos);

      // If this is the first load and we have conversations, select the first one
      if (sortedConvos.length > 0 && !selectedConversation) {
        setSelectedConversation(sortedConvos[0]);
      }

      // If selected conversation was updated, refresh it
      if (selectedConversation) {
        const updatedSelected = sortedConvos.find(c => c.id === selectedConversation.id);
        if (updatedSelected) {
          setSelectedConversation(updatedSelected);
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !business) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading inbox...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-full bg-gray-50">
        {/* Conversation List - Left Panel */}
        <div className="w-80 border-r border-gray-200 bg-white flex-shrink-0 hidden md:block">
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
          />
        </div>

        {/* Message Thread - Right Panel */}
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
