'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  TrendingUp,
  MessageCircle,
  Zap,
  Star,
  BarChart2,
  Activity
} from 'lucide-react';

interface StatData {
  icon: any;
  label: string;
  value: string | number;
  subtitle: string;
  color: string;
}

interface CyclingStatProps {
  analytics: any;
}

export default function CyclingStat({ analytics }: CyclingStatProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Additional stats not shown elsewhere
  const stats: StatData[] = [
    {
      icon: Clock,
      label: 'First Response Time',
      value: analytics.avgResponseTime || 'N/A',
      subtitle: 'Average time to first reply',
      color: 'from-indigo-500 to-cyan-500'
    },
    {
      icon: Calendar,
      label: 'Busiest Hour',
      value: analytics.peakHour || 'N/A',
      subtitle: 'When most messages arrive',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: MessageCircle,
      label: 'Messages Per Day',
      value: analytics.messagesPerDay || 0,
      subtitle: 'Daily message volume',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Zap,
      label: 'AI Response Rate',
      value: `${analytics.aiUsageRate || 0}%`,
      subtitle: 'Messages using AI help',
      color: 'from-amber-500 to-yellow-500'
    },
    {
      icon: Star,
      label: 'Resolution Rate',
      value: `${analytics.resolutionRate || 0}%`,
      subtitle: 'Conversations closed successfully',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: BarChart2,
      label: 'Avg Messages/Convo',
      value: analytics.avgMessagesPerConversation || 0,
      subtitle: 'Interaction depth',
      color: 'from-indigo-500 to-blue-500'
    },
    {
      icon: Activity,
      label: 'Response Coverage',
      value: `${analytics.businessResponseRate || 0}%`,
      subtitle: 'How often you reply',
      color: 'from-teal-500 to-cyan-500'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);

      // Wait for animation to complete before changing stat
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % stats.length);
        setIsAnimating(false);
      }, 800); // Match animation duration
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [stats.length]);

  const currentStat = stats[currentIndex];
  const Icon = currentStat.icon;

  return (
    <div className="relative bg-gradient-to-r from-purple-50 to-blue-50 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-lg border-2 border-gray-300 dark:border-indigo-700/50 p-6 overflow-hidden shadow-xl dark:shadow-indigo-900/20">
      {/* Animated background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${currentStat.color} opacity-10 transition-all duration-1000`}
      />

      {/* Content with eyelid animation */}
      <div className={`relative transition-all duration-800 ${isAnimating ? 'animate-eyelid-close' : 'animate-eyelid-open'}`}>
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${currentStat.color} shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">{currentStat.label}</p>
            <p className="text-3xl font-bold dark:text-white text-gray-900 mb-1">{currentStat.value}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">{currentStat.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-2 right-2 flex space-x-1">
        {stats.map((_, index) => (
          <div
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentIndex
              ? `bg-gradient-to-br ${currentStat.color}`
              : 'bg-gray-300'
              }`}
          />
        ))}
      </div>

      {/* Cycling indicator */}
      <div className="absolute top-2 right-2">
        <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-slate-500">
          <Activity className="w-3 h-3" />
          <span>Live</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes eyelid-close {
          0% {
            clip-path: inset(0 0 0 0);
            opacity: 1;
          }
          50% {
            clip-path: inset(0 100% 0 0);
            opacity: 0.5;
          }
          75% {
            clip-path: inset(0 100% 100% 0);
            opacity: 0;
          }
          100% {
            clip-path: inset(0 100% 100% 0);
            opacity: 0;
          }
        }

        @keyframes eyelid-open {
          0% {
            clip-path: inset(100% 0 0 100%);
            opacity: 0;
          }
          25% {
            clip-path: inset(100% 0 0 0);
            opacity: 0.5;
          }
          50% {
            clip-path: inset(0 0 0 0);
            opacity: 1;
          }
          100% {
            clip-path: inset(0 0 0 0);
            opacity: 1;
          }
        }

        .animate-eyelid-close {
          animation: eyelid-close 0.8s ease-in-out forwards;
        }

        .animate-eyelid-open {
          animation: eyelid-open 0.8s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}
