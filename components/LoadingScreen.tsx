'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  timeout?: number; // milliseconds
}

export default function LoadingScreen({ message = 'Loading...', timeout = 5000 }: LoadingScreenProps) {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRetry(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout]);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 mb-4">{message}</p>

        {showRetry && (
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-3">
              Taking longer than expected...
            </p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
