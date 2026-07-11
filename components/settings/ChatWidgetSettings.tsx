'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Copy, Check, Loader2, Save, Lock, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/api/supabase';

type EmbedPlatform = 'webflow' | 'wordpress' | 'shopify' | 'wix' | 'squarespace' | 'other';
type ChatAutoReplyMode = 'always' | 'same_as_email' | 'off';

interface ChatWidgetSettingsProps {
  businessId: string;
  subscriptionTier: string;
}

interface WidgetSettings {
  widget_key: string | null;
  widget_enabled: boolean;
  widget_color: string;
  widget_greeting: string;
  chat_auto_reply_mode: ChatAutoReplyMode;
}

export default function ChatWidgetSettings({ businessId, subscriptionTier }: ChatWidgetSettingsProps) {
  const isPro = subscriptionTier === 'pro';
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [platform, setPlatform] = useState<EmbedPlatform>('webflow');
  const [savingMode, setSavingMode] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('businesses')
        .select('widget_key, widget_enabled, widget_color, widget_greeting, chat_auto_reply_mode')
        .eq('id', businessId)
        .single();

      if (data) {
        setSettings({
          widget_key: data.widget_key,
          widget_enabled: !!data.widget_enabled,
          widget_color: data.widget_color || '#7c3aed',
          widget_greeting: data.widget_greeting || '',
          chat_auto_reply_mode: (data.chat_auto_reply_mode as ChatAutoReplyMode) || 'always',
        });
      }
      setLoading(false);
    }
    load();
  }, [businessId]);

  async function handleToggle() {
    if (!settings || toggling) return;
    setToggling(true);
    setError('');

    const enabled = !settings.widget_enabled;
    const { error: updateError } = await supabase
      .from('businesses')
      .update({ widget_enabled: enabled })
      .eq('id', businessId);

    if (updateError) {
      setError('Failed to update widget status');
    } else {
      setSettings({ ...settings, widget_enabled: enabled });
    }
    setToggling(false);
  }

  async function handleRegenerateKey() {
    if (!settings || regenerating) return;
    // Two-step confirm: regenerating kills every existing embed
    if (!confirmRegen) {
      setConfirmRegen(true);
      setTimeout(() => setConfirmRegen(false), 5000);
      return;
    }
    setConfirmRegen(false);
    setRegenerating(true);
    setError('');

    const newKey = crypto.randomUUID();
    const { error: updateError } = await supabase
      .from('businesses')
      .update({ widget_key: newKey })
      .eq('id', businessId);

    if (updateError) {
      setError('Failed to regenerate the widget key');
    } else {
      setSettings({ ...settings, widget_key: newKey });
    }
    setRegenerating(false);
  }

  async function handleAutoReplyMode(mode: ChatAutoReplyMode) {
    if (!settings || savingMode || settings.chat_auto_reply_mode === mode) return;
    setSavingMode(true);
    setError('');

    const { error: updateError } = await supabase
      .from('businesses')
      .update({ chat_auto_reply_mode: mode })
      .eq('id', businessId);

    if (updateError) {
      setError('Failed to update AI auto-reply mode');
    } else {
      setSettings({ ...settings, chat_auto_reply_mode: mode });
    }
    setSavingMode(false);
  }

  async function handleSave() {
    if (!settings || saving) return;
    setSaving(true);
    setError('');

    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        widget_color: settings.widget_color,
        widget_greeting: settings.widget_greeting.trim() || null,
      })
      .eq('id', businessId);

    if (updateError) {
      setError('Failed to save widget settings');
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  const embedSnippet = settings?.widget_key
    ? `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" data-key="${settings.widget_key}" async></script>`
    : '';

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(embedSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy — select and copy the snippet manually');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-5 h-5 text-violet-500" />
          <span className="text-sm text-gray-500 dark:text-slate-400">Loading chat widget settings...</span>
        </div>
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!settings) return null;

  // Live chat is a Pro feature — the widget API refuses non-pro businesses,
  // so show the upgrade path instead of controls that silently do nothing.
  if (!isPro) {
    return (
      <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900 dark:text-white">Website Chat Widget</h3>
                <span className="flex items-center gap-1 px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium rounded-full">
                  <Lock className="w-3 h-3" />
                  Pro
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Live chat bubble for your website, answered from this inbox
              </p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 transition-colors"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900 dark:text-white">Website Chat Widget</h3>
              {settings.widget_enabled ? (
                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                  Active
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs font-medium rounded-full">
                  Off
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Live chat bubble for your website, answered from this inbox
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
            settings.widget_enabled
              ? 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              : 'bg-violet-600 text-white hover:bg-violet-700'
          }`}
        >
          {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> : settings.widget_enabled ? 'Disable' : 'Enable'}
        </button>
      </div>

      {error && <p className="px-4 pb-3 text-sm text-red-500">{error}</p>}

      {/* Expanded config when enabled */}
      {settings.widget_enabled && (
        <div className="border-t border-gray-200 dark:border-slate-700 p-4 space-y-4 bg-gray-50 dark:bg-slate-800/50">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Greeting message
              </label>
              <input
                type="text"
                value={settings.widget_greeting}
                onChange={e => setSettings({ ...settings, widget_greeting: e.target.value })}
                placeholder="Hi! How can we help you today?"
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Accent color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={settings.widget_color}
                  onChange={e => setSettings({ ...settings, widget_color: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-300 dark:border-slate-600 cursor-pointer bg-transparent"
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : saved ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saved ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI auto-reply mode — chat is separate from the email schedule */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              AI auto-reply in chat
            </label>
            <div className="flex items-center flex-wrap gap-1 mb-1.5">
              {([
                ['always', 'Always on'],
                ['same_as_email', 'Follow email schedule'],
                ['off', 'Off'],
              ] as [ChatAutoReplyMode, string][]).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => handleAutoReplyMode(mode)}
                  disabled={savingMode}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors disabled:opacity-60 ${
                    settings.chat_auto_reply_mode === mode
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {label}
                  {mode === 'always' && ' (recommended)'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {settings.chat_auto_reply_mode === 'always' &&
                'The AI answers every chat message instantly. Your team can jump in from the inbox anytime.'}
              {settings.chat_auto_reply_mode === 'same_as_email' &&
                'The AI answers chats only when your email auto-reply schedule is active.'}
              {settings.chat_auto_reply_mode === 'off' &&
                'Chats wait for a human reply from the inbox — visitors expect answers within seconds, so keep an eye on it.'}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                Embed code
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRegenerateKey}
                  disabled={regenerating}
                  className={`flex items-center space-x-1 text-xs font-medium hover:underline disabled:opacity-50 ${
                    confirmRegen ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-slate-400'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
                  <span>{confirmRegen ? 'Existing embeds will break — confirm?' : 'Regenerate key'}</span>
                </button>
                <a
                  href={`/widget-test.html?key=${settings.widget_key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
                >
                  <span>Preview your widget</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
              Copy this snippet, then follow the steps below for your website platform.
            </p>
            <div className="flex items-stretch gap-2">
              <code className="flex-1 px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-xs font-mono text-gray-800 dark:text-slate-200 overflow-x-auto whitespace-nowrap">
                {embedSnippet}
              </code>
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 px-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Where to paste it, per platform */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Where do I paste it?
            </label>
            <div className="flex items-center flex-wrap gap-1 mb-2">
              {([
                ['webflow', 'Webflow'],
                ['wordpress', 'WordPress'],
                ['shopify', 'Shopify'],
                ['wix', 'Wix'],
                ['squarespace', 'Squarespace'],
                ['other', 'Other / HTML'],
              ] as [EmbedPlatform, string][]).map(([p, label]) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    platform === p
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-600 dark:text-slate-300">
              {platform === 'webflow' && (
                <>
                  <li>In Webflow, open <span className="font-medium">Site settings &rarr; Custom code</span> (requires a paid site plan)</li>
                  <li>Paste the snippet into the <span className="font-medium">Footer code</span> box</li>
                  <li>Click <span className="font-medium">Save changes</span>, then <span className="font-medium">Publish</span> your site</li>
                  <li>Visit your published site &mdash; the chat bubble appears in the bottom-right corner</li>
                </>
              )}
              {platform === 'wordpress' && (
                <>
                  <li>In your WordPress admin, go to <span className="font-medium">Plugins &rarr; Add New</span> and install the free <span className="font-medium">WPCode</span> plugin</li>
                  <li>Open <span className="font-medium">Code Snippets &rarr; Header &amp; Footer</span></li>
                  <li>Paste the snippet into the <span className="font-medium">Footer</span> box and click Save</li>
                  <li>Visit your site &mdash; the chat bubble appears in the bottom-right corner</li>
                </>
              )}
              {platform === 'shopify' && (
                <>
                  <li>In your Shopify admin, go to <span className="font-medium">Online Store &rarr; Themes</span></li>
                  <li>Click <span className="font-medium">&hellip; &rarr; Edit code</span> on your current theme</li>
                  <li>Open <span className="font-medium">layout/theme.liquid</span> and paste the snippet just above the <code className="font-mono text-xs">&lt;/body&gt;</code> line near the bottom</li>
                  <li>Click Save &mdash; the bubble appears on every page of your store</li>
                </>
              )}
              {platform === 'wix' && (
                <>
                  <li>In your Wix dashboard, go to <span className="font-medium">Settings &rarr; Custom Code</span></li>
                  <li>Click <span className="font-medium">+ Add Custom Code</span> and paste the snippet</li>
                  <li>Set <span className="font-medium">Place Code in: Body &ndash; End</span> and apply to <span className="font-medium">All pages</span></li>
                  <li>Click Apply (custom code requires a paid Wix plan with a connected domain)</li>
                </>
              )}
              {platform === 'squarespace' && (
                <>
                  <li>In Squarespace, go to <span className="font-medium">Settings &rarr; Advanced &rarr; Code Injection</span></li>
                  <li>Paste the snippet into the <span className="font-medium">Footer</span> box</li>
                  <li>Click Save (Code Injection requires the Business plan or higher)</li>
                </>
              )}
              {platform === 'other' && (
                <>
                  <li>Open the HTML of your website &mdash; if your site has a shared layout or footer file, use that so the widget loads on every page</li>
                  <li>Paste the snippet just before the closing <code className="font-mono text-xs">&lt;/body&gt;</code> tag</li>
                  <li>Save and reload your site &mdash; the chat bubble appears in the bottom-right corner</li>
                </>
              )}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
