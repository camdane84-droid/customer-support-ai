'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, X, Sparkles, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/api/supabase';
import { playNotificationSound } from '@/lib/notification-sound';

/**
 * Chat UI rendered inside the widget iframe on customer websites.
 * Deliberately uses explicit light colors (no dark: variants) — the app's
 * root layout defaults to dark mode, but the widget must look the same on
 * every host site.
 */

interface WidgetConfig {
  businessName: string;
  greeting: string | null;
  color: string;
  aiActive: boolean;
}

interface ChatMessage {
  id: string;
  content: string;
  sender_type: 'customer' | 'business' | 'ai';
  sender_name: string | null;
  created_at: string;
}

// Fast polling until the realtime channel confirms, then it's just a safety net
const POLL_INTERVAL_MS = 3000;
const POLL_INTERVAL_REALTIME_MS = 15000;

function storageKey(widgetKey: string) {
  return `inboxforge_chat_session:${widgetKey}`;
}

/** SHA-256 hex — matches the server-side token hash, which names our channel. */
async function sha256Hex(value: string): Promise<string | null> {
  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return null; // non-secure context — polling covers us
  }
}

export default function ChatWidget({ widgetKey }: { widgetKey: string }) {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [configError, setConfigError] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = token;
  const lastCreatedAtRef = useRef<string | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const historyLoadedRef = useRef(false);
  const realtimeUpRef = useRef(false);

  // Load config + any stored session
  useEffect(() => {
    fetch(`/api/widget/config?key=${encodeURIComponent(widgetKey)}`)
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(setConfig)
      .catch(() => setConfigError(true));

    try {
      const stored = localStorage.getItem(storageKey(widgetKey));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed?.token === 'string') setToken(parsed.token);
      }
    } catch {
      // storage unavailable (private mode) — session just won't persist
    }
  }, [widgetKey]);

  const mergeMessages = useCallback((incoming: ChatMessage[]) => {
    if (incoming.length === 0) return;

    // Chime for replies that arrive after the initial history load —
    // never for the visitor's own messages or the backlog
    const unseen = incoming.filter(m => !knownIdsRef.current.has(m.id));
    for (const msg of unseen) knownIdsRef.current.add(msg.id);
    if (historyLoadedRef.current && unseen.some(m => m.sender_type !== 'customer')) {
      playNotificationSound();
    }

    setMessages(prev => {
      const byId = new Map(prev.map(m => [m.id, m]));
      for (const msg of incoming) byId.set(msg.id, msg);
      const merged = [...byId.values()].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      lastCreatedAtRef.current = merged[merged.length - 1]?.created_at ?? null;
      return merged;
    });
  }, []);

  const fetchMessages = useCallback(async (sinceOverride?: string | null) => {
    const currentToken = tokenRef.current;
    if (!currentToken) return;
    const params = new URLSearchParams({ token: currentToken });
    if (sinceOverride) params.set('since', sinceOverride);
    try {
      const res = await fetch(`/api/widget/messages?${params}`);
      if (res.status === 401) {
        // Session revoked (e.g. conversation deleted) — start fresh
        try { localStorage.removeItem(storageKey(widgetKey)); } catch {}
        setToken(null);
        setMessages([]);
        knownIdsRef.current.clear();
        historyLoadedRef.current = false;
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.messages)) mergeMessages(data.messages);
    } catch {
      // Network hiccup — next poll will catch up
    }
  }, [widgetKey, mergeMessages]);

  // Full history on session (re)load, then incremental polling. Polling is
  // the reliability floor; realtime below makes replies instant.
  useEffect(() => {
    if (!token) return;
    fetchMessages(null).then(() => {
      historyLoadedRef.current = true;
    });

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(async () => {
        if (cancelled) return;
        await fetchMessages(lastCreatedAtRef.current);
        if (!cancelled) schedule();
      }, realtimeUpRef.current ? POLL_INTERVAL_REALTIME_MS : POLL_INTERVAL_MS);
    };
    schedule();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [token, fetchMessages]);

  // Realtime: replies are broadcast on a channel named by our token's hash
  useEffect(() => {
    if (!token) return;
    let removed = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    sha256Hex(token).then(hash => {
      if (!hash || removed) return;
      channel = supabase
        .channel(`chat:${hash}`)
        .on('broadcast', { event: 'new-message' }, payload => {
          const msg = payload?.payload?.message;
          if (msg && typeof msg.id === 'string' && typeof msg.content === 'string') {
            mergeMessages([msg as ChatMessage]);
          } else {
            fetchMessages(lastCreatedAtRef.current);
          }
        })
        .subscribe(status => {
          realtimeUpRef.current = status === 'SUBSCRIBED';
        });
    });

    return () => {
      removed = true;
      realtimeUpRef.current = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [token, mergeMessages, fetchMessages]);

  // Keep the newest message in view
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setSendError(null);

    try {
      if (!token) {
        const res = await fetch('/api/widget/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: widgetKey,
            name: visitorName || undefined,
            email: visitorEmail || undefined,
            message: content,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.token) {
          setSendError(data?.error || 'Could not start the chat. Please try again.');
          return;
        }
        try {
          localStorage.setItem(storageKey(widgetKey), JSON.stringify({ token: data.token }));
        } catch {}
        if (data.message) mergeMessages([data.message]);
        setToken(data.token);
      } else {
        const res = await fetch('/api/widget/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, message: content }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setSendError(data?.error || 'Message failed to send. Please try again.');
          return;
        }
        if (data?.message) mergeMessages([data.message]);
      }
      setInput('');
    } catch {
      setSendError('Message failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  }

  function handleClose() {
    window.parent?.postMessage({ type: 'inboxforge:close' }, '*');
  }

  if (configError) {
    return (
      <div className="flex h-screen items-center justify-center bg-white p-6 text-center">
        <p className="text-sm text-gray-500">This chat is currently unavailable.</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const accent = config.color || '#7c3aed';
  const hasSession = !!token;

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 text-white" style={{ backgroundColor: accent }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{config.businessName}</p>
            <p className="text-[11px] text-white/80">
              {config.aiActive ? 'AI assistant is answering now' : "We'll reply as soon as we can"}
            </p>
          </div>
        </div>
        <button
          onClick={handleClose}
          aria-label="Close chat"
          className="rounded-full p-1.5 transition-colors hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4">
        {/* Greeting bubble always leads the thread */}
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-sm text-gray-800 shadow-sm border border-gray-100">
            {config.greeting || `Hi! How can we help you today?`}
          </div>
        </div>

        {messages.map(msg => {
          const isVisitor = msg.sender_type === 'customer';
          const isAi = msg.sender_type === 'ai';
          return (
            <div key={msg.id} className={`flex ${isVisitor ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%]">
                <div
                  className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                    isVisitor
                      ? 'rounded-br-md text-white'
                      : 'rounded-bl-md border border-gray-100 bg-white text-gray-800'
                  }`}
                  style={isVisitor ? { backgroundColor: accent } : undefined}
                >
                  {msg.content}
                </div>
                {!isVisitor && (
                  <p className="mt-1 flex items-center gap-1 px-1 text-[10px] text-gray-400">
                    {isAi && <Sparkles className="h-2.5 w-2.5" style={{ color: accent }} />}
                    {isAi ? 'AI Assistant' : msg.sender_name || config.businessName}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-gray-200 bg-white p-3">
        {!hasSession && (
          <div className="mb-2 grid grid-cols-2 gap-2">
            <input
              type="text"
              value={visitorName}
              onChange={e => setVisitorName(e.target.value)}
              placeholder="Name (optional)"
              maxLength={100}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none"
            />
            <input
              type="email"
              value={visitorEmail}
              onChange={e => setVisitorEmail(e.target.value)}
              placeholder="Email (optional)"
              maxLength={200}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none"
            />
          </div>
        )}

        {sendError && <p className="mb-2 px-1 text-xs text-red-500">{sendError}</p>}

        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            rows={1}
            maxLength={4000}
            className="max-h-28 flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: accent }}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>

        <p className="mt-2 text-center text-[10px] text-gray-300">
          Powered by <span className="font-medium text-gray-400">InboxForge</span>
        </p>
      </div>
    </div>
  );
}
