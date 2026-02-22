export default function CannedResponsesSkeleton() {
  return (
    <div className="p-6 max-w-4xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-48 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-64" />
        </div>
        <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-lg w-36" />
      </div>

      {/* Response Cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-40" />
                  <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-14" />
                  <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-16" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full" />
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                </div>
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-24 mt-3" />
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-lg" />
                <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
