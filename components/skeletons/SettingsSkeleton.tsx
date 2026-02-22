export default function SettingsSkeleton() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 bg-gray-200 dark:bg-slate-700 rounded w-28 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-64" />
          </div>
          <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-lg w-20" />
        </div>
      </div>

      {/* Billing Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
        <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-48 mb-4" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-4" />
        <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-lg w-32" />
      </div>

      {/* Connected Accounts */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
        <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-44 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-80 max-w-full mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-lg" />
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24 mb-1.5" />
                  <div className="h-3.5 bg-gray-200 dark:bg-slate-700 rounded w-40" />
                </div>
              </div>
              <div className="h-9 bg-gray-200 dark:bg-slate-700 rounded-lg w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* AI Features */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
        <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-40 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-72 max-w-full mb-6" />
        <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-40 mb-3" />
              <div className="h-3.5 bg-gray-200 dark:bg-slate-700 rounded w-full mb-2" />
              <div className="h-3.5 bg-gray-200 dark:bg-slate-700 rounded w-5/6" />
            </div>
            <div className="w-11 h-6 bg-gray-200 dark:bg-slate-700 rounded-full" />
          </div>
        </div>
      </div>

      {/* Business Info */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
        <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-44 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-3.5 bg-gray-200 dark:bg-slate-700 rounded w-28 mb-2" />
              <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-lg w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
