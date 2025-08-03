export default function NewReleasesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">New Releases</h1>
        <p className="text-gray-600 dark:text-gray-300">Track new releases from your favorite authors</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">New Release Tracking Coming Soon</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Stay updated with the latest releases from authors in your library.
          </p>
          <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <p>• Author release monitoring</p>
            <p>• Google Books API integration</p>
            <p>• Release date notifications</p>
            <p>• Wishlist and pre-order tracking</p>
          </div>
        </div>
      </div>
    </div>
  )
}