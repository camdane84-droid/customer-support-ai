'use client';

import { X, Zap, TrendingUp, Clock } from 'lucide-react';
import { useState } from 'react';

interface UpgradePromptProps {
  type: 'ai' | 'conversations';
  currentUsage: number;
  limit: number;
  resetAt?: Date | string;
  onClose: () => void;
}

export default function UpgradePrompt({
  type,
  currentUsage,
  limit,
  resetAt,
  onClose,
}: UpgradePromptProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  const formatResetTime = (date: Date | string) => {
    const resetDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = resetDate.getTime() - now.getTime();
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

  const isAI = type === 'ai';
  const title = isAI ? 'AI Suggestion Limit Reached' : 'Conversation Limit Reached';
  const description = isAI
    ? `You've used all ${limit} AI suggestions for today. Upgrade to get more suggestions or wait for your daily reset.`
    : `You've reached your monthly limit of ${limit} conversations. Upgrade to handle more conversations or wait for your monthly reset.`;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md transition-all duration-200 ${
          isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 p-6 m-4">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 p-3">
              {isAI ? (
                <Zap className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
              ) : (
                <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-500" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {description}
            </p>

            {resetAt && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Resets in {formatResetTime(resetAt)}
                </span>
              </div>
            )}
          </div>

          {/* Pricing comparison */}
          <div className="space-y-3 mb-6">
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900 dark:text-white">Starter</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">$29<span className="text-sm font-normal text-gray-500">/mo</span></span>
              </div>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• 500 AI suggestions/day</li>
                <li>• 500 conversations/month</li>
                <li>• All channels</li>
                <li>• 3 team members</li>
              </ul>
            </div>

            <div className="border-2 border-blue-500 rounded-lg p-4 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                RECOMMENDED
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900 dark:text-white">Pro</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">$79<span className="text-sm font-normal text-gray-500">/mo</span></span>
              </div>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Unlimited AI suggestions</li>
                <li>• Unlimited conversations</li>
                <li>• All channels</li>
                <li>• 10 team members</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Maybe Later
            </button>
            <a
              href="/pricing"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-semibold"
            >
              View Plans
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
