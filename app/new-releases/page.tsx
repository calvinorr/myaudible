'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useFavoriteAuthors } from '@/contexts/FavoriteAuthorsContext'

interface NewRelease {
  id: string
  title: string
  authors: string[]
  publishedDate: string
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

interface NewReleasesResponse {
  releases: NewRelease[]
  totalItems: number
  searchedAuthors: number
  dateRange: {
    start: string
    end: string
    days: number
  }
  message?: string
}

export default function NewReleasesPage() {
  const [releases, setReleases] = useState<NewRelease[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDays, setSelectedDays] = useState(30)
  const [searchedAuthors, setSearchedAuthors] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  
  const { favoriteAuthorIds, loading: contextLoading } = useFavoriteAuthors()

  useEffect(() => {
    if (!contextLoading) {
      fetchNewReleases()
    }
  }, [selectedDays, contextLoading])

  const fetchNewReleases = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/new-releases?days=${selectedDays}&limit=50`)
      if (!response.ok) {
        throw new Error('Failed to fetch new releases')
      }
      
      const data: NewReleasesResponse = await response.json()
      setReleases(data.releases)
      setSearchedAuthors(data.searchedAuthors)
      setMessage(data.message || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getTimeSince = (dateString: string) => {
    const now = new Date()
    const publishDate = new Date(dateString)
    const diffTime = Math.abs(now.getTime() - publishDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 14) return '1 week ago'
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return formatDate(dateString)
  }

  const dayOptions = [
    { value: 7, label: 'Last 7 days' },
    { value: 14, label: 'Last 2 weeks' },
    { value: 30, label: 'Last 30 days' },
    { value: 60, label: 'Last 2 months' },
    { value: 90, label: 'Last 3 months' }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">New Releases</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Track new releases from your {favoriteAuthorIds.size} favorite authors
          </p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Time Range:
          </label>
          <select
            value={selectedDays}
            onChange={(e) => setSelectedDays(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
          >
            {dayOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Card */}
      {!loading && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {releases.length}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">New Releases Found</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {searchedAuthors}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Authors Searched</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {selectedDays}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Days Searched</div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"></div>
            <span className="text-gray-600 dark:text-gray-300">Searching for new releases...</span>
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
              <h3 className="font-semibold text-red-800 dark:text-red-200">Error loading new releases</h3>
              <p className="text-red-600 dark:text-red-300">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchNewReleases}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* No Favorite Authors */}
      {!loading && favoriteAuthorIds.size === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="max-w-md mx-auto">
            <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No favorite authors</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Add some favorite authors to track their new releases automatically.
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

      {/* No Releases Found */}
      {!loading && !error && releases.length === 0 && favoriteAuthorIds.size > 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="max-w-md mx-auto">
            <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No new releases found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No new releases from your favorite authors in the last {selectedDays} days.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Try extending the search range or check back later for new releases.
            </p>
          </div>
        </div>
      )}

      {/* New Releases Grid */}
      {!loading && releases.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {releases.map((release) => (
            <div
              key={release.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-200"
            >
              {/* Book Cover */}
              <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 relative">
                {release.thumbnail ? (
                  <Image
                    src={release.thumbnail.replace('http:', 'https:')}
                    alt={release.title}
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
                
                {/* New Badge */}
                <div className="absolute top-3 left-3">
                  <div className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                    NEW
                  </div>
                </div>
              </div>

              {/* Book Details */}
              <div className="p-5">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 text-lg leading-tight">
                    {release.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                      by{' '}
                      <Link
                        href={`/authors/${release.favoriteAuthor.id}`}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors underline decoration-1 underline-offset-2"
                      >
                        {release.favoriteAuthor.name}
                      </Link>
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Published {getTimeSince(release.publishedDate)}
                  </p>
                </div>

                {/* Description */}
                {release.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                    {release.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  {release.pageCount && (
                    <span>{release.pageCount} pages</span>
                  )}
                  {release.averageRating && (
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <span>{release.averageRating}</span>
                    </div>
                  )}
                </div>

                {/* Categories */}
                {release.categories && release.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {release.categories.slice(0, 2).map((category, index) => (
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
                  {release.previewLink && (
                    <a
                      href={release.previewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-2 text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors text-center"
                    >
                      Preview
                    </a>
                  )}
                  {release.infoLink && (
                    <a
                      href={release.infoLink}
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
          ))}
        </div>
      )}

      {/* Footer Info */}
      {!loading && releases.length > 0 && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
          <p>Data provided by Google Books API • Updated in real-time</p>
        </div>
      )}
    </div>
  )
}