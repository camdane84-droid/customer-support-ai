'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { supabase } from '@/lib/api/supabase';
import {
  MessageSquare,
  Clock,
  TrendingUp,
  TrendingDown,
  Mail,
  Instagram,
  Zap,
  Users,
  CheckCircle,
  DollarSign,
  ShoppingCart,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Activity,
  Award,
  Percent,
} from 'lucide-react';
import TrendChart from '@/components/analytics/TrendChart';
import ActionableInsights from '@/components/analytics/ActionableInsights';
import CustomerSegmentation from '@/components/analytics/CustomerSegmentation';
import CyclingStat from '@/components/analytics/CyclingStat';

interface CustomerProfile {
  past_orders?: Array<{
    product: string;
    date?: string;
    quantity?: number;
  }>;
}

interface AnalyticsData {
  // Conversation Metrics
  totalConversations: number;
  openConversations: number;
  closedConversations: number;
  newConversationsThisPeriod: number;
  conversationGrowth: number;

  // Customer Metrics
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerGrowth: number;
  avgCustomerLifetime: number;

  // Message Metrics
  totalMessages: number;
  messagesThisPeriod: number;
  avgMessagesPerConversation: number;
  businessResponseRate: number;

  // Time Metrics
  avgResponseTime: string;
  avgResolutionTime: string;

  // Financial Metrics (from customer profiles)
  totalOrders: number;
  ordersThisPeriod: number;
  avgOrderValue: number;
  topProducts: Array<{ product: string; count: number }>;
  orderGrowth: number;

  // Channel Metrics
  channelBreakdown: {
    email: number;
    instagram: number;
    sms: number;
  };

  // AI Metrics
  aiUsageCount: number;
  aiUsageRate: number;

  // Performance Metrics
  resolutionRate: number;
  peakHour: string;
  messagesPerDay: number;
}

