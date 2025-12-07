export default function MessageThreadSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header Skeleton */}
      <div className="border-b border-gray-200 bg-white p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-48" />
          </div>
          <div className="h-6 bg-gray-200 rounded-full w-16" />
        </div>
      </div>

      {/* Messages Skeleton */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 animate-pulse">
        {/* Customer message */}
        <div className="flex justify-start">
          <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-gray-200 w-64">
            <div className="h-3 bg-gray-300 rounded w-16 mb-2" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-300 rounded w-full" />
              <div className="h-3 bg-gray-300 rounded w-3/4" />
            </div>
            <div className="h-2 bg-gray-300 rounded w-20 mt-2" />
          </div>
        </div>

        {/* Business message */}
        <div className="flex justify-end">
          <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-gray-300 w-72">
            <div className="h-3 bg-gray-400 rounded w-12 mb-2" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-400 rounded w-full" />
              <div className="h-3 bg-gray-400 rounded w-5/6" />
              <div className="h-3 bg-gray-400 rounded w-2/3" />
            </div>
            <div className="h-2 bg-gray-400 rounded w-16 mt-2" />
          </div>
        </div>

        {/* Customer message */}
        <div className="flex justify-start">
          <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-gray-200 w-56">
            <div className="h-3 bg-gray-300 rounded w-16 mb-2" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-300 rounded w-full" />
            </div>
            <div className="h-2 bg-gray-300 rounded w-20 mt-2" />
          </div>
        </div>
      </div>

      {/* Reply Box Skeleton */}
      <div className="border-t border-gray-200 bg-white p-4 animate-pulse">
        <div className="h-20 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}
