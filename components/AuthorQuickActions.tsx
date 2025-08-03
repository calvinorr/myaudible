'use client'

import { useState, useEffect } from 'react'

interface AuthorQuickActionsProps {
  authorId: number
  authorName: string
  className?: string
}

export default function AuthorQuickActions({ authorId, authorName, className = '' }: AuthorQuickActionsProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    checkFavoriteStatus()
  }, [authorId])

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch(`/api/authors/${authorId}`)
      if (response.ok) {
        const data = await response.json()
        setIsFavorite(data.isFavorite)
      }
    } catch (error) {
      console.error('Error checking favorite status:', error)
    } finally {
      setChecked(true)
    }
  }

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (loading) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/authors/${authorId}/favorite`, {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json()
        setIsFavorite(data.isFavorite)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!checked) {
    return null // Don't show anything while checking status
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${className} ${
        isFavorite 
          ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' 
          : 'text-gray-400 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
      title={isFavorite ? `Remove ${authorName} from favorites` : `Add ${authorName} to favorites`}
      aria-label={isFavorite ? `Remove ${authorName} from favorites` : `Add ${authorName} to favorites`}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent"></div>
      ) : (
        <svg 
          className="w-4 h-4" 
          fill={isFavorite ? "currentColor" : "none"} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
          />
        </svg>
      )}
    </button>
  )
}