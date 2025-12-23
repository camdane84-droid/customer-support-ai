'use client';

import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, Users } from 'lucide-react';

interface Insight {
  type: 'success' | 'warning' | 'info' | 'urgent';
  title: string;
  description: string;
  action?: string;
  metric?: string;
}

interface ActionableInsightsProps {
  analytics: any;
}

export default function ActionableInsights({ analytics }: ActionableInsightsProps) {
  const insights: Insight[] = [];

  // Response time insights
  if (analytics.avgResponseTime && parseFloat(analytics.avgResponseTime) > 4) {
    insights.push({
      type: 'warning',
      title: 'Slow Response Time',
      description: `Average response time is ${analytics.avgResponseTime}. Customers expect responses under 2 hours.`,
      action: 'Consider enabling AI suggestions to speed up responses',
      metric: analytics.avgResponseTime
    });
  } else if (analytics.avgResponseTime) {
    insights.push({
      type: 'success',
      title: 'Excellent Response Time',
      description: `Your team responds in ${analytics.avgResponseTime} on average. Keep it up!`,
      metric: analytics.avgResponseTime
    });
  }

  // Customer growth insights
  if (analytics.customerGrowth > 20) {
    insights.push({
      type: 'success',
      title: 'Strong Customer Growth',
      description: `You've grown ${analytics.customerGrowth}% this period. ${analytics.newCustomers} new customers acquired.`,
      action: 'Focus on retention strategies to maximize lifetime value',
      metric: `+${analytics.customerGrowth}%`
    });
  } else if (analytics.customerGrowth < 0) {
    insights.push({
      type: 'urgent',
      title: 'Customer Decline',
      description: `Customer count decreased by ${Math.abs(analytics.customerGrowth)}%. Time to investigate.`,
      action: 'Review recent conversations for common complaints',
      metric: `${analytics.customerGrowth}%`
    });
  }

  // Open conversations insights
  if (analytics.openConversations > 10) {
    insights.push({
      type: 'warning',
      title: 'High Open Conversations',
      description: `${analytics.openConversations} conversations are still open and need attention.`,
      action: 'Review and close resolved conversations to stay organized',
      metric: `${analytics.openConversations} open`
    });
  }

  // Resolution rate insights
  if (analytics.resolutionRate < 50) {
    insights.push({
      type: 'urgent',
      title: 'Low Resolution Rate',
      description: `Only ${analytics.resolutionRate}% of conversations are resolved. Aim for 70%+.`,
      action: 'Close resolved conversations and follow up on pending issues',
      metric: `${analytics.resolutionRate}%`
    });
  } else if (analytics.resolutionRate > 80) {
    insights.push({
      type: 'success',
      title: 'High Resolution Rate',
      description: `${analytics.resolutionRate}% of conversations resolved. Excellent customer service!`,
      metric: `${analytics.resolutionRate}%`
    });
  }

  // Order growth insights
  if (analytics.orderGrowth > 30 && analytics.totalOrders > 0) {
    insights.push({
      type: 'success',
      title: 'Orders Surging',
      description: `Orders increased by ${analytics.orderGrowth}% this period. ${analytics.ordersThisPeriod} new orders.`,
      action: 'Ensure you have inventory to meet growing demand',
      metric: `+${analytics.orderGrowth}%`
    });
  } else if (analytics.orderGrowth < -10 && analytics.totalOrders > 0) {
    insights.push({
      type: 'warning',
      title: 'Order Decline',
      description: `Orders dropped ${Math.abs(analytics.orderGrowth)}% compared to last period.`,
      action: 'Review recent customer feedback and consider promotions',
      metric: `${analytics.orderGrowth}%`
    });
  }

  // AI usage insights
  if (analytics.aiUsageRate < 20) {
    insights.push({
      type: 'info',
      title: 'Low AI Utilization',
      description: `Only ${analytics.aiUsageRate}% of messages use AI suggestions. You could save time!`,
      action: 'Try using AI suggestions more often to respond faster',
      metric: `${analytics.aiUsageRate}%`
    });
  } else if (analytics.aiUsageRate > 60) {
    insights.push({
      type: 'success',
      title: 'Efficient AI Usage',
      description: `${analytics.aiUsageRate}% of responses use AI. You're working smart!`,
      metric: `${analytics.aiUsageRate}%`
    });
  }

  // Peak hour insights
  if (analytics.peakHour) {
    insights.push({
      type: 'info',
      title: 'Peak Activity Time',
      description: `Most messages arrive around ${analytics.peakHour}. Consider scheduling availability accordingly.`,
      metric: analytics.peakHour
    });
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'urgent': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <TrendingUp className="w-5 h-5 text-indigo-600" />;
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50';
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50';
      case 'urgent': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50';
      default: return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50';
    }
  };

  if (insights.length === 0) {
    return (
      <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-300/75 dark:border-slate-700/50 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
          Actionable Insights
        </h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm">
          Keep collecting data and insights will appear here to help you improve your business.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-300/75 dark:border-slate-700/50 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
        Actionable Insights
        <span className="ml-auto text-sm font-normal text-gray-500 dark:text-slate-400">{insights.length} insights</span>
      </h2>

      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getColors(insight.type)} transition-all hover:shadow-md`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(insight.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{insight.title}</h3>
                  {insight.metric && (
                    <span className="ml-2 text-sm font-bold text-gray-700 dark:text-slate-300 whitespace-nowrap">
                      {insight.metric}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-slate-300 mt-1">{insight.description}</p>
                {insight.action && (
                  <div className="mt-2 flex items-center text-xs text-gray-600 dark:text-slate-400 bg-white/50 dark:bg-slate-700/50 rounded px-2 py-1 inline-block">
                    <span className="font-medium">💡 Action:</span>
                    <span className="ml-1">{insight.action}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
