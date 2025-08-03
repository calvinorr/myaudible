'use client'

import { useState, useEffect } from 'react'

interface Stats {
  totalBooks: number
  completedBooks: number
  currentlyReading: number
  notStarted: number
  totalHours: number
  totalAuthors: number
  totalGenres: number
  completionRate: number
  favoriteBooks: number
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading statistics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Library Statistics</h1>
        <p className="text-gray-600 dark:text-gray-300">Insights into your audiobook collection and reading habits</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl shadow-sm border border-primary-200 dark:border-primary-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-700 dark:text-primary-300 mb-1">Total Books</p>
              <p className="text-3xl font-bold text-primary-900 dark:text-primary-100">{stats.totalBooks}</p>
            </div>
            <div className="bg-primary-500 rounded-xl p-3">
              <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl shadow-sm border border-green-200 dark:border-green-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.completedBooks}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">{stats.completionRate}% of library</p>
            </div>
            <div className="bg-green-500 rounded-xl p-3">
              <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-6">
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

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl shadow-sm border border-amber-200 dark:border-amber-800 p-6">
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

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reading Progress</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Completed</span>
              <span className="font-medium text-gray-900 dark:text-white">{stats.completedBooks} books</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">In Progress</span>
              <span className="font-medium text-gray-900 dark:text-white">{stats.currentlyReading} books</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Not Started</span>
              <span className="font-medium text-gray-900 dark:text-white">{stats.notStarted} books</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Collection Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Total Authors</span>
              <span className="font-medium text-gray-900 dark:text-white">{stats.totalAuthors}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Total Genres</span>
              <span className="font-medium text-gray-900 dark:text-white">{stats.totalGenres}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Favorite Books</span>
              <span className="font-medium text-gray-900 dark:text-white">{stats.favoriteBooks}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Average per Author</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats.totalAuthors > 0 ? Math.round(stats.totalBooks / stats.totalAuthors * 10) / 10 : 0} books
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}