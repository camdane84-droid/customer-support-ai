'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
import UpgradePrompt from '@/components/ui/UpgradePrompt';

interface AISuggestionProps {
  conversationId: string;
  businessId: string;
  onUseSuggestion: (suggestion: string) => void;
}

export default function AISuggestion({
  conversationId,
  businessId,
  onUseSuggestion,
}: AISuggestionProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{
    used: number;
    limit: number;
    resetAt?: string;
  } | null>(null);

  async function generateSuggestion() {
    setLoading(true);
    setError(null);
    setSuggestion(null);

    console.log('[AISuggestion] Generating with:', { conversationId, businessId });

    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, businessId }),
      });

      console.log('[AISuggestion] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[AISuggestion] Error response:', errorData);

        // Check if it's a limit reached error (429 status)
        if (response.status === 429 && errorData.limitReached) {
          setLimitInfo({
            used: errorData.usageStatus?.aiSuggestionsUsed || 0,
            limit: errorData.usageStatus?.aiSuggestionsLimit || 0,
            resetAt: errorData.usageStatus?.resetAt,
          });
          setShowUpgradePrompt(true);
          return; // Don't throw, just show the upgrade prompt
        }

        // Check if AI insights are disabled (403 status)
        if (response.status === 403 && errorData.insightsDisabled) {
          throw new Error('AI Customer Insights is disabled. Enable it in Settings to use this feature.');
        }

        throw new Error(errorData.error || 'Failed to generate suggestion');
      }

      const data = await response.json();
      setSuggestion(data.suggestion);
    } catch (err: any) {
      console.error('[AISuggestion] Error:', err);
      setError(err.message || 'Failed to generate suggestion');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (suggestion) {
      navigator.clipboard.writeText(suggestion);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && limitInfo && (
        <UpgradePrompt
          type="ai"
          currentUsage={limitInfo.used}
          limit={limitInfo.limit}
          resetAt={limitInfo.resetAt}
          onClose={() => setShowUpgradePrompt(false)}
        />
      )}

      <div className="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 p-4">
        {/* Generate Button */}
      {!suggestion && !loading && (
        <button
          onClick={generateSuggestion}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate AI Response</span>
        </button>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center space-x-3 text-purple-700 dark:text-purple-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">AI is thinking...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button
            onClick={generateSuggestion}
            className="ml-3 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Suggestion Display */}
      {suggestion && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-300">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI Suggested Response</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white text-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-700 border-2 border-purple-200 dark:border-purple-500/50 rounded-lg p-4">
            <p className="text-sm text-gray-800 dark:text-white whitespace-pre-wrap">{suggestion}</p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => onUseSuggestion(suggestion)}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Use This Response
            </button>
            <button
              onClick={() => {
                setSuggestion(null);
                generateSuggestion();
              }}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
            >
              Regenerate
            </button>
            <button
              onClick={() => setSuggestion(null)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
