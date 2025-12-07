'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { supabase } from '@/lib/api/supabase';
import {
  MessageSquare,
  Clock,
  TrendingUp,
  Mail,
  Instagram,
  Zap,
  Users,
  CheckCircle,
} from 'lucide-react';

interface AnalyticsData {
  totalConversations: number;
  openConversations: number;
  closedConversations: number;
  totalMessages: number;
  messagesThisWeek: number;
  avgResponseTime: string;
  channelBreakdown: {
    email: number;
    instagram: number;
    sms: number;
  };
  aiUsageCount: number;
  topCustomers: Array<{
    name: string;
    messageCount: number;
  }>;
}

export default function AnalyticsPage() {
  const { business } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    if (business) {
      loadAnalytics();
    }
  }, [business, dateRange]);

  async function loadAnalytics() {
    if (!business) return;

    setLoading(true);
    try {
      // Calculate date filter
      const dateFilter = getDateFilter(dateRange);

      // Get total conversations
      const { data: conversations } = await supabase
        .from('conversations')
        .select('*')
        .eq('business_id', business.id);

      // Get conversations in date range
      const { data: recentConversations } = await supabase
        .from('conversations')
        .select('*')
        .eq('business_id', business.id)
        .gte('created_at', dateFilter);

      // Get all messages
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('business_id', business.id);

      // Get messages in date range
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('business_id', business.id)
        .gte('created_at', dateFilter);

      // Calculate metrics
      const channelBreakdown = {
        email: conversations?.filter(c => c.channel === 'email').length || 0,
        instagram: conversations?.filter(c => c.channel === 'instagram').length || 0,
        sms: conversations?.filter(c => c.channel === 'sms').length || 0,
      };

      const aiUsageCount = messages?.filter(m => m.is_ai_suggested).length || 0;

      // Top customers by message count
      const customerMessageCounts = new Map<string, number>();
      messages?.forEach(m => {
        if (m.sender_type === 'customer') {
          const count = customerMessageCounts.get(m.sender_name || 'Unknown') || 0;
          customerMessageCounts.set(m.sender_name || 'Unknown', count + 1);
        }
      });

      const topCustomers = Array.from(customerMessageCounts.entries())
        .map(([name, count]) => ({ name, messageCount: count }))
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 5);

      // Calculate average response time (simplified)
      const avgResponseTime = '2.5 hours'; // TODO: Calculate actual response time

      setAnalytics({
        totalConversations: conversations?.length || 0,
        openConversations: conversations?.filter(c => c.status === 'open').length || 0,
        closedConversations: conversations?.filter(c => c.status === 'closed').length || 0,
        totalMessages: messages?.length || 0,
        messagesThisWeek: recentMessages?.length || 0,
        avgResponseTime,
        channelBreakdown,
        aiUsageCount,
        topCustomers,
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  function getDateFilter(range: '7d' | '30d' | 'all'): string {
    const now = new Date();
    if (range === '7d') {
      now.setDate(now.getDate() - 7);
    } else if (range === '30d') {
      now.setDate(now.getDate() - 30);
    } else {
      now.setFullYear(2000); // All time
    }
    return now.toISOString();
  }

  if (!business || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading analytics...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!analytics) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">No analytics data available</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">
              Track your customer support performance
            </p>
          </div>

          {/* Date Range Selector */}
          <div className="flex space-x-2">
            {(['7d', '30d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={MessageSquare}
            label="Total Conversations"
            value={analytics.totalConversations}
            color="blue"
          />
          <StatCard
            icon={CheckCircle}
            label="Open Conversations"
            value={analytics.openConversations}
            color="green"
          />
          <StatCard
            icon={Clock}
            label="Avg Response Time"
            value={analytics.avgResponseTime}
            color="purple"
          />
          <StatCard
            icon={Zap}
            label="AI Suggestions Used"
            value={analytics.aiUsageCount}
            color="orange"
          />
        </div>

        {/* Channel Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Channel Distribution
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ChannelCard
              icon={Mail}
              label="Email"
              count={analytics.channelBreakdown.email}
              total={analytics.totalConversations}
              color="blue"
            />
            <ChannelCard
              icon={Instagram}
              label="Instagram"
              count={analytics.channelBreakdown.instagram}
              total={analytics.totalConversations}
              color="pink"
            />
            <ChannelCard
              icon={MessageSquare}
              label="SMS"
              count={analytics.channelBreakdown.sms}
              total={analytics.totalConversations}
              color="green"
            />
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-gray-500" />
            Top Customers
          </h2>
          {analytics.topCustomers.length === 0 ? (
            <p className="text-gray-500 text-sm">No customer data yet</p>
          ) : (
            <div className="space-y-3">
              {analytics.topCustomers.map((customer, index) => (
                <div
                  key={customer.name}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">
                        {index + 1}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">{customer.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {customer.messageCount} messages
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Message Activity
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Total Messages</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {analytics.totalMessages}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Messages This Period</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {analytics.messagesThisWeek}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colors = {
    blue: 'text-blue-500 bg-blue-50',
    green: 'text-green-500 bg-green-50',
    purple: 'text-purple-500 bg-purple-50',
    orange: 'text-orange-500 bg-orange-50',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ChannelCard({
  icon: Icon,
  label,
  count,
  total,
  color,
}: {
  icon: any;
  label: string;
  count: number;
  total: number;
  color: 'blue' | 'pink' | 'green';
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  const colors = {
    blue: 'text-blue-500 bg-blue-50',
    pink: 'text-pink-500 bg-pink-50',
    green: 'text-green-500 bg-green-50',
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center space-x-3 mb-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-medium text-gray-900">{label}</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-gray-900">{count}</span>
          <span className="text-sm text-gray-500">{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              color === 'blue' ? 'bg-blue-500' :
              color === 'pink' ? 'bg-pink-500' :
              'bg-green-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
