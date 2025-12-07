export default function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-96" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-8 bg-gray-200 rounded w-16" />
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Conversations Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-48" />
        </div>
        <div className="divide-y divide-gray-200">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32" />
                    <div className="h-3 bg-gray-200 rounded w-24" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-6 bg-gray-200 rounded-full w-16" />
                  <div className="h-3 bg-gray-200 rounded w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
