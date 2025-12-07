export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
