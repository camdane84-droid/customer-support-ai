'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ type, message, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const configs = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-500',
      textColor: 'text-green-800',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-500',
      textColor: 'text-red-800',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-500',
      textColor: 'text-yellow-800',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-500',
      textColor: 'text-blue-800',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in">
      <div
        role="alert"
        aria-live="polite"
        aria-atomic="true"
        className={`flex items-start space-x-3 p-4 rounded-lg border shadow-lg max-w-md ${config.bgColor} ${config.borderColor}`}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} aria-hidden="true" />
        <p className={`text-sm font-medium flex-1 ${config.textColor}`}>{message}</p>
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
