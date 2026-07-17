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
import { playNotificationSound } from '@/lib/notification-sound';
import { MessageSquare, Clock, Mail } from 'lucide-react';

interface EmailConnection {
  id: string;
  platform_user_id: string;
  metadata: { label?: string } | null;
}

const PANEL_MIN_WIDTH = 68;
const PANEL_MAX_WIDTH = 480;
const PANEL_DEFAULT_WIDTH = 320;
const PANEL_COLLAPSED_THRESHOLD = 100;
const PANEL_STORAGE_KEY = 'inbox-panel-width';

function InboxContent() {
  const { currentBusiness: business, user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priorityMap, setPriorityMap] = useState<Record<string, 'urgent' | 'important'>>({});
  const [emailConnections, setEmailConnections] = useState<EmailConnection[]>([]);
  const [selectedEmailAddresses, setSelectedEmailAddresses] = useState<Set<string>>(new Set());
  const hasLoadedRef = useRef(false);
  const emailConnectionsLoadedRef = useRef(false);
  // Snapshot of unread_count per conversation from the previous poll, used to
  // detect newly-arrived incoming customer messages and chime for them.
  const prevUnreadRef = useRef<Map<string, number> | null>(null);

  // Resizable panel state
  const [panelWidth, setPanelWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PANEL_STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= PANEL_MIN_WIDTH && parsed <= PANEL_MAX_WIDTH) {
          return parsed;
        }
      }
    }
    return PANEL_DEFAULT_WIDTH;
  });
  const isResizingRef = useRef(false);

  // Persist panel width to localStorage
  useEffect(() => {
    localStorage.setItem(PANEL_STORAGE_KEY, String(panelWidth));
  }, [panelWidth]);

  // Drag handle handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      // Get the left edge of the panel container
      const container = document.getElementById('inbox-panel-container');
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      const clamped = Math.max(PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, newWidth));
      setPanelWidth(clamped);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const isCollapsed = panelWidth < PANEL_COLLAPSED_THRESHOLD;

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

      // Chime when a new incoming customer message arrives. Inbound customer
      // messages raise a conversation's unread_count; our own and AI replies
      // don't — so an increase (or a brand-new unread conversation) means a
      // customer just wrote in. Skipped on the first load (baseline only) so
      // we never chime on page open.
      const prevUnread = prevUnreadRef.current;
      if (prevUnread) {
        const hasNewIncoming = sortedConvos.some(
          c => c.unread_count > (prevUnread.get(c.id) ?? 0)
        );
        if (hasNewIncoming) {
          playNotificationSound();
        }
      }
      prevUnreadRef.current = new Map(sortedConvos.map(c => [c.id, c.unread_count] as [string, number]));

      // Fetch priority flags from unread notifications
      const { data: notifications } = await supabase
        .from('notifications')
        .select('conversation_id, type')
        .eq('business_id', business.id)
        .eq('read', false);

      if (notifications) {
        const pMap: Record<string, 'urgent' | 'important'> = {};
        for (const n of notifications) {
          if (n.conversation_id) {
            // Urgent takes precedence over important
            if (!pMap[n.conversation_id] || n.type === 'urgent') {
              pMap[n.conversation_id] = n.type as 'urgent' | 'important';
            }
          }
        }
        setPriorityMap(pMap);
      }

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

  // Fetch email connections once
  useEffect(() => {
    if (!business || emailConnectionsLoadedRef.current) return;
    emailConnectionsLoadedRef.current = true;

    fetch(`/api/email-connections?businessId=${business.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.connections) {
          setEmailConnections(data.connections);
          setSelectedEmailAddresses(new Set(data.connections.map((c: EmailConnection) => c.platform_user_id)));
        }
      })
      .catch(() => {});
  }, [business]);

  function handleToggleEmailFilter(email: string) {
    setSelectedEmailAddresses(prev => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  }

  function handleToggleAllEmailFilters() {
    setSelectedEmailAddresses(prev => {
      if (prev.size === emailConnections.length) {
        return new Set();
      }
      return new Set(emailConnections.map(c => c.platform_user_id));
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

  // Filter conversations by selected email addresses (non-email channels always show)
  const filteredByEmail = emailConnections.length > 0
    ? conversations.filter(c => {
        if (c.channel !== 'email') return true;
        if (!c.channel_address) return true;
        return selectedEmailAddresses.has(c.channel_address);
      })
    : conversations;

  // Calculate stats
  const totalConversations = filteredByEmail.length;
  const openConversations = filteredByEmail.filter(c => c.status === 'open').length;
  const unreadConversations = filteredByEmail.filter(c => c.unread_count > 0).length;

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
        <div id="inbox-panel-container" className="flex flex-1 overflow-hidden">
        <div
          className="border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0 hidden md:block"
          style={{ width: panelWidth }}
        >
          <ConversationList
            conversations={filteredByEmail}
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
            onBulkArchive={handleBulkArchive}
            onBulkDelete={handleBulkDelete}
            collapsed={isCollapsed}
            priorityMap={priorityMap}
            emailConnections={emailConnections}
            selectedEmailAddresses={selectedEmailAddresses}
            onToggleEmailFilter={handleToggleEmailFilter}
            onToggleAllEmailFilters={handleToggleAllEmailFilters}
          />
        </div>

        {/* Drag Handle */}
        <div
          className="hidden md:flex w-1 cursor-col-resize items-center justify-center hover:bg-indigo-300 dark:hover:bg-indigo-600 bg-gray-200 dark:bg-slate-700 transition-colors flex-shrink-0"
          onMouseDown={handleMouseDown}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize conversation list"
        />

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
