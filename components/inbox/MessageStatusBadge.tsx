import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

interface MessageStatusBadgeProps {
  status: string;
  errorMessage?: string | null;
}

export default function MessageStatusBadge({ status, errorMessage }: MessageStatusBadgeProps) {
  switch (status) {
    case 'sending':
      return (
        <div className="flex items-center space-x-1 text-gray-500">
          <Clock className="w-3 h-3 animate-pulse" />
          <span className="text-xs">Sending...</span>
        </div>
      );

    case 'sent':
      return (
        <div className="flex items-center space-x-1 text-blue-500">
          <Check className="w-3 h-3" />
          <span className="text-xs">Sent</span>
        </div>
      );

    case 'delivered':
      return (
        <div className="flex items-center space-x-1 text-green-500">
          <CheckCheck className="w-3 h-3" />
          <span className="text-xs">Delivered</span>
        </div>
      );

    case 'failed':
      return (
        <div className="flex items-center space-x-1 text-red-500" title={errorMessage || 'Failed to send'}>
          <AlertCircle className="w-3 h-3" />
          <span className="text-xs">Failed</span>
        </div>
      );

    default:
      return null;
  }
}
