'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingScreen from '@/components/LoadingScreen';
import DashboardSkeleton from '@/components/inbox/DashboardSkeleton';
import { getConversations } from '@/lib/api/conversations';
import { useAuth } from '@/lib/context/AuthContext';
import type { Conversation } from '@/lib/api/supabase';
import { MessageSquare, Clock, TrendingUp, Zap } from 'lucide-react';

export default function DashboardPage() {
  const { business, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (business) {
      loadData();
    } else if (!authLoading) {
      // Auth is done loading but no business - stop showing loading screen
      setLoading(false);
    }
  }, [business, authLoading]);

  async function loadData() {
    if (!business) return;

    try {
      const convos = await getConversations(business.id);
      setConversations(convos);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (!business) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Business Found</h2>
            <p className="text-gray-600 mb-4">
              We couldn't find your business account. Please contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalConversations = conversations.length;
  const openConversations = conversations.filter(c => c.status === 'open').length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back to {business.name}! Here's what's happening with your customer support.
          </p>
        </div>

        {/* Welcome Banner for New Users */}
        {totalConversations === 0 && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Welcome to {business.name}! 🎉</h2>
            <p className="mb-4">Get started by testing your inbox with simulated messages.</p>
            <div className="flex space-x-3">
              <Link
                href="/test-email"
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                Test Email Feature
              </Link>
              <Link
                href="/dashboard/inbox"
                className="px-4 py-2 bg-blue-600 border-2 border-white text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Go to Inbox
              </Link>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Conversations</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalConversations}</p>
              </div>
              <MessageSquare className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Conversations</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{openConversations}</p>
              </div>
              <Clock className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">100%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/dashboard/inbox"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MessageSquare className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">View Inbox</p>
                <p className="text-sm text-gray-500">{openConversations} open</p>
              </div>
            </Link>

            <Link
              href="/dashboard/analytics"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">View Analytics</p>
                <p className="text-sm text-gray-500">Track performance</p>
              </div>
            </Link>

            <Link
              href="/test-email"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Zap className="w-8 h-8 text-orange-600" />
              <div>
                <p className="font-medium text-gray-900">Test Features</p>
                <p className="text-sm text-gray-500">Simulate emails</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Conversations</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No conversations yet
              </div>
            ) : (
              conversations.map((convo) => (
                <div key={convo.id} className="p-6 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700">
                          {convo.customer_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {convo.customer_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          via {convo.channel}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${convo.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      `}>
                        {convo.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(convo.last_message_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
