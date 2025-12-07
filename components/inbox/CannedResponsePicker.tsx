'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Search, TrendingUp } from 'lucide-react';
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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Quick Replies</span>
      </button>
    );
  }

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900">Quick Replies</h3>
          <button
            onClick={() => {
              setIsOpen(false);
              setSearch('');
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quick replies..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      </div>

      {/* Responses List */}
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
        ) : filteredResponses.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {search ? 'No matching quick replies' : 'No quick replies yet'}
          </div>
        ) : (
          filteredResponses.map((response) => (
            <button
              key={response.id}
              onClick={() => handleSelect(response)}
              className="w-full p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
            >
              <div className="flex items-start justify-between mb-1">
                <span className="font-medium text-sm text-gray-900">{response.title}</span>
                {response.usage_count > 0 && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <TrendingUp className="w-3 h-3" />
                    <span>{response.usage_count}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{response.content}</p>
              {response.shortcut && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                  {response.shortcut}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
