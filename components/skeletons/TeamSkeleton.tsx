export default function TeamSkeleton() {
  return (
    <div className="p-6 max-w-6xl mx-auto animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-7 bg-gray-200 dark:bg-slate-700 rounded w-44 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-72 max-w-full" />
      </div>

      {/* Invite Button */}
      <div className="mb-6">
        <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-lg w-44" />
      </div>

      {/* Team Members */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-40" />
          <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-lg" />
        </div>
        <div className="divide-y divide-gray-200 dark:divide-slate-700">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-full" />
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-48 mb-1.5" />
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-slate-700 rounded" />
                    <div className="h-3.5 bg-gray-200 dark:bg-slate-700 rounded w-16" />
                    <div className="h-3.5 bg-gray-200 dark:bg-slate-700 rounded w-28" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-lg" />
                <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-44" />
        </div>
        <div className="divide-y divide-gray-200 dark:divide-slate-700">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded" />
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-44 mb-1.5" />
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-slate-700 rounded" />
                    <div className="h-3.5 bg-gray-200 dark:bg-slate-700 rounded w-16" />
                    <div className="h-3.5 bg-gray-200 dark:bg-slate-700 rounded w-24" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-lg" />
                <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-lg" />
                <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
