'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Search, TrendingUp, Plus, Save, X } from 'lucide-react';
import { supabase } from '@/lib/api/supabase';

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  shortcut: string | null;
  category: string | null;
  usage_count: number;
}

interface CannedResponsePickerProps {
  businessId: string;
  onSelect: (content: string) => void;
}

export default function CannedResponsePicker({
  businessId,
  onSelect,
}: CannedResponsePickerProps) {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<CannedResponse[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    shortcut: '',
    category: '',
  });

  useEffect(() => {
    loadCannedResponses();
  }, [businessId]);

  useEffect(() => {
    if (search) {
      const filtered = responses.filter(
        (r) =>
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.content.toLowerCase().includes(search.toLowerCase()) ||
          r.shortcut?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredResponses(filtered);
    } else {
      // Show most used first when no search
      setFilteredResponses([...responses].sort((a, b) => b.usage_count - a.usage_count));
    }
  }, [search, responses]);

  async function loadCannedResponses() {
    try {
      const { data, error } = await supabase
        .from('canned_responses')
        .select('*')
        .eq('business_id', businessId)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setResponses(data || []);
      setFilteredResponses(data || []);
    } catch (error) {
      console.error('Failed to load canned responses:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(response: CannedResponse) {
    // Increment usage count
    await supabase
      .from('canned_responses')
      .update({ usage_count: response.usage_count + 1 })
      .eq('id', response.id);

    onSelect(response.content);
    setIsOpen(false);
    setSearch('');
  }

  async function handleCreateNew() {
    if (!formData.title || !formData.content) {
      alert('Title and content are required');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/canned-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          business_id: businessId,
          shortcut: formData.shortcut || null,
          category: formData.category || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create response');

      // Reload responses
      await loadCannedResponses();

      // Reset form
      setFormData({ title: '', content: '', shortcut: '', category: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create response:', error);
      alert('Failed to create quick reply');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Quick Replies</span>
      </button>
    );
  }

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900 dark:text-white">Quick Replies</h3>
          <button
            onClick={() => {
              setIsOpen(false);
              setSearch('');
              setShowCreateForm(false);
            }}
            className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
        {!showCreateForm && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quick replies..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Create Form */}
      {showCreateForm ? (
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Order Confirmation"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
              Message *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Type your response..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 resize-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Shortcut
              </label>
              <input
                type="text"
                value={formData.shortcut}
                onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                placeholder="/order"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Orders"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => {
                setShowCreateForm(false);
                setFormData({ title: '', content: '', shortcut: '', category: '' });
              }}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleCreateNew}
              disabled={saving}
              className="flex items-center space-x-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Responses List */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 dark:text-slate-400 text-sm">Loading...</div>
            ) : filteredResponses.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-slate-400 text-sm">
                {search ? 'No matching quick replies' : 'No quick replies yet'}
              </div>
            ) : (
              filteredResponses.map((response) => (
                <button
                  key={response.id}
                  onClick={() => handleSelect(response)}
                  className="w-full p-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left border-b border-gray-100 dark:border-slate-700 last:border-0"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">{response.title}</span>
                    {response.usage_count > 0 && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-slate-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>{response.usage_count}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-2">{response.content}</p>
                  {response.shortcut && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs rounded">
                      {response.shortcut}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Add New Button */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full p-3 border-t border-gray-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors text-left flex items-center space-x-2 text-indigo-600 dark:text-purple-400 font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Add New</span>
          </button>
        </>
      )}
    </div>
  );
}
