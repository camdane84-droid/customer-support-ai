'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertCircle, AlertTriangle, Star, X } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error' | 'info' | 'warning' | 'urgent' | 'important';
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ type, message, onClose, duration }: ToastProps) {
  // Urgent toasts don't auto-dismiss by default
  const effectiveDuration = duration ?? (type === 'urgent' ? 0 : type === 'important' ? 8000 : 5000);

  useEffect(() => {
    if (effectiveDuration > 0) {
      const timer = setTimeout(onClose, effectiveDuration);
      return () => clearTimeout(timer);
    }
  }, [effectiveDuration, onClose]);

  const configs = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      borderColor: 'border-green-200 dark:border-green-700',
      iconColor: 'text-green-500',
      textColor: 'text-green-800 dark:text-green-200',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/30',
      borderColor: 'border-red-200 dark:border-red-700',
      iconColor: 'text-red-500',
      textColor: 'text-red-800 dark:text-red-200',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
      borderColor: 'border-yellow-200 dark:border-yellow-700',
      iconColor: 'text-yellow-500',
      textColor: 'text-yellow-800 dark:text-yellow-200',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      borderColor: 'border-blue-200 dark:border-blue-700',
      iconColor: 'text-indigo-500',
      textColor: 'text-blue-800 dark:text-blue-200',
    },
    urgent: {
      icon: AlertTriangle,
      bgColor: 'bg-red-50 dark:bg-red-900/40',
      borderColor: 'border-red-300 dark:border-red-600',
      iconColor: 'text-red-600 animate-pulse',
      textColor: 'text-red-900 dark:text-red-100',
    },
    important: {
      icon: Star,
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/30',
      borderColor: 'border-indigo-300 dark:border-indigo-600',
      iconColor: 'text-indigo-500',
      textColor: 'text-indigo-900 dark:text-indigo-100',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in">
      <div
        role="alert"
        aria-live={type === 'urgent' ? 'assertive' : 'polite'}
        aria-atomic="true"
        className={`flex items-start space-x-3 p-4 rounded-lg border shadow-lg max-w-md ${config.bgColor} ${config.borderColor} ${
          type === 'urgent' ? 'ring-2 ring-red-400 dark:ring-red-500' : ''
        }`}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          {(type === 'urgent' || type === 'important') && (
            <p className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${
              type === 'urgent' ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'
            }`}>
              {type}
            </p>
          )}
          <p className={`text-sm font-medium ${config.textColor}`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close notification"
          className={`flex-shrink-0 ${config.textColor} hover:opacity-70 transition-opacity`}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
