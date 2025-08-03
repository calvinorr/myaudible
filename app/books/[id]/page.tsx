export default function BookDetailPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Book Details</h1>
        <p className="text-gray-600 dark:text-gray-300">View and manage individual book information</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Book Details Coming Soon</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Detailed book view with progress tracking, notes, and metadata management.
          </p>
          <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <p>• Complete book metadata display</p>
            <p>• Progress tracking and history</p>
            <p>• Personal notes and ratings</p>
            <p>• Series information and navigation</p>
          </div>
        </div>
      </div>
    </div>
  )
}