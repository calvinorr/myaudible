'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useFavoriteAuthors } from '@/contexts/FavoriteAuthorsContext'
import AuthorSearch from '@/components/AuthorSearch'

interface FavoriteAuthor {
  id: number
  authorId: number
  createdAt: string
  author: {
    id: number
    name: string
    _count: {
      books: number
    }
  }
}

export default function FavoriteAuthorsPage() {
  const { favoriteAuthorIds, toggleFavorite, loading } = useFavoriteAuthors()
  const [favoriteAuthors, setFavoriteAuthors] = useState<FavoriteAuthor[]>([])
  const [authorsLoading, setAuthorsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch detailed favorite authors data
  useEffect(() => {
    const fetchFavoriteAuthors = async () => {
      try {
        setAuthorsLoading(true)
        const response = await fetch('/api/authors/favorites')
        if (response.ok) {
          const data = await response.json()
          setFavoriteAuthors(data.favoriteAuthors)
        }
      } catch (error) {
        console.error('Error fetching favorite authors:', error)
      } finally {
        setAuthorsLoading(false)
      }
    }

    if (!loading) {
      fetchFavoriteAuthors()
    }
  }, [loading])

  const handleRemoveFavorite = async (authorId: number) => {
    await toggleFavorite(authorId)
    // Update local state
    setFavoriteAuthors(prev => prev.filter(fa => fa.authorId !== authorId))
  }

  const handleAuthorSelect = (author: any) => {
    // Redirect to author page (handled by AuthorSearch component)
  }

  const filteredAuthors = favoriteAuthors.filter(fa =>
    fa.author.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading || authorsLoading) {
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Favorite Authors</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your favorite authors and track their new releases
          </p>
        </div>
        
        {/* Add New Author Search */}
        <div className="w-full sm:w-80">
          <AuthorSearch 
            placeholder="Add new favorite author..."
            onSelect={handleAuthorSelect}
          />
        </div>
      </div>

      {/* Search & Filter */}
      {favoriteAuthors.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Filter favorite authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredAuthors.length} of {favoriteAuthors.length} authors
            </div>
          </div>
        </div>
      )}

      {/* Favorite Authors List */}
      {favoriteAuthors.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="max-w-md mx-auto">
            <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No favorite authors yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Start by adding authors you love to track their new releases and find their books quickly.
            </p>
            <div className="max-w-sm mx-auto">
              <AuthorSearch 
                placeholder="Search for authors to add..."
                onSelect={handleAuthorSelect}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuthors.map((favoriteAuthor) => (
            <div
              key={favoriteAuthor.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Link
                    href={`/authors/${favoriteAuthor.authorId}`}
                    className="text-xl font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors block"
                  >
                    {favoriteAuthor.author.name}
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {favoriteAuthor.author._count.books} book{favoriteAuthor.author._count.books !== 1 ? 's' : ''} in library
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveFavorite(favoriteAuthor.authorId)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-all duration-200"
                  title={`Remove ${favoriteAuthor.author.name} from favorites`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Added {formatDate(favoriteAuthor.createdAt)}</span>
                <Link
                  href={`/authors/${favoriteAuthor.authorId}`}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                >
                  View Books →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {favoriteAuthors.length > 0 && (
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl shadow-sm border border-primary-200 dark:border-primary-800 p-6">
          <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                {favoriteAuthors.length}
              </div>
              <div className="text-sm text-primary-600 dark:text-primary-400">Favorite Authors</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                {favoriteAuthors.reduce((total, fa) => total + fa.author._count.books, 0)}
              </div>
              <div className="text-sm text-primary-600 dark:text-primary-400">Total Books</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                {(favoriteAuthors.reduce((total, fa) => total + fa.author._count.books, 0) / favoriteAuthors.length).toFixed(1)}
              </div>
              <div className="text-sm text-primary-600 dark:text-primary-400">Avg Books per Author</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}