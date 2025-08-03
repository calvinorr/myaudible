export default function SeriesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Series Management</h1>
        <p className="text-gray-600 dark:text-gray-300">Track your audiobook series and reading order</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Series Management Coming Soon</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Advanced series tracking with auto-detection, reading order, and completion status.
          </p>
          <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <p>• Auto-detect series from book titles</p>
            <p>• Track reading order and progress</p>
            <p>• Series completion indicators</p>
            <p>• Next-to-read recommendations</p>
          </div>
        </div>
      </div>
    </div>
  )
}