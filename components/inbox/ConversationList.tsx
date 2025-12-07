'use client';

import { useState } from 'react';
import { Mail, Instagram, Phone, Search } from 'lucide-react';
import type { Conversation } from '@/lib/api/supabase';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

export default function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search
  const filteredConversations = conversations.filter((convo) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
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
        return 'text-blue-500';
      case 'instagram':
        return 'text-pink-500';
      case 'sms':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Inbox</h2>
        <p className="text-sm text-gray-500 mt-1">
          {filteredConversations.length} {filteredConversations.length === 1 ? 'conversation' : 'conversations'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-gray-200 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            {searchQuery ? (
              <>
                <p>No conversations match "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-blue-600 hover:text-blue-700 underline"
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
            return (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`
                  w-full p-4 border-b border-gray-200 text-left transition-all
                  ${isSelected
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : 'bg-white border-l-4 border-l-transparent hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className={`
                    w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0
                    ${isSelected
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                      : 'bg-gradient-to-br from-blue-400 to-purple-500'
                    }
                  `}>
                    <span className="text-white font-semibold text-sm">
                      {conversation.customer_name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <p className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {conversation.customer_name}
                      </p>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={getChannelColor(conversation.channel)}>
                          {getChannelIcon(conversation.channel)}
                        </span>
                        <span className="text-xs text-gray-600 capitalize font-medium">
                          {conversation.channel}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {conversation.unread_count > 0 && (
                          <span className="bg-blue-500 text-white text-xs font-medium rounded-full px-2 py-0.5">
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
    </div>
  );
}
