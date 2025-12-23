'use client';

import { Crown, TrendingDown, Sparkles, Users } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email?: string;
  messageCount: number;
  orderCount: number;
  lastActive: string;
  value: 'high' | 'medium' | 'low';
}

interface CustomerSegmentationProps {
  conversations: any[];
}

export default function CustomerSegmentation({ conversations }: CustomerSegmentationProps) {
  // Process conversations to extract customer insights
  const customerMap = new Map<string, any>();

  conversations.forEach(convo => {
    const customerId = convo.customer_email || convo.customer_instagram_id || convo.customer_phone;
    if (!customerId) return;

    if (!customerMap.has(customerId)) {
      customerMap.set(customerId, {
        id: customerId,
        name: convo.customer_name,
        email: convo.customer_email,
        messageCount: 0,
        orderCount: (convo.customer_profile?.past_orders?.length || 0),
        lastActive: convo.last_message_at,
        conversations: 0,
      });
    }

    const customer = customerMap.get(customerId);
    customer.conversations += 1;
    if (new Date(convo.last_message_at) > new Date(customer.lastActive)) {
      customer.lastActive = convo.last_message_at;
    }
  });

  const customers = Array.from(customerMap.values());

  // Sort by engagement (conversations + orders)
  const topCustomers = customers
    .sort((a, b) => (b.conversations + b.orderCount) - (a.conversations + a.orderCount))
    .slice(0, 5);

  // Find at-risk customers (haven't been active recently)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const atRiskCustomers = customers
    .filter(c => {
      const lastActive = new Date(c.lastActive);
      const daysSince = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      return daysSince > 30 && daysSince < 90 && c.orderCount > 0;
    })
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 5);

  // New customers (created in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const newCustomers = customers
    .filter(c => new Date(c.lastActive) > sevenDaysAgo)
    .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())
    .slice(0, 5);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Top Customers */}
      <div className="bg-white rounded-lg border border-gray-300/75 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Crown className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Top Customers</h3>
            <p className="text-xs text-gray-500">Most engaged</p>
          </div>
        </div>

        <div className="space-y-3">
          {topCustomers.length === 0 ? (
            <p className="text-sm text-gray-500">No customer data yet</p>
          ) : (
            topCustomers.map((customer, index) => (
              <div
                key={customer.id}
                className="flex items-center space-x-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">#{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{customer.name}</p>
                  <p className="text-xs text-gray-600">
                    {customer.conversations} convos • {customer.orderCount} orders
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* At-Risk Customers */}
      <div className="bg-white rounded-lg border border-gray-300/75 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">At-Risk Customers</h3>
            <p className="text-xs text-gray-500">Haven't engaged recently</p>
          </div>
        </div>

        <div className="space-y-3">
          {atRiskCustomers.length === 0 ? (
            <p className="text-sm text-gray-500">No at-risk customers identified</p>
          ) : (
            atRiskCustomers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200 hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{customer.name}</p>
                  <p className="text-xs text-red-600">
                    Last active: {formatDate(customer.lastActive)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Customers */}
      <div className="bg-white rounded-lg border border-gray-300/75 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Sparkles className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">New Customers</h3>
            <p className="text-xs text-gray-500">Joined in last 7 days</p>
          </div>
        </div>

        <div className="space-y-3">
          {newCustomers.length === 0 ? (
            <p className="text-sm text-gray-500">No new customers this week</p>
          ) : (
            newCustomers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200 hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{customer.name}</p>
                  <p className="text-xs text-green-600">
                    Joined {formatDate(customer.lastActive)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
