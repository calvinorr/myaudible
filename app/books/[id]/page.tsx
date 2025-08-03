'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Book } from '@/types'
import AuthorQuickActions from '@/components/AuthorQuickActions'

export default function BookDetailPage() {
  const params = useParams()
  const bookId = params.id as string
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [tempNotes, setTempNotes] = useState('')

  useEffect(() => {
    if (!bookId) return
    fetchBook()
  }, [bookId])

  const fetchBook = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/books/${bookId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch book')
      }
      const data = await response.json()
      setBook(data.book)
      setTempNotes(data.book.personalNotes || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateBook = async (updates: Partial<Book>) => {
    if (!book || updating) return
    
    setUpdating(true)
    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update book')
      }
      
      const data = await response.json()
      setBook(data.book)
    } catch (err) {
      console.error('Error updating book:', err)
    } finally {
      setUpdating(false)
    }
  }

  const handleProgressChange = (newProgress: number) => {
    updateBook({ progress: newProgress })
  }

  const handleRatingChange = (rating: number) => {
    updateBook({ personalRating: rating })
  }

  const handleFavoriteToggle = () => {
    if (book) {
      updateBook({ isFavorite: !book.isFavorite })
    }
  }

  const handleCompletedToggle = () => {
    if (book) {
      updateBook({ isCompleted: !book.isCompleted })
    }
  }

  const saveNotes = () => {
    updateBook({ personalNotes: tempNotes })
    setEditingNotes(false)
  }

  const cancelNotes = () => {
    setTempNotes(book?.personalNotes || '')
    setEditingNotes(false)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading book...</div>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error || 'Book not found'}</div>
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            ← Back to Library
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
        <Link href="/" className="hover:text-gray-900 dark:hover:text-white transition-colors">
          Library
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 dark:text-white font-medium truncate">{book.title}</span>
      </nav>

      {/* Main Book Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Book Cover and Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
            {/* Book Cover */}
            <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl relative overflow-hidden mb-6">
              {book.coverUrl ? (
                <Image 
                  src={book.coverUrl}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                  <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
                  </svg>
                </div>
              )}
              
              {/* Status Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {book.isCompleted && (
                  <div className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                    Complete
                  </div>
                )}
                {book.isFavorite && (
                  <div className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                    ♥ Favorite
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <button
                onClick={handleFavoriteToggle}
                disabled={updating}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                  book.isFavorite 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <svg className="w-5 h-5" fill={book.isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {book.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </button>

              <button
                onClick={handleCompletedToggle}
                disabled={updating}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                  book.isCompleted 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {book.isCompleted ? 'Mark as Not Complete' : 'Mark as Complete'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Book Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{book.title}</h1>
                {book.subtitle && (
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-3">{book.subtitle}</p>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-lg text-gray-700 dark:text-gray-300">
                    by{' '}
                    <Link 
                      href={`/authors/${book.authorId}`}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors underline decoration-1 underline-offset-2"
                    >
                      {book.author.name}
                    </Link>
                  </p>
                  <AuthorQuickActions 
                    authorId={book.authorId} 
                    authorName={book.author.name}
                  />
                </div>
                {book.narrator && (
                  <p className="text-gray-600 dark:text-gray-400">
                    Narrated by {book.narrator.name}
                  </p>
                )}
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatDuration(book.duration)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Genre</p>
                <p className="font-semibold text-gray-900 dark:text-white">{book.genre?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Release Date</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatDate(book.releaseDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Added</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatDate(book.addedAt)}</p>
              </div>
            </div>

            {/* Series Info */}
            {book.series && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    Part of series: <strong>{book.series}</strong>
                    {book.seriesOrder && <span> (Book #{book.seriesOrder})</span>}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Progress Tracking */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Progress Tracking</h2>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>{book.progress}% complete</span>
                <span>{formatDuration(book.duration * book.progress / 100)} / {formatDuration(book.duration)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${book.progress}%` }}
                />
              </div>
            </div>

            {/* Progress Slider */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Update Progress
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={book.progress}
                onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                disabled={updating}
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Personal Rating
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingChange(star)}
                    disabled={updating}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg 
                      className={`w-6 h-6 ${
                        star <= (book.personalRating || 0) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300 dark:text-gray-600'
                      }`} 
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {book.personalRating ? `${book.personalRating}/5` : 'Not rated'}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {book.description && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Description</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{book.description}</p>
            </div>
          )}

          {/* Personal Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Personal Notes</h2>
              {!editingNotes && (
                <button
                  onClick={() => setEditingNotes(true)}
                  className="px-3 py-1 text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
            
            {editingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  placeholder="Add your personal notes about this book..."
                  className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 min-h-[120px] resize-y"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveNotes}
                    disabled={updating}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Notes
                  </button>
                  <button
                    onClick={cancelNotes}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-700 dark:text-gray-300">
                {book.personalNotes ? (
                  <p className="whitespace-pre-wrap">{book.personalNotes}</p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">No notes yet. Click Edit to add your thoughts about this book.</p>
                )}
              </div>
            )}
          </div>

          {/* Additional Metadata */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {book.publisher && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Publisher</p>
                  <p className="font-medium text-gray-900 dark:text-white">{book.publisher}</p>
                </div>
              )}
              {book.isbn && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">ISBN</p>
                  <p className="font-medium text-gray-900 dark:text-white">{book.isbn}</p>
                </div>
              )}
              {book.asin && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">ASIN</p>
                  <p className="font-medium text-gray-900 dark:text-white">{book.asin}</p>
                </div>
              )}
              {book.language && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Language</p>
                  <p className="font-medium text-gray-900 dark:text-white">{book.language}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}