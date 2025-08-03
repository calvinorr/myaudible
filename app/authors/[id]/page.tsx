'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Author, Book } from '@/types'

interface AuthorWithBooks extends Author {
  books: Book[]
  stats: {
    totalBooks: number
    completedBooks: number
    totalHours: number
    averageRating: number
  }
}

export default function AuthorPage() {
  const params = useParams()
  const authorId = params.id as string
  const [author, setAuthor] = useState<AuthorWithBooks | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  useEffect(() => {
    if (!authorId) return
    fetchAuthor()
  }, [authorId])

  const fetchAuthor = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/authors/${authorId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch author')
      }
      const data = await response.json()
      setAuthor(data.author)
      setIsFavorite(data.isFavorite)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async () => {
    if (!author) return
    
    setFavoriteLoading(true)
    try {
      const response = await fetch(`/api/authors/${author.id}/favorite`, {
        method: 'POST'
      })
      if (!response.ok) {
        throw new Error('Failed to update favorite status')
      }
      const data = await response.json()
      setIsFavorite(data.isFavorite)
    } catch (err) {
      console.error('Error toggling favorite:', err)
    } finally {
      setFavoriteLoading(false)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading author...</div>
      </div>
    )
  }

  if (error || !author) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error || 'Author not found'}</div>
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            ← Back to Library
          </Link>
        </div>
      </div>
    )
  }

  const { books, stats } = author

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
        <Link href="/" className="hover:text-gray-900 dark:hover:text-white transition-colors">
          Library
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 dark:text-white font-medium">Authors</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 dark:text-white font-medium">{author.name}</span>
      </nav>

      {/* Author Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Author Image */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl flex items-center justify-center">
                {author.imageUrl ? (
                  <Image
                    src={author.imageUrl}
                    alt={author.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <svg className="w-16 h-16 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                )}
              </div>
            </div>

            {/* Author Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{author.name}</h1>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    {stats.totalBooks} book{stats.totalBooks !== 1 ? 's' : ''} in your library
                  </p>
                </div>
                
                {/* Favorite Button */}
                <button
                  onClick={toggleFavorite}
                  disabled={favoriteLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isFavorite 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {favoriteLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent"></div>
                  ) : (
                    <svg className="w-5 h-5" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                  {isFavorite ? 'Favorited' : 'Add to Favorites'}
                </button>
              </div>

              {/* Author Bio */}
              {author.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                  {author.bio}
                </p>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stats.totalBooks}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Books</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completedBooks}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalHours}h</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.averageRating ? stats.averageRating.toFixed(1) : '—'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Books Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Books by {author.name} ({books.length})
          </h2>
        </div>

        {/* Books Grid */}
        {books.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <Link 
                key={book.id}
                href={`/books/${book.id}`} 
                className="group block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-600 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-t-xl relative overflow-hidden">
                  {book.coverUrl ? (
                    <Image 
                      src={book.coverUrl}
                      alt={book.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                      <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
                      </svg>
                    </div>
                  )}
                  
                  {/* Status badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    {book.progress === 100 && (
                      <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                        Complete
                      </div>
                    )}
                    {book.isFavorite && (
                      <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                        ♥ Favorite
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
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 text-base leading-tight group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                    {book.title}
                  </h3>
                  
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
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
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
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Books Yet</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You don&apos;t have any books by {author.name} in your library yet.
              </p>
              <Link 
                href="/add" 
                className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Add Books
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}