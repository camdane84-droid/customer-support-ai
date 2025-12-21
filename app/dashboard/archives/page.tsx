'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MessageThread from '@/components/inbox/MessageThread';
import { useAuth } from '@/lib/context/AuthContext';
import {
  Archive,
  ChevronRight,
  Calendar,
  Filter,
  Instagram,
  Mail,
  Phone,
  Search,
  X,
  ArrowLeft
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Conversation } from '@/lib/api/supabase';

type ViewLevel = 'years' | 'months' | 'days' | 'conversations';

interface BreadcrumbItem {
  level: ViewLevel;
  label: string;
  value?: string;
}

interface ArchivedConversation {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_instagram_id: string | null;
  channel: string;
  archived_at: string;
  last_message_at: string;
}

export default function ArchivesPage() {
  const { business } = useAuth();
  const [currentLevel, setCurrentLevel] = useState<ViewLevel>('years');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { level: 'years', label: 'Archives' }
  ]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const [conversations, setConversations] = useState<ArchivedConversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ArchivedConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ArchivedConversation | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterDay, setFilterDay] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');

  // Load archived conversations
  useEffect(() => {
    if (business) {
      loadArchivedConversations();
    }
  }, [business]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [conversations, filterChannel, filterYear, filterMonth, filterDay, filterSearch]);

  async function loadArchivedConversations() {
    if (!business) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/conversations/archived?business_id=${business.id}`);

      if (!response.ok) {
        throw new Error('Failed to load archived conversations');
      }

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to load archives:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...conversations];

    // Channel filter
    if (filterChannel !== 'all') {
      filtered = filtered.filter(c => c.channel === filterChannel);
    }

    // Year filter
    if (filterYear !== 'all') {
      filtered = filtered.filter(c =>
        getArchiveDate(c).getFullYear().toString() === filterYear
      );
    }

    // Month filter
    if (filterMonth !== 'all') {
      filtered = filtered.filter(c =>
        (getArchiveDate(c).getMonth() + 1).toString().padStart(2, '0') === filterMonth
      );
    }

    // Day filter
    if (filterDay !== 'all') {
      filtered = filtered.filter(c =>
        getArchiveDate(c).getDate().toString().padStart(2, '0') === filterDay
      );
    }

    // Search filter
    if (filterSearch) {
      const query = filterSearch.toLowerCase();
      filtered = filtered.filter(c =>
        c.customer_name.toLowerCase().includes(query) ||
        c.customer_email?.toLowerCase().includes(query) ||
        c.customer_instagram_id?.toLowerCase().includes(query)
      );
    }

    setFilteredConversations(filtered);
  }

  function getArchiveDate(conversation: ArchivedConversation): Date {
    // Use archived_at if available, otherwise fall back to last_message_at
    return new Date(conversation.archived_at || conversation.last_message_at);
  }

  function getYears() {
    const years = new Set(
      filteredConversations.map(c => getArchiveDate(c).getFullYear())
    );
    return Array.from(years).sort((a, b) => b - a);
  }

  function getMonths() {
    if (!selectedYear) return [];

    const months = new Set(
      filteredConversations
        .filter(c => getArchiveDate(c).getFullYear().toString() === selectedYear)
        .map(c => getArchiveDate(c).getMonth())
    );
    return Array.from(months).sort((a, b) => b - a);
  }

  function getDays() {
    if (!selectedYear || !selectedMonth) return [];

    const days = new Set(
      filteredConversations
        .filter(c => {
          const date = getArchiveDate(c);
          return date.getFullYear().toString() === selectedYear &&
                 (date.getMonth() + 1).toString().padStart(2, '0') === selectedMonth;
        })
        .map(c => getArchiveDate(c).getDate())
    );
    return Array.from(days).sort((a, b) => b - a);
  }

  function getConversationsForDay() {
    if (!selectedYear || !selectedMonth || !selectedDay) return [];

    return filteredConversations.filter(c => {
      const date = getArchiveDate(c);
      return date.getFullYear().toString() === selectedYear &&
             (date.getMonth() + 1).toString().padStart(2, '0') === selectedMonth &&
             date.getDate().toString().padStart(2, '0') === selectedDay;
    }).sort((a, b) =>
      getArchiveDate(b).getTime() - getArchiveDate(a).getTime()
    );
  }

  function handleYearClick(year: number) {
    setSelectedYear(year.toString());
    setSelectedMonth(null);
    setSelectedDay(null);
    setCurrentLevel('months');
    setBreadcrumbs([
      { level: 'years', label: 'Archives' },
      { level: 'months', label: year.toString(), value: year.toString() }
    ]);
  }

  function handleMonthClick(month: number) {
    const monthName = new Date(2000, month, 1).toLocaleString('default', { month: 'long' });
    setSelectedMonth((month + 1).toString().padStart(2, '0'));
    setSelectedDay(null);
    setCurrentLevel('days');
    setBreadcrumbs([
      { level: 'years', label: 'Archives' },
      { level: 'months', label: selectedYear!, value: selectedYear! },
      { level: 'days', label: monthName, value: (month + 1).toString().padStart(2, '0') }
    ]);
  }

  function handleDayClick(day: number) {
    setSelectedDay(day.toString().padStart(2, '0'));
    setCurrentLevel('conversations');
    setBreadcrumbs([
      { level: 'years', label: 'Archives' },
      { level: 'months', label: selectedYear!, value: selectedYear! },
      { level: 'days', label: new Date(parseInt(selectedYear!), parseInt(selectedMonth!) - 1, 1).toLocaleString('default', { month: 'long' }), value: selectedMonth! },
      { level: 'conversations', label: `Day ${day}`, value: day.toString().padStart(2, '0') }
    ]);
  }

  function handleBreadcrumbClick(item: BreadcrumbItem, index: number) {
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    setCurrentLevel(item.level);

    if (item.level === 'years') {
      setSelectedYear(null);
      setSelectedMonth(null);
      setSelectedDay(null);
    } else if (item.level === 'months') {
      setSelectedYear(item.value!);
      setSelectedMonth(null);
      setSelectedDay(null);
    } else if (item.level === 'days') {
      setSelectedMonth(item.value!);
      setSelectedDay(null);
    }
  }

  function clearFilters() {
    setFilterChannel('all');
    setFilterYear('all');
    setFilterMonth('all');
    setFilterDay('all');
    setFilterSearch('');
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'sms': return <Phone className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email': return 'text-blue-500 bg-blue-50';
      case 'instagram': return 'text-pink-500 bg-pink-50';
      case 'sms': return 'text-green-500 bg-green-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Archive className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Archives</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {filteredConversations.length} archived conversation{filteredConversations.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {(filterChannel !== 'all' || filterYear !== 'all' || filterMonth !== 'all' || filterDay !== 'all' || filterSearch) && (
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Breadcrumb Navigation */}
          <div className="flex items-center space-x-2 mt-4 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center space-x-2">
                {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                <button
                  onClick={() => handleBreadcrumbClick(crumb, index)}
                  className={`
                    px-2 py-1 rounded transition-colors
                    ${index === breadcrumbs.length - 1
                      ? 'text-gray-900 font-medium bg-gray-100'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  {crumb.label}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Filter Archives</h3>
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Channel Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Channel</label>
                <select
                  value={filterChannel}
                  onChange={(e) => setFilterChannel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Channels</option>
                  <option value="email">Email</option>
                  <option value="instagram">Instagram</option>
                  <option value="sms">SMS</option>
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Year</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Years</option>
                  {getYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Month Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Month</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Months</option>
                  {monthNames.map((month, idx) => (
                    <option key={idx} value={(idx + 1).toString().padStart(2, '0')}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Day Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Day</label>
                <select
                  value={filterDay}
                  onChange={(e) => setFilterDay(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Days</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day.toString().padStart(2, '0')}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    placeholder="Customer name..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {filterSearch && (
                    <button
                      onClick={() => setFilterSearch('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading archives...</p>
              </div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Archived Conversations</h3>
                <p className="text-sm text-gray-500">
                  Conversations you archive will appear here
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Years View */}
              {currentLevel === 'years' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {getYears().map(year => {
                    const count = filteredConversations.filter(c =>
                      getArchiveDate(c).getFullYear() === year
                    ).length;

                    return (
                      <button
                        key={year}
                        onClick={() => handleYearClick(year)}
                        className="p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group"
                      >
                        <Calendar className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mb-3 transition-colors" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{year}</h3>
                        <p className="text-sm text-gray-500">{count} conversation{count !== 1 ? 's' : ''}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Months View */}
              {currentLevel === 'months' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {getMonths().map(month => {
                    const count = filteredConversations.filter(c => {
                      const date = getArchiveDate(c);
                      return date.getFullYear().toString() === selectedYear &&
                             date.getMonth() === month;
                    }).length;

                    return (
                      <button
                        key={month}
                        onClick={() => handleMonthClick(month)}
                        className="p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group"
                      >
                        <Calendar className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mb-3 transition-colors" />
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{monthNames[month]}</h3>
                        <p className="text-sm text-gray-500">{count} conversation{count !== 1 ? 's' : ''}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Days View */}
              {currentLevel === 'days' && (
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3">
                  {getDays().map(day => {
                    const count = filteredConversations.filter(c => {
                      const date = getArchiveDate(c);
                      return date.getFullYear().toString() === selectedYear &&
                             (date.getMonth() + 1).toString().padStart(2, '0') === selectedMonth &&
                             date.getDate() === day;
                    }).length;

                    return (
                      <button
                        key={day}
                        onClick={() => handleDayClick(day)}
                        className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group"
                      >
                        <div className="text-2xl font-bold text-gray-900 mb-1">{day}</div>
                        <div className="text-xs text-gray-500">{count}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Conversations View */}
              {currentLevel === 'conversations' && (
                <>
                  {selectedConversation ? (
                    <div className="flex h-[calc(100vh-300px)] bg-white rounded-lg border border-gray-200 overflow-hidden">
                      {/* Conversation List Sidebar */}
                      <div className="w-80 border-r border-gray-200 flex-shrink-0 flex flex-col">
                        <div className="p-4 border-b border-gray-200">
                          <button
                            onClick={() => setSelectedConversation(null)}
                            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-3"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">Back to list</span>
                          </button>
                          <h3 className="text-sm font-semibold text-gray-900">
                            {getConversationsForDay().length} conversation{getConversationsForDay().length !== 1 ? 's' : ''}
                          </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          {getConversationsForDay().map(conversation => (
                            <button
                              key={conversation.id}
                              onClick={() => setSelectedConversation(conversation)}
                              className={`
                                w-full p-4 border-b border-gray-200 text-left transition-all
                                ${selectedConversation.id === conversation.id
                                  ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                  : 'bg-white border-l-4 border-l-transparent hover:bg-gray-50'
                                }
                              `}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-semibold text-sm">
                                    {conversation.customer_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                                    {conversation.customer_name}
                                  </h3>
                                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                                    {conversation.customer_email || conversation.customer_instagram_id || 'No contact info'}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getChannelColor(conversation.channel)}`}>
                                      {getChannelIcon(conversation.channel)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Message Thread */}
                      <div className="flex-1">
                        <MessageThread
                          key={selectedConversation.id}
                          conversation={selectedConversation as Conversation}
                          businessId={business!.id}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getConversationsForDay().map(conversation => (
                        <button
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation)}
                          className="w-full bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition-all text-left"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-semibold text-sm">
                                  {conversation.customer_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-gray-900">
                                  {conversation.customer_name}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {conversation.customer_email || conversation.customer_instagram_id || 'No contact info'}
                                </p>
                                <div className="flex items-center space-x-3 mt-2">
                                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getChannelColor(conversation.channel)}`}>
                                    {getChannelIcon(conversation.channel)}
                                    <span className="capitalize">{conversation.channel}</span>
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Archived {formatDistanceToNow(getArchiveDate(conversation), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
