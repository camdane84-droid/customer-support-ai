'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingScreen from '@/components/LoadingScreen';
import DashboardSkeleton from '@/components/inbox/DashboardSkeleton';
import { getConversations } from '@/lib/api/conversations';
import { supabase } from '@/lib/api/supabase';
import { useAuth } from '@/lib/context/AuthContext';
import type { Conversation } from '@/lib/api/supabase';
import { MessageSquare, Clock, TrendingUp, Zap, ArrowRight, Mail, Instagram, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getCustomerDisplayName, getCustomerInitials } from '@/lib/utils/customerDisplay';

export default function DashboardPage() {
  const { business, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Define loadData before useEffect that uses it
  const loadData = useCallback(async () => {
    if (!business) return;

    try {
      const convos = await getConversations(business.id);
      // Sort by most recent
      const sorted = convos.sort((a, b) =>
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
      setConversations(sorted);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [business]);

  useEffect(() => {
    if (business) {
      loadData();

      // Set up polling for live updates
      const pollInterval = setInterval(() => {
        // Only poll if tab is visible
        if (!document.hidden) {
          console.log('🔄 Dashboard: Polling for updates...');
          loadData();
        }
      }, 1000); // Poll every 1 second

      // Return cleanup function
      return () => {
        clearInterval(pollInterval);
        console.log('🔌 Dashboard: Stopped polling');
      };
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [business, authLoading, loadData]);

  function setupRealtimeSubscription() {
    if (!business) return;

    console.log('🔌 Dashboard: Setting up realtime subscription for business:', business.id);

    const channel = supabase
      .channel(`dashboard-${business.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          console.log('🔄 Dashboard: Conversation changed via realtime:', payload.eventType);
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
          console.log('💬 Dashboard: New message received via realtime');
          handleNewMessage(payload);
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Dashboard subscription status:', status);
        if (err) {
          console.error('❌ Dashboard subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Dashboard successfully subscribed to realtime updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error - realtime may not be enabled on Supabase');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Dashboard subscription timed out');
        }
      });

    return () => {
      console.log('🔌 Cleaning up dashboard subscription');
      supabase.removeChannel(channel);
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
  }

  function handleNewMessage(payload: any) {
    const message = payload.new;
    const conversationId = message.conversation_id;

    // Reload the specific conversation to get updated info
    supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()
      .then(({ data: updatedConversation }) => {
        if (updatedConversation) {
          setConversations(prev => {
            const exists = prev.some(c => c.id === conversationId);

            if (exists) {
              return prev
                .map(c => c.id === conversationId ? updatedConversation as Conversation : c)
                .sort((a, b) =>
                  new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
                );
            } else {
              return [updatedConversation as Conversation, ...prev].sort((a, b) =>
                new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
              );
            }
          });
        }
      });
  }

  // Navigate to inbox with specific conversation selected
  function handleConversationClick(conversation: Conversation) {
    const displayName = getCustomerDisplayName(conversation);
    console.log('📍 Dashboard: Clicked conversation:', displayName, 'ID:', conversation.id);
    router.push(`/dashboard/inbox?conversation=${conversation.id}`);
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="w-3.5 h-3.5" />;
      case 'instagram': return <Instagram className="w-3.5 h-3.5" />;
      case 'sms': return <Phone className="w-3.5 h-3.5" />;
      default: return <Mail className="w-3.5 h-3.5" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email': return 'bg-blue-100 dark:bg-blue-900/30 text-indigo-600 dark:text-indigo-400';
      case 'instagram': return 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400';
      case 'sms': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
    }
  };

  if (authLoading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  // Show loading spinner while auth is initializing
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state if auth completed but no business found
  if (!business) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Unable to Load Business Data</h2>
            <p className="text-gray-600 dark:text-slate-300 mb-4">
              We couldn't find your business account.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalConversations = conversations.length;
  const openConversations = conversations.filter(c => c.status === 'open').length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Welcome back to {business.name}! Here's what's happening with your customer support.
          </p>
        </div>

        {/* Welcome Banner for New Users */}
        {totalConversations === 0 && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to {business.name}! 🎉</h2>
            <p className="mb-4">Get started by testing your inbox with simulated messages.</p>
            <div className="flex space-x-3">
              <Link
                href="/test-email"
                className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                Test Email Feature
              </Link>
              <Link
                href="/dashboard/inbox"
                className="px-4 py-2 bg-indigo-600 border-2 border-white text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Go to Inbox
              </Link>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-300">Total Conversations</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalConversations}</p>
              </div>
              <MessageSquare className="w-10 h-10 text-indigo-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-300">Open Conversations</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{openConversations}</p>
              </div>
              <Clock className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-300">Response Rate</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">100%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/dashboard/inbox"
              className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:bg-slate-900 transition-colors"
            >
              <MessageSquare className="w-8 h-8 text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">View Inbox</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">{openConversations} open</p>
              </div>
            </Link>

            <Link
              href="/dashboard/analytics"
              className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:bg-slate-900 transition-colors"
            >
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">View Analytics</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">Track performance</p>
              </div>
            </Link>

            <Link
              href="/test-email"
              className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:bg-slate-900 transition-colors"
            >
              <Zap className="w-8 h-8 text-orange-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Test Features</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">Simulate emails</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Conversations - NOW CLICKABLE */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Conversations</h2>
            {conversations.length > 0 && (
              <Link
                href="/dashboard/inbox"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
          <div className="divide-y divide-gray-200">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-slate-400">
                No conversations yet
              </div>
            ) : (
              conversations.slice(0, 5).map((convo) => {
                const displayName = getCustomerDisplayName(convo);
                const initials = getCustomerInitials(displayName);

                return (
                <button
                  key={convo.id}
                  onClick={() => handleConversationClick(convo)}
                  className="w-full p-6 hover:bg-gray-50 dark:bg-slate-900 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">
                          {initials}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {displayName}
                          </p>
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded ${getChannelColor(convo.channel)}`}>
                            {getChannelIcon(convo.channel)}
                          </span>
                          {convo.unread_count > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-indigo-600 text-white text-xs font-medium rounded-full">
                              {convo.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                          {convo.customer_email || convo.customer_phone || `via ${convo.channel}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className={`
                          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${convo.status === 'open' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'}
                        `}>
                          {convo.status}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                          {formatDistanceToNow(new Date(convo.last_message_at), { addSuffix: true })}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 dark:text-slate-400 transition-colors" />
                    </div>
                  </div>
                </button>
              );
              })
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
