export default function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-96 max-w-full" />
      </div>

      {/* Quick Actions Skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
        <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-32 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-slate-700 rounded-lg"
            >
              <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24" />
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Conversations Skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-48" />
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16" />
        </div>
        <div className="divide-y divide-gray-200 dark:divide-slate-700">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-full" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-32" />
                      <div className="w-5 h-5 bg-gray-200 dark:bg-slate-700 rounded" />
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-40" />
                  </div>
                </div>
                <div className="text-right space-y-2 flex items-center gap-3">
                  <div>
                    <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded-full w-14" />
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-20 mt-2" />
                  </div>
                  <div className="w-4 h-4 bg-gray-200 dark:bg-slate-700 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
