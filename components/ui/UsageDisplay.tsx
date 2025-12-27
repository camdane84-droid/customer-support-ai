'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Zap, MessageSquare, Clock } from 'lucide-react';

interface UsageStatus {
  canUseAI: boolean;
  canCreateConversation: boolean;
  aiSuggestionsUsed: number;
  aiSuggestionsLimit: number;
  aiSuggestionsRemaining: number;
  conversationsUsed: number;
  conversationsLimit: number;
  conversationsRemaining: number;
  resetAiAt: string;
  resetConversationsAt: string;
  tier: 'free' | 'starter' | 'pro';
}

interface UsageDisplayProps {
  businessId: string;
  compact?: boolean;
}

export default function UsageDisplay({ businessId, compact = false }: UsageDisplayProps) {
  const [usage, setUsage] = useState<UsageStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const response = await fetch(`/api/usage?businessId=${businessId}`);
        if (response.ok) {
          const data = await response.json();
          setUsage(data);
        }
      } catch (error) {
        console.error('Failed to fetch usage:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, [businessId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
      </div>
    );
  }

  if (!usage) return null;

  const aiPercentage = (usage.aiSuggestionsUsed / usage.aiSuggestionsLimit) * 100;
  const conversationsPercentage = (usage.conversationsUsed / usage.conversationsLimit) * 100;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatResetTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="text-muted-foreground">
            {usage.aiSuggestionsRemaining} AI left
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-500" />
          <span className="text-muted-foreground">
            {usage.conversationsRemaining} convos left
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Usage - {usage.tier.charAt(0).toUpperCase() + usage.tier.slice(1)} Plan
        </h3>
        {(aiPercentage >= 90 || conversationsPercentage >= 90) && (
          <AlertCircle className="h-5 w-5 text-yellow-500" />
        )}
      </div>

      <div className="space-y-4">
        {/* AI Suggestions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                AI Suggestions
              </span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {usage.aiSuggestionsUsed} / {usage.aiSuggestionsLimit === Infinity ? '∞' : usage.aiSuggestionsLimit}
            </span>
          </div>
          {usage.aiSuggestionsLimit !== Infinity && (
            <>
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressColor(aiPercentage)}`}
                  style={{ width: `${Math.min(aiPercentage, 100)}%` }}
                ></div>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="h-3 w-3" />
                <span>Resets in {formatResetTime(usage.resetAiAt)}</span>
              </div>
            </>
          )}
        </div>

        {/* Conversations */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Conversations
              </span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {usage.conversationsUsed} / {usage.conversationsLimit === Infinity ? '∞' : usage.conversationsLimit}
            </span>
          </div>
          {usage.conversationsLimit !== Infinity && (
            <>
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressColor(conversationsPercentage)}`}
                  style={{ width: `${Math.min(conversationsPercentage, 100)}%` }}
                ></div>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="h-3 w-3" />
                <span>Resets in {formatResetTime(usage.resetConversationsAt)}</span>
              </div>
            </>
          )}
        </div>

        {/* Upgrade CTA for free tier */}
        {usage.tier === 'free' && (aiPercentage >= 75 || conversationsPercentage >= 75) && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Running low on credits? <a href="/pricing" className="font-semibold underline">Upgrade now</a> for unlimited access.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
