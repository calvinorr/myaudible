'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface AuthorRelease {
  id: number
  title: string
  description?: string
  expectedDate?: string
  announcedDate: string
  publishedDate?: string
  preorderUrl?: string
  releaseStatus: string
  sourceUrl?: string
  isInterested: boolean
  isNotified: boolean
  author: {
    id: number
    name: string
    imageUrl?: string
    isFavorite: boolean
  }
}

interface ScrapingStatus {
  overview: {
    totalAuthors: number
    authorsWithScrapingSources: number
    favoriteAuthors: number
    totalReleases: number
    recentReleases: number
    scrapingCoverage: number
  }
  activity: {
    authorsScrapedToday: number
    authorsScrapedThisWeek: number
    recentlyScrapedAuthors: any[]
  }
  health: {
    status: string
    lastActivity?: string
    dailyActivityRate: number
    weeklyActivityRate: number
  }
}

interface AuthorWithSources {
  id: number
  name: string
  imageUrl?: string
  websiteUrl?: string
  rssUrl?: string
  socialUrls?: string[]
  lastScrapedAt?: string
  releasesCount: number
  hasScrapingSources: boolean
  scrapingStatus: string
  favoritedAt: string
}

function ScrapingSourcesView({ 
  authors, 
  onManageAuthor, 
  onRefreshSources 
}: { 
  authors: AuthorWithSources[]
  onManageAuthor: (author: AuthorWithSources) => void
  onRefreshSources: () => void
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scraped_today':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'scraped_this_week':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'scraped_older':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scraped_today': return 'Today'
      case 'scraped_this_week': return 'This week'
      case 'scraped_older': return 'Older'
      default: return 'Never'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Favorite Authors & Scraping Sources
        </h2>
        <button
          onClick={onRefreshSources}
          className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Refresh
        </button>
      </div>

      {authors.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">No favorite authors found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {authors.map((author) => (
            <div key={author.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {author.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {author.releasesCount} releases tracked
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(author.scrapingStatus)}`}>
                    {getStatusText(author.scrapingStatus)}
                  </span>
                  <button
                    onClick={() => onManageAuthor(author)}
                    className="text-primary-600 hover:text-primary-700 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-16 text-gray-500 dark:text-gray-400">Website:</span>
                  {author.websiteUrl ? (
                    <a 
                      href={author.websiteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 truncate flex-1"
                    >
                      {author.websiteUrl.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">Not set</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="w-16 text-gray-500 dark:text-gray-400">RSS:</span>
                  {author.rssUrl ? (
                    <a 
                      href={author.rssUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 truncate flex-1"
                    >
                      {author.rssUrl.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">Not set</span>
                  )}
                </div>

                {author.socialUrls && author.socialUrls.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="w-16 text-gray-500 dark:text-gray-400">Social:</span>
                    <div className="flex-1 space-y-1">
                      {author.socialUrls.map((url, index) => (
                        <a 
                          key={index}
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block text-primary-600 hover:text-primary-700 truncate"
                        >
                          {url.replace(/^https?:\/\//, '')}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {author.lastScrapedAt && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Last scraped:</span>
                    <span>{new Date(author.lastScrapedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AuthorWebsiteModal({ 
  author, 
  onClose, 
  onSave 
}: { 
  author: AuthorWithSources
  onClose: () => void
  onSave: (authorId: number, config: any) => Promise<void>
}) {
  const [websiteUrl, setWebsiteUrl] = useState(author.websiteUrl || '')
  const [rssUrl, setRssUrl] = useState(author.rssUrl || '')
  const [socialUrls, setSocialUrls] = useState(
    author.socialUrls ? author.socialUrls.join('\n') : ''
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const socialUrlsArray = socialUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0)

      await onSave(author.id, {
        websiteUrl: websiteUrl.trim() || null,
        rssUrl: rssUrl.trim() || null,
        socialUrls: socialUrlsArray.length > 0 ? socialUrlsArray : null
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Manage Scraping Sources
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Configure scraping sources for <strong>{author.name}</strong>
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Website URL
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://author-website.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              RSS Feed URL
            </label>
            <input
              type="url"
              value={rssUrl}
              onChange={(e) => setRssUrl(e.target.value)}
              placeholder="https://author-website.com/feed"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Social Media URLs
            </label>
            <textarea
              value={socialUrls}
              onChange={(e) => setSocialUrls(e.target.value)}
              placeholder="https://twitter.com/author&#10;https://facebook.com/author"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              One URL per line
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ReleasesPage() {
  const [releases, setReleases] = useState<AuthorRelease[]>([])
  const [scrapingStatus, setScrapingStatus] = useState<ScrapingStatus | null>(null)
  const [authorsWithSources, setAuthorsWithSources] = useState<AuthorWithSources[]>([])
  const [loading, setLoading] = useState(true)
  const [scrapingInProgress, setScrapingInProgress] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'announced' | 'preorder' | 'sources'>('all')
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorWithSources | null>(null)
  const [showManageModal, setShowManageModal] = useState(false)

  useEffect(() => {
    fetchReleases()
    fetchScrapingStatus()
    if (activeTab === 'sources') {
      fetchAuthorsWithSources()
    }
  }, [activeTab])

  const fetchReleases = async () => {
    try {
      const params = new URLSearchParams()
      if (activeTab === 'favorites') params.set('favorites', 'true')
      if (activeTab === 'announced') params.set('status', 'announced')
      if (activeTab === 'preorder') params.set('status', 'preorder')
      
      const response = await fetch(`/api/releases/upcoming?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReleases(data.releases || [])
      }
    } catch (error) {
      console.error('Error fetching releases:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchScrapingStatus = async () => {
    try {
      const response = await fetch('/api/scrape/status')
      if (response.ok) {
        const data = await response.json()
        setScrapingStatus(data)
      }
    } catch (error) {
      console.error('Error fetching scraping status:', error)
    }
  }

  const fetchAuthorsWithSources = async () => {
    try {
      const response = await fetch('/api/authors/scraping-sources')
      if (response.ok) {
        const data = await response.json()
        setAuthorsWithSources(data.authors || [])
      }
    } catch (error) {
      console.error('Error fetching authors with sources:', error)
    }
  }

  const triggerBulkScraping = async () => {
    setScrapingInProgress(true)
    try {
      const response = await fetch('/api/scrape/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scrape_favorites' })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Bulk scraping result:', data)
        // Refresh data after scraping
        setTimeout(() => {
          fetchReleases()
          fetchScrapingStatus()
        }, 1000)
      }
    } catch (error) {
      console.error('Error triggering bulk scraping:', error)
    } finally {
      setScrapingInProgress(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'announced': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'preorder': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'delayed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Upcoming Releases
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track new books from your favorite authors
            </p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <button
              onClick={triggerBulkScraping}
              disabled={scrapingInProgress}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {scrapingInProgress ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Scraping...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Scrape All Favorites
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scraping Status */}
        {scrapingStatus && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Scraping Status
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {scrapingStatus.overview.favoriteAuthors}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Favorite Authors
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {scrapingStatus.overview.authorsWithScrapingSources}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  With Scraping Sources
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {scrapingStatus.overview.totalReleases}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Releases
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {scrapingStatus.activity.authorsScrapedToday}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Scraped Today
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'all', label: 'All Releases' },
            { key: 'favorites', label: 'From Favorites' },
            { key: 'announced', label: 'Announced' },
            { key: 'preorder', label: 'Pre-order' },
            { key: 'sources', label: 'Scraping Sources' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'sources' ? (
          <ScrapingSourcesView 
            authors={authorsWithSources}
            onManageAuthor={(author) => {
              setSelectedAuthor(author)
              setShowManageModal(true)
            }}
            onRefreshSources={fetchAuthorsWithSources}
          />
        ) : (
          /* Releases Grid */
          releases.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center shadow">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No releases found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {activeTab === 'favorites' 
                  ? "No upcoming releases from your favorite authors yet. Try scraping to discover new announcements!"
                  : "No upcoming releases found. Add some favorite authors and enable scraping to track new books."
                }
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Browse Authors
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {releases.map((release) => (
                <div key={release.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {release.title}
                      </h3>
                      <Link
                        href={`/authors/${release.author.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                      >
                        {release.author.name}
                        {release.author.isFavorite && (
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        )}
                      </Link>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(release.releaseStatus)}`}>
                      {release.releaseStatus}
                    </span>
                  </div>

                  {release.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                      {release.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    {release.expectedDate && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Expected: {formatDate(release.expectedDate)}
                      </div>
                    )}
                    
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                      Announced: {formatDate(release.announcedDate)}
                    </div>
                  </div>

                  {(release.preorderUrl || release.sourceUrl) && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {release.preorderUrl && (
                        <a
                          href={release.preorderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                        >
                          Pre-order
                        </a>
                      )}
                      {release.sourceUrl && (
                        <a
                          href={release.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          Source
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Author Website Management Modal */}
        {showManageModal && selectedAuthor && (
          <AuthorWebsiteModal
            author={selectedAuthor}
            onClose={() => {
              setShowManageModal(false)
              setSelectedAuthor(null)
            }}
            onSave={async (authorId, config) => {
              try {
                const response = await fetch(`/api/authors/${authorId}/scraping-config`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(config)
                })
                if (response.ok) {
                  fetchAuthorsWithSources()
                  setShowManageModal(false)
                  setSelectedAuthor(null)
                }
              } catch (error) {
                console.error('Error saving author config:', error)
              }
            }}
          />
        )}
      </div>
    </div>
  )
}