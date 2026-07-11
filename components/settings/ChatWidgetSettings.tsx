'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Copy, Check, Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/api/supabase';

interface ChatWidgetSettingsProps {
  businessId: string;
}

interface WidgetSettings {
  widget_key: string | null;
  widget_enabled: boolean;
  widget_color: string;
  widget_greeting: string;
}

export default function ChatWidgetSettings({ businessId }: ChatWidgetSettingsProps) {
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('businesses')
        .select('widget_key, widget_enabled, widget_color, widget_greeting')
        .eq('id', businessId)
        .single();

      if (data) {
        setSettings({
          widget_key: data.widget_key,
          widget_enabled: !!data.widget_enabled,
          widget_color: data.widget_color || '#7c3aed',
          widget_greeting: data.widget_greeting || '',
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Embed code
            </label>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
              Paste this snippet before the closing <code className="font-mono">&lt;/body&gt;</code> tag on your website.
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
        </div>
      )}
    </div>
  );
}
