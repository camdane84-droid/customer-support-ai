'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';

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
    <div className="border-t border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 p-4">
      {/* Generate Button */}
      {!suggestion && !loading && (
        <button
          onClick={generateSuggestion}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate AI Response</span>
        </button>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center space-x-3 text-purple-700">
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
            <div className="flex items-center space-x-2 text-purple-700">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI Suggested Response</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 text-sm"
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

          <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{suggestion}</p>
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
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Regenerate
            </button>
            <button
              onClick={() => setSuggestion(null)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
