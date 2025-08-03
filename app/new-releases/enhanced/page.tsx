'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useFavoriteAuthors } from '@/contexts/FavoriteAuthorsContext'

interface Release {
  id: string
  title: string
  authors: string[]
  publishedDate: string
  parsedDate: string
  description?: string
  thumbnail?: string
  isbn?: string
  pageCount?: number
  categories?: string[]
  averageRating?: number
  ratingsCount?: number
  language?: string
  previewLink?: string
  infoLink?: string
  favoriteAuthor: {
    id: number
    name: string
  }
}

interface ReleasesResponse {
  releases: Release[]
  upcoming: Release[]
  totalItems: number
  searchedAuthors: number
  dateRanges: {
    past: { start: string; end: string; days: number }
    future: { start: string; end: string; days: number }
  }
  debug: {
    currentDate: string
    favoriteAuthorsCount: number
    favoriteAuthors: string[]
  }
}

export default function EnhancedNewReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([])
  const [upcoming, setUpcoming] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pastDays, setPastDays] = useState(90)
  const [futureDays, setFutureDays] = useState(180)
  const [activeTab, setActiveTab] = useState<'recent' | 'upcoming'>('recent')
  const [debugInfo, setDebugInfo] = useState<any>(null)
  
  const { favoriteAuthorIds, loading: contextLoading } = useFavoriteAuthors()

  useEffect(() => {
    if (!contextLoading) {
      fetchReleases()
    }
  }, [pastDays, futureDays, contextLoading])

  const fetchReleases = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/new-releases/enhanced?pastDays=${pastDays}&futureDays=${futureDays}&limit=50`)
      if (!response.ok) {
        throw new Error('Failed to fetch releases')
      }
      
      const data: ReleasesResponse = await response.json()
      setReleases(data.releases)
      setUpcoming(data.upcoming)
      setDebugInfo(data.debug)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getTimeSince = (dateString: string) => {
    const now = new Date('2025-08-03') // Fixed current date
    const releaseDate = new Date(dateString)
    const diffTime = releaseDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays > 0) {
      // Future date
      if (diffDays === 1) return 'Tomorrow'
      if (diffDays < 7) return `In ${diffDays} days`
      if (diffDays < 30) return `In ${Math.floor(diffDays / 7)} weeks`
      if (diffDays < 365) return `In ${Math.floor(diffDays / 30)} months`
      return releaseDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    } else {
      // Past date
      const absDays = Math.abs(diffDays)
      if (absDays === 0) return 'Today'
      if (absDays === 1) return 'Yesterday'
      if (absDays < 7) return `${absDays} days ago`
      if (absDays < 30) return `${Math.floor(absDays / 7)} weeks ago`
      return releaseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  const pastDaysOptions = [
    { value: 30, label: 'Last 30 days' },
    { value: 60, label: 'Last 2 months' },
    { value: 90, label: 'Last 3 months' },
    { value: 180, label: 'Last 6 months' },
    { value: 365, label: 'Last year' }
  ]

  const futureDaysOptions = [
    { value: 30, label: 'Next 30 days' },
    { value: 90, label: 'Next 3 months' },
    { value: 180, label: 'Next 6 months' },
    { value: 365, label: 'Next year' }
  ]

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading favorite authors...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">New & Upcoming Releases</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Track releases from your {favoriteAuthorIds.size} favorite authors
          </p>
          {debugInfo && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Current date: {debugInfo.currentDate} • Searching: {debugInfo.favoriteAuthors.join(', ')}
            </p>
          )}
        </div>
        
        {/* Time Range Selectors */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Past:
            </label>
            <select
              value={pastDays}
              onChange={(e) => setPastDays(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            >
              {pastDaysOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Future:
            </label>
            <select
              value={futureDays}
              onChange={(e) => setFutureDays(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            >
              {futureDaysOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'recent'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Recent Releases ({releases.length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'upcoming'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Upcoming Releases ({upcoming.length})
        </button>
      </div>

      {/* Stats Cards */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-4">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{releases.length}</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Recent Releases</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl shadow-sm border border-green-200 dark:border-green-800 p-4">
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{upcoming.length}</div>
            <div className="text-sm text-green-600 dark:text-green-400">Upcoming Releases</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl shadow-sm border border-purple-200 dark:border-purple-800 p-4">
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{debugInfo?.favoriteAuthorsCount || 0}</div>
            <div className="text-sm text-purple-600 dark:text-purple-400">Authors Tracked</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl shadow-sm border border-orange-200 dark:border-orange-800 p-4">
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{releases.length + upcoming.length}</div>
            <div className="text-sm text-orange-600 dark:text-orange-400">Total Found</div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"></div>
            <span className="text-gray-600 dark:text-gray-300">Searching for releases...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200">Error loading releases</h3>
              <p className="text-red-600 dark:text-red-300">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchReleases}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty States */}
      {!loading && favoriteAuthorIds.size === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="max-w-md mx-auto">
            <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No favorite authors</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Add some favorite authors to track their releases automatically.
            </p>
            <Link
              href="/favorite-authors"
              className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Manage Favorite Authors
            </Link>
          </div>
        </div>
      )}

      {/* Results Grid */}
      {!loading && (
        <div>
          {activeTab === 'recent' && (
            <>
              {releases.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="max-w-md mx-auto">
                    <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No recent releases found</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      No new releases from your favorite authors in the last {pastDays} days.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {releases.map(release => <BookCard key={release.id} book={release} timeText={getTimeSince(release.publishedDate)} isUpcoming={false} />)}
                </div>
              )}
            </>
          )}

          {activeTab === 'upcoming' && (
            <>
              {upcoming.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="max-w-md mx-auto">
                    <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No upcoming releases found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No upcoming releases found in the next {futureDays} days.
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Some upcoming releases may not be available in Google Books yet. Check back later or visit your favorite authors&apos; websites.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcoming.map(release => <BookCard key={release.id} book={release} timeText={getTimeSince(release.publishedDate)} isUpcoming={true} />)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Footer Info */}
      {!loading && (releases.length > 0 || upcoming.length > 0) && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
          <p>Data provided by Google Books API • Updated in real-time</p>
          <p className="mt-1">Some upcoming releases may not appear until closer to publication date</p>
        </div>
      )}
    </div>
  )
}

// Book Card Component
function BookCard({ book, timeText, isUpcoming }: { book: Release; timeText: string; isUpcoming: boolean }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Book Cover */}
      <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 relative">
        {book.thumbnail ? (
          <Image
            src={book.thumbnail.replace('http:', 'https:')}
            alt={book.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
            </svg>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <div className={`text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm ${
            isUpcoming ? 'bg-green-500' : 'bg-blue-500'
          }`}>
            {isUpcoming ? 'UPCOMING' : 'NEW'}
          </div>
        </div>
      </div>

      {/* Book Details */}
      <div className="p-5">
        <div className="mb-3">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 text-lg leading-tight">
            {book.title}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              by{' '}
              <Link
                href={`/authors/${book.favoriteAuthor.id}`}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors underline decoration-1 underline-offset-2"
              >
                {book.favoriteAuthor.name}
              </Link>
            </p>
          </div>
          <p className={`text-xs mb-3 font-medium ${
            isUpcoming ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
          }`}>
            {timeText}
          </p>
        </div>

        {/* Description */}
        {book.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
            {book.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
          {book.pageCount && <span>{book.pageCount} pages</span>}
          {book.averageRating && (
            <div className="flex items-center">
              <svg className="w-3 h-3 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>{book.averageRating}</span>
            </div>
          )}
        </div>

        {/* Categories */}
        {book.categories && book.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {book.categories.slice(0, 2).map((category, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700"
              >
                {category}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {book.previewLink && (
            <a
              href={book.previewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-2 text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors text-center"
            >
              Preview
            </a>
          )}
          {book.infoLink && (
            <a
              href={book.infoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-center"
            >
              More Info
            </a>
          )}
        </div>
      </div>
    </div>
  )
}