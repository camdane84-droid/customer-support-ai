export default function AnalyticsSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header + Date Range */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-52 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-64" />
        </div>
        <div className="flex space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-slate-700 rounded-lg w-28" />
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div>
        <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-56 mb-4" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-300/75 dark:border-slate-700 p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-lg" />
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-12" />
              </div>
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-24 mb-2" />
              <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-16 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-28" />
            </div>
          ))}
        </div>
      </div>

      {/* Customer Intelligence Section */}
      <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-300/65 dark:border-slate-700/50 p-6">
        <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-44 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="w-9 h-9 bg-gray-200 dark:bg-slate-700 rounded-lg" />
              <div>
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-28 mb-2" />
                <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Business Operations Section */}
      <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-300/65 dark:border-slate-700/50 p-6">
        <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-40 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="w-9 h-9 bg-gray-200 dark:bg-slate-700 rounded-lg" />
              <div>
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-24 mb-2" />
                <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-14" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Section */}
      <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-300/65 dark:border-slate-700/50 p-6">
        <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-48 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="w-9 h-9 bg-gray-200 dark:bg-slate-700 rounded-lg" />
              <div>
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-28 mb-2" />
                <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Distribution */}
        <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-300/65 dark:border-slate-700/50 p-6">
          <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-40 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-20" />
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16" />
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5" />
              </div>
            ))}
          </div>
        </div>

        {/* AI Performance */}
        <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-300/65 dark:border-slate-700/50 p-6">
          <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-32 mb-6" />
          <div className="flex items-baseline justify-between mb-2">
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-32" />
            <div className="h-7 bg-gray-200 dark:bg-slate-700 rounded w-12" />
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 mb-6" />
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-slate-700">
            {[1, 2].map((i) => (
              <div key={i}>
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-24 mb-2" />
                <div className="h-7 bg-gray-200 dark:bg-slate-700 rounded w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
