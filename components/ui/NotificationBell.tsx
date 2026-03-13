'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, AlertTriangle, Star, Check, X } from 'lucide-react';
import { supabase } from '@/lib/api/supabase';
import type { Notification } from '@/lib/api/supabase';
import { useAuth } from '@/lib/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const { currentBusiness: business } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!business?.id) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.read).length);
    }
  }, [business?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!business?.id) return;

    const channel = supabase
      .channel(`notifications-${business.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `business_id=eq.${business.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev].slice(0, 20));
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [business?.id]);

  // Close panel on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function markAllRead() {
    if (!business?.id) return;

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('business_id', business.id)
      .eq('read', false);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function markRead(id: string) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.read) {
      markRead(notification.id);
    }
    if (notification.conversation_id) {
      router.push(`/dashboard/inbox?conversation=${notification.conversation_id}`);
    }
    setOpen(false);
  }

  const hasUrgent = notifications.some((n) => !n.read && n.type === 'urgent');

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className={`w-5 h-5 ${hasUrgent ? 'text-red-500 animate-pulse' : ''}`} />

        {/* Badge */}
        {unreadCount > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1 ${
              hasUrgent ? 'bg-red-500' : 'bg-indigo-500'
            }`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-50 max-h-[28rem] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-slate-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No notifications yet</p>
                <p className="text-xs mt-1">AI-flagged emails will appear here</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                    !notification.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${
                        notification.type === 'urgent'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {notification.type === 'urgent' ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <Star className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            notification.type === 'urgent' ? 'bg-red-500' : 'bg-indigo-500'
                          }`} />
                        )}
                      </div>
                      {notification.summary && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {notification.summary}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
