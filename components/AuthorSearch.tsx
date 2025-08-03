'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'

interface AuthorResult {
  id: number
  name: string
  bookCount: number
  isFavorite: boolean
}

interface AuthorSearchProps {
  placeholder?: string
  className?: string
  onSelect?: (author: AuthorResult) => void
}

export default function AuthorSearch({ 
  placeholder = "Search authors...", 
  className = "",
  onSelect 
}: AuthorSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AuthorResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [error, setError] = useState<string | null>(null)
  
  const debouncedQuery = useDebounce(query, 300)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const router = useRouter()

  // Search for authors when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      searchAuthors(debouncedQuery)
    } else {
      setResults([])
      setIsOpen(false)
      setError(null)
    }
  }, [debouncedQuery])

  // Handle clicks outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Cancel any ongoing request when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const searchAuthors = async (searchQuery: string) => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        `/api/authors/search?q=${encodeURIComponent(searchQuery)}&limit=8`,
        { signal: abortControllerRef.current.signal }
      )
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Check if the request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return
      }
      
      setResults(data.authors || [])
      setIsOpen((data.authors || []).length > 0)
      setError(null)
      
    } catch (error) {
      // Don't show error if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      
      console.error('Error searching authors:', error)
      setError('Failed to search authors. Please try again.')
      setResults([])
      setIsOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      // Handle Enter key when dropdown is closed but has query
      if (e.key === 'Enter' && query.trim()) {
        e.preventDefault()
        // Trigger search immediately
        searchAuthors(query)
        return
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          results.length > 0 ? (prev < results.length - 1 ? prev + 1 : 0) : -1
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          results.length > 0 ? (prev > 0 ? prev - 1 : results.length - 1) : -1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          selectAuthor(results[selectedIndex])
        } else if (results.length === 1) {
          // If only one result, select it
          selectAuthor(results[0])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        setError(null)
        inputRef.current?.blur()
        break
    }
  }

  const selectAuthor = (author: AuthorResult) => {
    if (onSelect) {
      onSelect(author)
    } else {
      router.push(`/authors/${author.id}`)
    }
    setQuery('')
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100">
          {part}
        </span>
      ) : (
        part
      )
    )
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true)
          }}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 pr-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
        />
        
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border border-gray-400 border-t-transparent"></div>
          ) : (
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {results.map((author, index) => (
            <button
              key={author.id}
              onClick={() => selectAuthor(author)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                index === selectedIndex ? 'bg-gray-50 dark:bg-gray-700' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {highlightMatch(author.name, query)}
                    </span>
                    {author.isFavorite && (
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {author.bookCount} book{author.bookCount !== 1 ? 's' : ''}
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-lg shadow-lg p-4">
          <div className="text-center text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && results.length === 0 && query.trim() && !loading && !error && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <div className="text-center text-gray-500 dark:text-gray-400">
            No authors found for &ldquo;{query}&rdquo;
          </div>
        </div>
      )}
    </div>
  )
}