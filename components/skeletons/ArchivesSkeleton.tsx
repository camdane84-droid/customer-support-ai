export default function ArchivesSkeleton() {
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-900 animate-pulse">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-lg" />
            <div>
              <div className="h-7 bg-gray-200 dark:bg-slate-700 rounded w-32 mb-1.5" />
              <div className="h-3.5 bg-gray-200 dark:bg-slate-700 rounded w-48" />
            </div>
          </div>
          <div className="h-9 bg-gray-200 dark:bg-slate-700 rounded-lg w-24" />
        </div>
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 mt-4">
          <div className="h-7 bg-gray-200 dark:bg-slate-700 rounded w-20" />
        </div>
      </div>

      {/* Category Cards */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-8 bg-white dark:bg-slate-800 rounded-lg border-2 border-gray-200 dark:border-slate-700"
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-200 dark:bg-slate-700 rounded-full mb-4" />
                <div className="h-7 bg-gray-200 dark:bg-slate-700 rounded w-28 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-36 mb-3" />
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-52" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
