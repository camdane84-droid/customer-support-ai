export default function MessageThreadSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1">
            {/* Avatar */}
            <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-1">
                <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-32" />
                <div className="w-5 h-5 bg-gray-200 dark:bg-slate-700 rounded" />
              </div>
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-44" />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded-full w-14" />
            <div className="w-9 h-9 bg-gray-200 dark:bg-slate-700 rounded-lg" />
            <div className="w-9 h-9 bg-gray-200 dark:bg-slate-700 rounded-lg" />
            <div className="w-9 h-9 bg-gray-200 dark:bg-slate-700 rounded-lg" />
          </div>
        </div>
        {/* Tags */}
        <div className="flex gap-2 mt-2">
          <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded-full w-16" />
          <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded-full w-20" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900">
        {/* Customer message */}
        <div className="flex justify-start">
          <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 w-64">
            <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-16 mb-2" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-full" />
              <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-3/4" />
            </div>
            <div className="h-2 bg-gray-200 dark:bg-slate-600 rounded w-20 mt-2" />
          </div>
        </div>

        {/* Business message */}
        <div className="flex justify-end">
          <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-indigo-400/30 dark:bg-indigo-900/40 w-72">
            <div className="h-3 bg-indigo-300/50 dark:bg-indigo-700/50 rounded w-12 mb-2" />
            <div className="space-y-2">
              <div className="h-3 bg-indigo-300/50 dark:bg-indigo-700/50 rounded w-full" />
              <div className="h-3 bg-indigo-300/50 dark:bg-indigo-700/50 rounded w-5/6" />
              <div className="h-3 bg-indigo-300/50 dark:bg-indigo-700/50 rounded w-2/3" />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="h-2 bg-indigo-300/50 dark:bg-indigo-700/50 rounded w-16" />
              <div className="h-2 bg-indigo-300/50 dark:bg-indigo-700/50 rounded w-10" />
            </div>
          </div>
        </div>

        {/* Customer message */}
        <div className="flex justify-start">
          <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 w-56">
            <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-16 mb-2" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-full" />
            </div>
            <div className="h-2 bg-gray-200 dark:bg-slate-600 rounded w-20 mt-2" />
          </div>
        </div>

        {/* Business message */}
        <div className="flex justify-end">
          <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-indigo-400/30 dark:bg-indigo-900/40 w-60">
            <div className="h-3 bg-indigo-300/50 dark:bg-indigo-700/50 rounded w-12 mb-2" />
            <div className="space-y-2">
              <div className="h-3 bg-indigo-300/50 dark:bg-indigo-700/50 rounded w-full" />
              <div className="h-3 bg-indigo-300/50 dark:bg-indigo-700/50 rounded w-4/5" />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="h-2 bg-indigo-300/50 dark:bg-indigo-700/50 rounded w-16" />
              <div className="h-2 bg-indigo-300/50 dark:bg-indigo-700/50 rounded w-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Reply Box */}
      <div className="border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <div className="flex space-x-3">
          <div className="flex-1 h-20 bg-gray-200 dark:bg-slate-700 rounded-lg" />
          <div className="w-20 h-11 bg-gray-200 dark:bg-slate-700 rounded-lg" />
        </div>
        <div className="flex items-center space-x-2 mt-3">
          <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded-lg w-28" />
        </div>
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-56 mt-3" />
      </div>
    </div>
  );
}
