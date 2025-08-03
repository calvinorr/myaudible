'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Book } from '@/types'
import AuthorQuickActions from '@/components/AuthorQuickActions'
import AuthorSearch from '@/components/AuthorSearch'

function BookCard({ book }: { book: Book }) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <Link 
      href={`/books/${book.id}`} 
      className="group block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-600 transition-all duration-300 hover:-translate-y-1"
    >
      <div className="aspect-[2/3] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-t-xl relative overflow-hidden">
        {book.coverUrl ? (
          <Image 
            src={book.coverUrl}
            alt={book.title}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-300 p-1"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
            </svg>
          </div>
        )}
        
        {/* Status badges - positioned at top right */}
        <div className="absolute top-2 right-2 flex flex-row gap-1">
          {book.progress === 100 && (
            <div className="bg-green-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
              ✓
            </div>
          )}
          {book.isFavorite && (
            <div className="bg-red-500/90 backdrop-blur-sm text-white text-xs px-1.5 py-1 rounded-full font-medium shadow-lg">
              ♥
            </div>
          )}
        </div>

        {/* Progress indicator */}
        {book.progress > 0 && book.progress < 100 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div 
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${book.progress}%` }}
            />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 text-base leading-tight group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
            {book.title}
          </h3>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              by{' '}
              <Link 
                href={`/authors/${book.authorId}`}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors underline decoration-1 underline-offset-2"
                onClick={(e) => e.stopPropagation()}
              >
                {book.author.name}
              </Link>
            </p>
            <AuthorQuickActions 
              authorId={book.authorId} 
              authorName={book.author.name}
              className="ml-1"
            />
          </div>
          {book.narrator && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Narrated by {book.narrator.name}
            </p>
          )}
        </div>

        {/* Progress bar for in-progress books */}
        {book.progress > 0 && book.progress < 100 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>{book.progress}% complete</span>
              <span>{formatDuration(book.duration * book.progress / 100)} / {formatDuration(book.duration)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${book.progress}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
            <span className="font-medium">{formatDuration(book.duration)}</span>
          </div>
          {book.personalRating && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="font-medium">{book.personalRating}</span>
            </div>
          )}
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {book.series && (
            <Link 
              href="/series"
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {book.series}
              {book.seriesOrder && ` #${book.seriesOrder}`}
            </Link>
          )}
          {book.genre && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700">
              {book.genre.name}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searching, setSearching] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [stats, setStats] = useState({
    totalBooks: 0,
    completedBooks: 0,
    totalHours: 0,
    currentlyReading: 0
  })
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [sortBy, setSortBy] = useState('addedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filters, setFilters] = useState({
    minDuration: '',
    maxDuration: '',
    releaseYear: '',
    series: '',
    narrator: '',
    genre: ''
  })
  const ITEMS_PER_PAGE = 24

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/stats')
      if (response.ok) {
        const statsData = await response.json()
        setStats(statsData)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }, [])

  const fetchBooks = useCallback(async (isSearch = false, loadMore = false) => {
    if (isSearch) {
      setSearching(true)
    } else if (loadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') {
        if (statusFilter === 'reading') params.append('status', 'reading')
        else if (statusFilter === 'completed') params.append('status', 'completed')
        else if (statusFilter === 'not_started') params.append('status', 'not_started')
      }
      
      // Advanced filters
      if (filters.minDuration) params.append('minDuration', filters.minDuration)
      if (filters.maxDuration) params.append('maxDuration', filters.maxDuration)
      if (filters.releaseYear) params.append('releaseYear', filters.releaseYear)
      if (filters.series) params.append('series', filters.series)
      if (filters.narrator) params.append('narrator', filters.narrator)
      if (filters.genre) params.append('genre', filters.genre)
      
      // Sorting
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)
      
      const offset = loadMore ? (currentPage - 1) * ITEMS_PER_PAGE : 0
      params.append('limit', ITEMS_PER_PAGE.toString())
      params.append('offset', offset.toString())

      const response = await fetch(`/api/books?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch books')
      }
      const data = await response.json()
      
      if (loadMore) {
        setBooks(prev => [...prev, ...data.books])
      } else {
        setBooks(data.books)
        setCurrentPage(1)
      }
      
      setTotalCount(data.totalCount || data.books.length)
      setHasMore(data.hasMore || false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setSearching(false)
      setLoadingMore(false)
    }
  }, [searchTerm, statusFilter, filters, sortBy, sortOrder, currentPage, ITEMS_PER_PAGE])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks(!!searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [fetchBooks, searchTerm])

  useEffect(() => {
    fetchStats()
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value)
  }

  const handleFilterChange = (filterKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }))
  }

  const handleSortChange = (newSortBy: string) => {
    if (newSortBy === sortBy) {
      // Toggle sort order if same field
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, set default order
      setSortBy(newSortBy)
      setSortOrder(newSortBy === 'title' || newSortBy === 'author' ? 'asc' : 'desc')
    }
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setSortBy('addedAt')
    setSortOrder('desc')
    setFilters({
      minDuration: '',
      maxDuration: '',
      releaseYear: '',
      series: '',
      narrator: '',
      genre: ''
    })
  }

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || sortBy !== 'addedAt' || sortOrder !== 'desc' || Object.values(filters).some(v => v !== '')

  const loadMoreBooks = useCallback(() => {
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    
    setLoadingMore(true)
    
    const params = new URLSearchParams()
    if (searchTerm) params.append('search', searchTerm)
    if (statusFilter !== 'all') {
      if (statusFilter === 'reading') params.append('status', 'reading')
      else if (statusFilter === 'completed') params.append('status', 'completed')
      else if (statusFilter === 'not_started') params.append('status', 'not_started')
    }
    
    // Advanced filters
    if (filters.minDuration) params.append('minDuration', filters.minDuration)
    if (filters.maxDuration) params.append('maxDuration', filters.maxDuration)
    if (filters.releaseYear) params.append('releaseYear', filters.releaseYear)
    if (filters.series) params.append('series', filters.series)
    if (filters.narrator) params.append('narrator', filters.narrator)
    if (filters.genre) params.append('genre', filters.genre)
    
    // Sorting
    params.append('sortBy', sortBy)
    params.append('sortOrder', sortOrder)
    
    const offset = (nextPage - 1) * ITEMS_PER_PAGE
    params.append('limit', ITEMS_PER_PAGE.toString())
    params.append('offset', offset.toString())

    fetch(`/api/books?${params.toString()}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch more books')
        return response.json()
      })
      .then(data => {
        setBooks(prev => [...prev, ...data.books])
        setHasMore(data.hasMore || false)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to load more books')
        setCurrentPage(prev => prev - 1) // Revert page on error
      })
      .finally(() => {
        setLoadingMore(false)
      })
  }, [currentPage, searchTerm, statusFilter, filters, sortBy, sortOrder, ITEMS_PER_PAGE])

  // Stats are now loaded from API in state

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading your library...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Your Library</h1>
          <p className="text-gray-600 dark:text-gray-300">Discover, track, and enjoy your audiobook collection</p>
        </div>
        
        <div className="flex items-start gap-4">
          {/* Quick Author Search */}
          <div className="w-80">
            <AuthorSearch 
              placeholder="Quick author search..."
              className="w-full"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
          <Link
            href="/new-releases"
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            New Releases
          </Link>
          <Link 
            href="/add" 
            className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Book
          </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl shadow-sm border border-primary-200 dark:border-primary-800 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-700 dark:text-primary-300 mb-1">Total Books</p>
              <p className="text-3xl font-bold text-primary-900 dark:text-primary-100">{stats.totalBooks}</p>
              <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">In your library</p>
            </div>
            <div className="bg-primary-500 rounded-xl p-3">
              <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl shadow-sm border border-green-200 dark:border-green-800 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.completedBooks}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {stats.totalBooks > 0 ? Math.round((stats.completedBooks / stats.totalBooks) * 100) : 0}% of library
              </p>
            </div>
            <div className="bg-green-500 rounded-xl p-3">
              <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Total Hours</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.totalHours}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Of content</p>
            </div>
            <div className="bg-blue-500 rounded-xl p-3">
              <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl shadow-sm border border-amber-200 dark:border-amber-800 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">In Progress</p>
              <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">{stats.currentlyReading}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Currently reading</p>
            </div>
            <div className="bg-amber-500 rounded-xl p-3">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C20.832 18.477 19.247 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by title, author, narrator..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-sm"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent"></div>
              </div>
            )}
            {!searching && searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            {/* Status Filter */}
            <div className="relative">
              <select 
                value={statusFilter} 
                onChange={handleStatusFilterChange}
                className="appearance-none px-4 py-3 pr-10 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-sm min-w-[160px]"
              >
                <option value="all">All Books</option>
                <option value="reading">Currently Reading</option>
                <option value="completed">Completed</option>
                <option value="not_started">Not Started</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Sort Controls */}
            <div className="flex bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
              {[
                { key: 'addedAt', label: 'Recently Added', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                { key: 'title', label: 'Title A-Z', icon: 'M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12' },
                { key: 'author', label: 'Author A-Z', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                { key: 'releaseDate', label: 'Release Date', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                { key: 'duration', label: 'Duration', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                { key: 'personalRating', label: 'Rating', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' }
              ].map((sort) => (
                <button
                  key={sort.key}
                  onClick={() => handleSortChange(sort.key)}
                  className={`px-3 py-3 text-xs font-medium transition-all duration-200 flex items-center gap-1.5 min-w-0 ${
                    sortBy === sort.key
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-r border-primary-200 dark:border-primary-700'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border-r border-gray-200 dark:border-gray-600'
                  } last:border-r-0`}
                  title={`Sort by ${sort.label} ${sortBy === sort.key ? (sortOrder === 'asc' ? '↑' : '↓') : ''}`}
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sort.icon} />
                  </svg>
                  <span className="hidden sm:inline truncate">{sort.label}</span>
                  {sortBy === sort.key && (
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortOrder === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Advanced Filters
            {Object.values(filters).some(v => v !== '') && (
              <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 text-xs px-2 py-1 rounded-full">
                {Object.values(filters).filter(v => v !== '').length}
              </span>
            )}
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear all filters
            </button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Duration Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duration (hours)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minDuration}
                    onChange={(e) => handleFilterChange('minDuration', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                  <span className="text-gray-500 dark:text-gray-400 self-center">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxDuration}
                    onChange={(e) => handleFilterChange('maxDuration', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                </div>
              </div>

              {/* Release Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Release Year</label>
                <input
                  type="number"
                  placeholder="e.g., 2023"
                  value={filters.releaseYear}
                  onChange={(e) => handleFilterChange('releaseYear', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>

              {/* Series */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Series</label>
                <input
                  type="text"
                  placeholder="Series name"
                  value={filters.series}
                  onChange={(e) => handleFilterChange('series', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>

              {/* Narrator */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Narrator</label>
                <input
                  type="text"
                  placeholder="Narrator name"
                  value={filters.narrator}
                  onChange={(e) => handleFilterChange('narrator', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>

              {/* Genre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Genre</label>
                <input
                  type="text"
                  placeholder="Genre name"
                  value={filters.genre}
                  onChange={(e) => handleFilterChange('genre', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Results Info */}
      {(searchTerm || statusFilter !== 'all') && !loading && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
          <div>
            Showing {books.length} of {totalCount} books
            {searchTerm && <span> for &ldquo;{searchTerm}&rdquo;</span>}
            {statusFilter !== 'all' && <span> • {statusFilter.replace('_', ' ')}</span>}
          </div>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
              }}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Books Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {books.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No books in your library yet.</p>
            <Link 
              href="/add" 
              className="mt-4 inline-block bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Add Your First Book
            </Link>
          </div>
        ) : (
          books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))
        )}
      </div>

      {/* Load More / Pagination */}
      {hasMore && books.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMoreBooks}
            disabled={loadingMore}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Loading more books...
              </>
            ) : (
              <>
                Load More Books
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}

      {/* Pagination Info */}
      {totalCount > ITEMS_PER_PAGE && (
        <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-300">
          Showing {books.length} of {totalCount} books
        </div>
      )}
    </div>
  )
}