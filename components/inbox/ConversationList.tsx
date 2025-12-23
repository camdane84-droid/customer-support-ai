'use client';

import { useState } from 'react';
import { Mail, Instagram, Phone, Search, MoreHorizontal, Archive, Trash2, X, Download } from 'lucide-react';
import type { Conversation } from '@/lib/api/supabase';
import { formatDistanceToNow } from 'date-fns';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { getCustomerDisplayName, getCustomerInitials } from '@/lib/utils/customerDisplay';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  onBulkArchive?: (conversationIds: string[]) => Promise<void>;
  onBulkDelete?: (conversationIds: string[]) => Promise<void>;
}

export default function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  onBulkArchive,
  onBulkDelete,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filter conversations based on search
  const filteredConversations = conversations.filter((convo) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const displayName = getCustomerDisplayName(convo);
    return (
      displayName.toLowerCase().includes(query) ||
      convo.customer_name.toLowerCase().includes(query) ||
      convo.customer_email?.toLowerCase().includes(query) ||
      convo.channel.toLowerCase().includes(query)
    );
  });

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      case 'sms':
        return <Phone className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email':
        return 'text-indigo-500';
      case 'instagram':
        return 'text-pink-500';
      case 'sms':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  function toggleSelectionMode() {
    setSelectionMode(!selectionMode);
    setSelectedIds(new Set());
  }

  function toggleConversationSelection(conversationId: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(conversationId)) {
      newSelected.delete(conversationId);
    } else {
      newSelected.add(conversationId);
    }
    setSelectedIds(newSelected);
  }

  async function handleExportCSV() {
    try {
      // Get business_id from conversations
      const businessId = conversations[0]?.business_id;
      if (!businessId) {
        alert('No conversations to export');
        return;
      }

      console.log('Starting CSV export for business:', businessId);
      const response = await fetch(`/api/conversations/export?business_id=${businessId}`);

      console.log('Export response status:', response.status);
      console.log('Export response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Try to get error details
        const contentType = response.headers.get('content-type');
        console.log('Error response content-type:', contentType);

        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('Export error details:', errorData);
          alert(`Export failed (${response.status}): ${errorData.details || errorData.error || 'Unknown error'}`);
        } else {
          const textError = await response.text();
          console.error('Export error (non-JSON):', textError);
          alert(`Export failed (${response.status}). Check console for details.`);
        }
        return;
      }

      // Create a blob from the response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversations-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export conversations. Please try again.');
    }
  }

  async function handleBulkArchive() {
    if (selectedIds.size === 0 || !onBulkArchive) return;
    setShowArchiveConfirm(true);
  }

  async function confirmBulkArchive() {
    if (onBulkArchive) {
      await onBulkArchive(Array.from(selectedIds));
      setSelectedIds(new Set());
      setSelectionMode(false);
    }
    setShowArchiveConfirm(false);
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0 || !onBulkDelete) return;
    setShowDeleteConfirm(true);
  }

  async function confirmBulkDelete() {
    if (onBulkDelete) {
      await onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      setSelectionMode(false);
    }
    setShowDeleteConfirm(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Inbox</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {selectionMode && selectedIds.size > 0
                ? `${selectedIds.size} selected`
                : `${filteredConversations.length} ${filteredConversations.length === 1 ? 'conversation' : 'conversations'}`
              }
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="p-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Export to CSV"
              aria-label="Export conversations to CSV"
            >
              <Download className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              onClick={toggleSelectionMode}
              className="p-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Bulk actions"
              aria-label="Toggle bulk actions"
            >
              {selectionMode ? <X className="w-5 h-5" aria-hidden="true" /> : <MoreHorizontal className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Bulk Action Buttons */}
        {selectionMode && selectedIds.size > 0 && (
          <div className="flex items-center space-x-2 mt-3">
            <button
              onClick={handleBulkArchive}
              className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              <Archive className="w-4 h-4" />
              <span>Archive ({selectedIds.size})</span>
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete ({selectedIds.size})</span>
            </button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Name of customer, date, type of order, keywords..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-slate-500 placeholder:opacity-60"
          />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-xs text-indigo-600 hover:text-indigo-700"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-slate-400 text-sm">
            {searchQuery ? (
              <>
                <p>No conversations match "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-indigo-600 hover:text-indigo-700 underline"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <p>No conversations yet</p>
                <p className="text-xs mt-2">New messages will appear here</p>
              </>
            )}
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const isSelected = selectedConversation?.id === conversation.id;
            const isChecked = selectedIds.has(conversation.id);
            const displayName = getCustomerDisplayName(conversation);
            const initials = getCustomerInitials(displayName);

            return (
              <button
                key={conversation.id}
                onClick={() => {
                  if (selectionMode) {
                    toggleConversationSelection(conversation.id);
                  } else {
                    onSelectConversation(conversation);
                  }
                }}
                className={`
                  w-full p-4 border-b border-gray-200 dark:border-slate-700 text-left transition-all
                  ${isSelected && !selectionMode
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-l-indigo-500'
                    : 'bg-white dark:bg-slate-800 border-l-4 border-l-transparent hover:bg-gray-50 dark:hover:bg-slate-700'
                  }
                `}
              >
                <div className="flex items-start space-x-3">
                  {/* Selection Checkbox */}
                  {selectionMode && (
                    <div className="flex items-center pt-2">
                      <div
                        className={`
                          w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                          ${isChecked
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'border-gray-300'
                          }
                        `}
                      >
                        {isChecked && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Avatar */}
                  <div className={`
                    w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0
                    ${isSelected && !selectionMode
                      ? 'bg-gradient-to-br from-indigo-600 to-amber-500'
                      : 'bg-gradient-to-br from-indigo-500 to-amber-400'
                    }
                  `}>
                    <span className="text-white font-semibold text-sm">
                      {initials}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <p className={`text-sm font-semibold truncate ${isSelected && !selectionMode ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-900 dark:text-white'}`}>
                        {displayName}
                      </p>
                      {!selectionMode && (
                        <span className="text-xs text-gray-500 dark:text-slate-400 flex-shrink-0 ml-2">
                          {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={getChannelColor(conversation.channel)}>
                          {getChannelIcon(conversation.channel)}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-slate-300 capitalize font-medium">
                          {conversation.channel}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {conversation.unread_count > 0 && (
                          <span className="bg-indigo-500 text-white text-xs font-medium rounded-full px-2 py-0.5">
                            {conversation.unread_count}
                          </span>
                        )}
                        <span className={`
                          text-xs px-2 py-0.5 rounded-full font-medium
                          ${conversation.status === 'open'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                          }
                        `}>
                          {conversation.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={showArchiveConfirm}
        title="Archive Conversations"
        message={`Are you sure you want to archive ${selectedIds.size} conversation${selectedIds.size === 1 ? '' : 's'}? You can view archived conversations later.`}
        confirmText="Archive"
        cancelText="Cancel"
        confirmColor="blue"
        onConfirm={confirmBulkArchive}
        onCancel={() => setShowArchiveConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Conversations"
        message={`Are you sure you want to permanently delete ${selectedIds.size} conversation${selectedIds.size === 1 ? '' : 's'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
