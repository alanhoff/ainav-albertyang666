// [lang] 段的加载骨架屏
export default function LangLoading() {
  return (
    <div className="container mx-auto px-4 py-12" aria-busy="true" aria-label="Loading">
      <div className="animate-pulse space-y-8">
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/3 mx-auto" />
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mx-auto" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
