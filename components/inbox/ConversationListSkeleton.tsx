export default function ConversationListSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-14 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-28" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-gray-200 dark:bg-slate-700 rounded-lg" />
            <div className="w-9 h-9 bg-gray-200 dark:bg-slate-700 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="h-9 bg-gray-200 dark:bg-slate-700 rounded-lg" />
      </div>

      {/* Conversation Items */}
      <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-slate-900">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 border-l-4 border-l-transparent"
          >
            <div className="flex items-start space-x-3">
              {/* Avatar */}
              <div className="w-11 h-11 bg-gray-200 dark:bg-slate-700 rounded-full flex-shrink-0" />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24" />
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-14 ml-2" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-slate-700 rounded" />
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-12" />
                  </div>
                  <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded-full w-12" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
