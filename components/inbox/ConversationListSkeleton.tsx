export default function ConversationListSkeleton() {
  return (
    <div className="animate-pulse p-4 space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-12" />
            </div>
            <div className="h-3 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
