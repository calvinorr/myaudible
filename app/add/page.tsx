export default function AddBookPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Add New Book</h1>
        <p className="text-gray-600 dark:text-gray-300">Add a new audiobook to your library</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Add Book Feature Coming Soon</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This feature will allow you to add new audiobooks with metadata, cover images, and reading progress tracking.
          </p>
          <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <p>• Manual book entry form</p>
            <p>• Google Books API integration for metadata</p>
            <p>• Cover image upload and management</p>
            <p>• Author and narrator management</p>
          </div>
        </div>
      </div>
    </div>
  )
}