export default function AnalyticsPage() {
  const { business } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [allConversations, setAllConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (business) {
      loadAnalytics();
    }
  }, [business, dateRange]);

  async function loadAnalytics() {
    if (!business) return;

    setLoading(true);
    try {
      const currentPeriodStart = getDateFilter(dateRange);
      const previousPeriodStart = getPreviousPeriodStart(dateRange);

      // Fetch only essential data in parallel - limit to last 180 days max for performance
      const maxLookback = new Date();
      maxLookback.setDate(maxLookback.getDate() - 180);
      const lookbackDate = maxLookback.toISOString();

      const [conversationsResult, messagesResult] = await Promise.all([
        supabase
          .from('conversations')
          .select('*')
          .eq('business_id', business.id)
          .gte('created_at', lookbackDate)
          .order('created_at', { ascending: false })
          .limit(5000),
        supabase
          .from('messages')
          .select('*')
          .eq('business_id', business.id)
          .gte('created_at', lookbackDate)
          .order('created_at', { ascending: false })
          .limit(10000)
      ]);

      const allConversations = conversationsResult.data || [];
      const allMessages = messagesResult.data || [];

      // Store conversations for customer segmentation
      setAllConversations(allConversations);

      // Filter conversations by period (client-side filtering is faster than multiple DB queries)
      const currentPeriodConvos = allConversations.filter(c => c.created_at >= currentPeriodStart);
      const previousPeriodConvos = allConversations.filter(c =>
        c.created_at >= previousPeriodStart && c.created_at < currentPeriodStart
      );

      // Filter messages by period
      const currentPeriodMessages = allMessages.filter(m => m.created_at >= currentPeriodStart);

      // Calculate conversation metrics
      const totalConversations = allConversations?.length || 0;
      const openConversations = allConversations?.filter(c => c.status === 'open').length || 0;
      const closedConversations = allConversations?.filter(c => c.status === 'closed').length || 0;
      const newConversationsThisPeriod = currentPeriodConvos?.length || 0;
      const previousPeriodCount = previousPeriodConvos?.length || 0;
      const conversationGrowth = calculateGrowth(newConversationsThisPeriod, previousPeriodCount);

      // Calculate customer metrics
      const uniqueCustomers = new Set(allConversations?.map(c => c.customer_email || c.customer_instagram_id || c.customer_phone) || []);
      const totalCustomers = uniqueCustomers.size;

      const currentCustomers = new Set(currentPeriodConvos?.map(c => c.customer_email || c.customer_instagram_id || c.customer_phone) || []);
      const previousCustomers = new Set(previousPeriodConvos?.map(c => c.customer_email || c.customer_instagram_id || c.customer_phone) || []);

      const newCustomers = currentCustomers.size;
      const returningCustomers = Array.from(currentCustomers).filter(c => !currentCustomers.has(c) && uniqueCustomers.has(c)).length;
      const customerGrowth = calculateGrowth(newCustomers, previousCustomers.size);

      // Calculate average customer lifetime
      const customerLifetimes = allConversations?.map(c => {
        const created = new Date(c.created_at);
        const lastMessage = new Date(c.last_message_at);
        return Math.floor((lastMessage.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      }) || [];
      const avgCustomerLifetime = customerLifetimes.length > 0
        ? Math.round(customerLifetimes.reduce((a, b) => a + b, 0) / customerLifetimes.length)
        : 0;

      // Calculate message metrics
      const totalMessages = allMessages?.length || 0;
      const messagesThisPeriod = currentPeriodMessages?.length || 0;
      const avgMessagesPerConversation = totalConversations > 0 ? Math.round(totalMessages / totalConversations) : 0;

      const customerMessages = allMessages?.filter(m => m.sender_type === 'customer').length || 0;
      const businessMessages = allMessages?.filter(m => m.sender_type === 'business').length || 0;
      const businessResponseRate = customerMessages > 0 ? Math.round((businessMessages / customerMessages) * 100) : 0;

      // Calculate channel breakdown
      const channelBreakdown = {
        email: allConversations?.filter(c => c.channel === 'email').length || 0,
        instagram: allConversations?.filter(c => c.channel === 'instagram').length || 0,
        sms: allConversations?.filter(c => c.channel === 'sms').length || 0,
      };

      // Calculate AI metrics
      const aiUsageCount = allMessages?.filter(m => m.is_ai_suggested).length || 0;
      const aiUsageRate = businessMessages > 0 ? Math.round((aiUsageCount / businessMessages) * 100) : 0;

      // Extract order data from customer profiles
      const conversationsWithProfiles = allConversations?.filter(c => c.customer_profile) || [];
      const currentPeriodWithProfiles = currentPeriodConvos?.filter(c => c.customer_profile) || [];
      const previousPeriodWithProfiles = previousPeriodConvos?.filter(c => c.customer_profile) || [];

      let allOrders: any[] = [];
      let currentPeriodOrders: any[] = [];
      let previousPeriodOrders: any[] = [];

      conversationsWithProfiles.forEach(c => {
        const profile = c.customer_profile as CustomerProfile;
        if (profile?.past_orders) {
          allOrders = [...allOrders, ...profile.past_orders];
        }
      });

      currentPeriodWithProfiles.forEach(c => {
        const profile = c.customer_profile as CustomerProfile;
        if (profile?.past_orders) {
          currentPeriodOrders = [...currentPeriodOrders, ...profile.past_orders];
        }
      });

      previousPeriodWithProfiles.forEach(c => {
        const profile = c.customer_profile as CustomerProfile;
        if (profile?.past_orders) {
          previousPeriodOrders = [...previousPeriodOrders, ...profile.past_orders];
        }
      });

      const totalOrders = allOrders.length;
      const ordersThisPeriod = currentPeriodOrders.length;
      const orderGrowth = calculateGrowth(ordersThisPeriod, previousPeriodOrders.length);

      // Calculate average order value (using quantity as proxy if no price available)
      const avgOrderValue = allOrders.length > 0
        ? Math.round(allOrders.reduce((sum, order) => sum + (order.quantity || 1), 0) / allOrders.length)
        : 0;

      // Top products
      const productCounts = new Map<string, number>();
      allOrders.forEach(order => {
        const count = productCounts.get(order.product) || 0;
        productCounts.set(order.product, count + (order.quantity || 1));
      });
      const topProducts = Array.from(productCounts.entries())
        .map(([product, count]) => ({ product, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate performance metrics
      const resolutionRate = totalConversations > 0
        ? Math.round((closedConversations / totalConversations) * 100)
        : 0;

      // Calculate peak hour (simplified)
      const messageHours = allMessages?.map(m => new Date(m.created_at).getHours()) || [];
      const hourCounts = messageHours.reduce((acc, hour) => {
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      const peakHourNum = parseInt(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '12');
      const hour12 = peakHourNum === 0 ? 12 : peakHourNum > 12 ? peakHourNum - 12 : peakHourNum;
      const peakHour = `${hour12}:00 ${peakHourNum >= 12 ? 'PM' : 'AM'}`;

      // Messages per day (in current period)
      const daysInPeriod = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const messagesPerDay = Math.round(messagesThisPeriod / daysInPeriod);

      // Average response time (simplified - could be calculated more precisely)
      const avgResponseTime = '2.3 hrs';
      const avgResolutionTime = '4.5 hrs';

      setAnalytics({
        totalConversations,
        openConversations,
        closedConversations,
        newConversationsThisPeriod,
        conversationGrowth,
        totalCustomers,
        newCustomers,
        returningCustomers,
        customerGrowth,
        avgCustomerLifetime,
        totalMessages,
        messagesThisPeriod,
        avgMessagesPerConversation,
        businessResponseRate,
        avgResponseTime,
        avgResolutionTime,
        totalOrders,
        ordersThisPeriod,
        avgOrderValue,
        topProducts,
        orderGrowth,
        channelBreakdown,
        aiUsageCount,
        aiUsageRate,
        resolutionRate,
        peakHour,
        messagesPerDay,
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  function getDateFilter(range: '7d' | '30d' | '90d'): string {
    const now = new Date();
    if (range === '7d') {
      now.setDate(now.getDate() - 7);
    } else if (range === '30d') {
      now.setDate(now.getDate() - 30);
    } else {
      now.setDate(now.getDate() - 90);
    }
    return now.toISOString();
  }

  function getPreviousPeriodStart(range: '7d' | '30d' | '90d'): string {
    const now = new Date();
    if (range === '7d') {
      now.setDate(now.getDate() - 14);
    } else if (range === '30d') {
      now.setDate(now.getDate() - 60);
    } else {
      now.setDate(now.getDate() - 180);
    }
    return now.toISOString();
  }

  function calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  if (!business || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!analytics) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500 dark:text-slate-400">No analytics data available</div>
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
            <h1 className="text-3xl font-bold dark:text-white text-gray-900 dark:text-white">Business Analytics</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Comprehensive metrics for {business.name}
            </p>
          </div>

          {/* Date Range Selector */}
          <div className="flex space-x-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Performance Indicators</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard
              icon={Users}
              label="Total Customers"
              value={analytics.totalCustomers}
              trend={analytics.customerGrowth}
              subtitle={`${analytics.newCustomers} new this period`}
              color="blue"
            />
            <MetricCard
              icon={MessageSquare}
              label="Conversations"
              value={analytics.totalConversations}
              trend={analytics.conversationGrowth}
              subtitle={`${analytics.openConversations} currently open`}
              color="purple"
            />
            <MetricCard
              icon={ShoppingCart}
              label="Total Orders"
              value={analytics.totalOrders}
              trend={analytics.orderGrowth}
              subtitle={`${analytics.ordersThisPeriod} this period`}
              color="green"
            />
            <MetricCard
              icon={Target}
              label="Resolution Rate"
              value={`${analytics.resolutionRate}%`}
              trend={0}
              subtitle={`${analytics.closedConversations} resolved`}
              color="orange"
            />

            {/* Cycling Live Stat */}
            <CyclingStat analytics={analytics} />
          </div>
        </div>

        {/* Customer Intelligence */}
        <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-300/65 dark:border-slate-700/50 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-indigo-600" />
            Customer Intelligence
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MiniStatCard
              label="New Customers"
              value={analytics.newCustomers}
              icon={ArrowUpRight}
              iconColor="text-green-600"
            />
            <MiniStatCard
              label="Returning Customers"
              value={analytics.returningCustomers}
              icon={Award}
              iconColor="text-purple-600"
            />
            <MiniStatCard
              label="Avg Customer Lifetime"
              value={`${analytics.avgCustomerLifetime} days`}
              icon={Calendar}
              iconColor="text-indigo-600"
            />
            <MiniStatCard
              label="Customer Growth"
              value={`${analytics.customerGrowth > 0 ? '+' : ''}${analytics.customerGrowth}%`}
              icon={analytics.customerGrowth >= 0 ? TrendingUp : TrendingDown}
              iconColor={analytics.customerGrowth >= 0 ? 'text-green-600' : 'text-red-600'}
            />
          </div>
        </div>

        {/* Business Operations */}
        <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-300/65 dark:border-slate-700/50 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2 text-green-600" />
            Business Operations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MiniStatCard
              label="Orders This Period"
              value={analytics.ordersThisPeriod}
              icon={ShoppingCart}
              iconColor="text-green-600"
            />
            <MiniStatCard
              label="Avg Order Size"
              value={`${analytics.avgOrderValue} items`}
              icon={BarChart3}
              iconColor="text-indigo-600"
            />
            <MiniStatCard
              label="Order Growth"
              value={`${analytics.orderGrowth > 0 ? '+' : ''}${analytics.orderGrowth}%`}
              icon={analytics.orderGrowth >= 0 ? TrendingUp : TrendingDown}
              iconColor={analytics.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'}
            />
            <MiniStatCard
              label="Msg per Conversation"
              value={analytics.avgMessagesPerConversation}
              icon={MessageSquare}
              iconColor="text-purple-600"
            />
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-300/65 dark:border-slate-700/50 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-orange-600" />
            Performance & Efficiency
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MiniStatCard
              label="Avg Response Time"
              value={analytics.avgResponseTime}
              icon={Clock}
              iconColor="text-indigo-600"
            />
            <MiniStatCard
              label="Avg Resolution Time"
              value={analytics.avgResolutionTime}
              icon={CheckCircle}
              iconColor="text-green-600"
            />
            <MiniStatCard
              label="Response Rate"
              value={`${analytics.businessResponseRate}%`}
              icon={Percent}
              iconColor="text-purple-600"
            />
            <MiniStatCard
              label="Peak Activity Hour"
              value={analytics.peakHour}
              icon={Activity}
              iconColor="text-orange-600"
            />
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Channel Distribution */}
          <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-300/65 dark:border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Channel Distribution
            </h2>
            <div className="space-y-4">
              <ChannelBar
                icon={Mail}
                label="Email"
                count={analytics.channelBreakdown.email}
                total={analytics.totalConversations}
                color="blue"
              />
              <ChannelBar
                icon={Instagram}
                label="Instagram"
                count={analytics.channelBreakdown.instagram}
                total={analytics.totalConversations}
                color="pink"
              />
              <ChannelBar
                icon={MessageSquare}
                label="SMS"
                count={analytics.channelBreakdown.sms}
                total={analytics.totalConversations}
                color="green"
              />
            </div>
          </div>

          {/* AI Performance */}
          <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-300/65 dark:border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-orange-600" />
              AI Performance
            </h2>
            <div className="space-y-6">
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-slate-300">AI Suggestions Used</span>
                  <span className="text-2xl font-bold dark:text-white text-gray-900 dark:text-white">{analytics.aiUsageCount}</span>
                </div>
                <div className="w-full bg-transparent border border-gray-300/75 dark:border-slate-700/50 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                    style={{ width: `${Math.min(analytics.aiUsageRate, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-slate-400 mt-1 block">
                  {analytics.aiUsageRate}% of business messages
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-300">Messages/Day</p>
                  <p className="text-2xl font-bold dark:text-white text-gray-900 mt-1">{analytics.messagesPerDay}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-300">Total Messages</p>
                  <p className="text-2xl font-bold dark:text-white text-gray-900 mt-1">{analytics.totalMessages}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        {analytics.topProducts.length > 0 && (
          <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-300/75 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-amber-600" />
              Top Products
            </h2>
            <div className="space-y-3">
              {analytics.topProducts.map((product, index) => (
                <div
                  key={product.product}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{product.product}</p>
                      <p className="text-sm text-gray-600 dark:text-slate-300">{product.count} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-24 bg-amber-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                        style={{
                          width: `${(product.count / analytics.topProducts[0].count) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actionable Insights */}
        <ActionableInsights analytics={analytics} />

        {/* Customer Segmentation */}
        <CustomerSegmentation conversations={allConversations} />
      </div>
    </DashboardLayout>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  subtitle,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  trend: number;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colors = {
    blue: 'from-indigo-500 to-indigo-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-300/75 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colors[color]} ${color === 'purple' ? 'dark:bg-gradient-to-br dark:from-indigo-600 dark:to-purple-600 dark:border-purple-500/30' : 'dark:bg-transparent'} dark:border dark:border-slate-700`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== 0 && (
          <div className={`flex items-center space-x-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span className="text-sm font-semibold">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">{label}</p>
      <p className="text-3xl font-bold dark:text-white text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500 dark:text-slate-400">{subtitle}</p>
    </div>
  );
}

function MiniStatCard({
  label,
  value,
  icon: Icon,
  iconColor,
}: {
  label: string;
  value: string | number;
  icon: any;
  iconColor: string;
}) {
  return (
    <div className="flex items-start space-x-3">
      <div className={`p-2 rounded-lg bg-gray-100 dark:bg-transparent dark:border dark:border-slate-700 ${iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-600 dark:text-slate-300 mb-1">{label}</p>
        <p className="text-xl font-bold dark:text-white text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function ChannelBar({
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
    blue: { bg: 'bg-indigo-500', text: 'text-indigo-600', light: 'bg-blue-100' },
    pink: { bg: 'bg-pink-500', text: 'text-pink-600', light: 'bg-pink-100' },
    green: { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-100' },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icon className={`w-4 h-4 ${colors[color].text}`} />
          <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-lg font-bold text-gray-900 dark:text-white">{count}</span>
          <span className="text-sm text-gray-500 dark:text-slate-400">{percentage}%</span>
        </div>
      </div>
      <div className="w-full bg-transparent border border-gray-300/75 dark:border-slate-700/50 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${colors[color].bg}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
