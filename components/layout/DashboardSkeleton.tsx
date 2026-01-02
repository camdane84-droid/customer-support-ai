'use client';

import SkeletonLoader from '@/components/ui/SkeletonLoader';

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header Skeleton */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <SkeletonLoader variant="rect" width="150px" height="32px" />
          <div className="flex items-center gap-4">
            <SkeletonLoader variant="rect" width="200px" height="40px" />
            <SkeletonLoader variant="circle" height="40px" />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Skeleton */}
        <div className="w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 h-screen p-4 space-y-2">
          <SkeletonLoader variant="rect" height="40px" count={6} className="mb-2" />
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Title */}
            <div className="mb-6">
              <SkeletonLoader variant="text" width="200px" height="32px" className="mb-2" />
              <SkeletonLoader variant="text" width="300px" height="20px" />
            </div>

            {/* Content Cards */}
            <div className="grid grid-cols-1 gap-4">
              <SkeletonLoader variant="card" count={3} className="mb-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
