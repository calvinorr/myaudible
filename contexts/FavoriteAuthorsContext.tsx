'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface FavoriteAuthorsContextType {
  favoriteAuthorIds: Set<number>
  isFavorite: (authorId: number) => boolean
  toggleFavorite: (authorId: number) => Promise<boolean>
  loading: boolean
}

const FavoriteAuthorsContext = createContext<FavoriteAuthorsContextType | undefined>(undefined)

export function FavoriteAuthorsProvider({ children }: { children: ReactNode }) {
  const [favoriteAuthorIds, setFavoriteAuthorIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  // Fetch all favorite authors once on mount
  useEffect(() => {
    fetchFavoriteAuthors()
  }, [])

  const fetchFavoriteAuthors = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/authors/favorites')
      if (response.ok) {
        const data = await response.json()
        const favoriteIds = new Set<number>(data.favoriteAuthors.map((author: any) => author.authorId as number))
        setFavoriteAuthorIds(favoriteIds)
      }
    } catch (error) {
      console.error('Error fetching favorite authors:', error)
    } finally {
      setLoading(false)
    }
  }

  const isFavorite = (authorId: number): boolean => {
    return favoriteAuthorIds.has(authorId)
  }

  const toggleFavorite = async (authorId: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/authors/${authorId}/favorite`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        const newFavoriteStatus = data.isFavorite
        
        // Update local cache
        setFavoriteAuthorIds(prev => {
          const newSet = new Set(prev)
          if (newFavoriteStatus) {
            newSet.add(authorId)
          } else {
            newSet.delete(authorId)
          }
          return newSet
        })
        
        return newFavoriteStatus
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
    
    return favoriteAuthorIds.has(authorId)
  }

  return (
    <FavoriteAuthorsContext.Provider 
      value={{ 
        favoriteAuthorIds, 
        isFavorite, 
        toggleFavorite, 
        loading 
      }}
    >
      {children}
    </FavoriteAuthorsContext.Provider>
  )
}

export function useFavoriteAuthors() {
  const context = useContext(FavoriteAuthorsContext)
  if (context === undefined) {
    throw new Error('useFavoriteAuthors must be used within a FavoriteAuthorsProvider')
  }
  return context
}