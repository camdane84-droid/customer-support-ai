export default function KnowledgeBaseSkeleton() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-44 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-80 max-w-full" />
        </div>
        <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-lg w-28" />
      </div>

      {/* Knowledge Base Items */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-64" />
                  <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded-full w-16" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full" />
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6" />
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
                </div>
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-28 mt-3" />
              </div>
              <div className="flex space-x-2 ml-4">
                <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-lg" />
                <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pro Tips Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
        <div className="h-5 bg-blue-200 dark:bg-blue-800 rounded w-24 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-3.5 bg-blue-200 dark:bg-blue-800 rounded w-72 max-w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
