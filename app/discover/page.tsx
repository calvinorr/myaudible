'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Recommendation {
  id: string
  title: string
  author: string
  description?: string
  coverUrl?: string
  recommendationType: string
  confidence: number
  reasoning?: string
}

export default function DiscoverPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'series' | 'authors' | 'pattern'>('all')

  useEffect(() => {
    fetchRecommendations()
  }, [activeTab])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Start with a simple timeout to avoid issues
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(`/api/discover/recommendations?type=${activeTab}&limit=12`, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }
      
      const data = await response.json()
      setRecommendations(data.recommendations || [])
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. The recommendation engine may be processing - please try again.')
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
      // Fallback to mock data for now
      setRecommendations(getMockRecommendations())
    } finally {
      setLoading(false)
    }
  }

  const getMockRecommendations = (): Recommendation[] => [
    {
      id: 'mock_1',
      title: 'The Midnight Library',
      author: 'Matt Haig',
      description: 'A novel about all the choices that go into a life well lived.',
      recommendationType: 'mood_based',
      confidence: 0.8,
      reasoning: 'Based on your reading preferences for uplifting fiction'
    },
    {
      id: 'mock_2',
      title: 'Project Hail Mary',
      author: 'Andy Weir',
      description: 'A lone astronaut must save the earth in this thrilling sci-fi adventure.',
      recommendationType: 'similar_authors',
      confidence: 0.9,
      reasoning: 'Readers who enjoyed your sci-fi books also love Andy Weir'
    }
  ]

  const getRecommendationTypeLabel = (type: string) => {
    switch (type) {
      case 'complete_series': return 'Continue Series'
      case 'similar_authors': return 'Similar Authors'
      case 'reading_pattern': return 'Reading Pattern'
      case 'mood_based': return 'Mood Based'
      default: return 'Recommended'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400'
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Discover</h1>
          <p className="text-gray-600 dark:text-gray-300">
            AI-powered book recommendations tailored to your reading patterns
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {[
          { key: 'all', label: 'All Recommendations' },
          { key: 'series', label: 'Complete Series' },
          { key: 'authors', label: 'Similar Authors' },
          { key: 'pattern', label: 'Reading Pattern' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"></div>
            <span className="text-gray-600 dark:text-gray-300">Analyzing your reading patterns...</span>
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
              <h3 className="font-semibold text-red-800 dark:text-red-200">Unable to load recommendations</h3>
              <p className="text-red-600 dark:text-red-300">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchRecommendations}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Recommendations Grid */}
      {!loading && recommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && recommendations.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="max-w-md mx-auto">
            <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No recommendations found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              We&apos;re analyzing your reading patterns to generate personalized recommendations.
            </p>
          </div>
        </div>
      )}

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8 border-t border-gray-200 dark:border-gray-700">
        <FeatureCard
          title="Smart Series Tracking"
          description="Automatically detect incomplete series and recommend the next book to read"
          icon="📚"
        />
        <FeatureCard
          title="Author Discovery"
          description="Find new authors similar to your favorites based on reading patterns"
          icon="🔍"
        />
        <FeatureCard
          title="Mood-Based Suggestions"
          description="Get recommendations that match your current reading mood and preferences"
          icon="🎭"
        />
      </div>
    </div>
  )
}

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400'
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const getRecommendationTypeLabel = (type: string) => {
    switch (type) {
      case 'complete_series': return 'Continue Series'
      case 'similar_authors': return 'Similar Authors'
      case 'reading_pattern': return 'Reading Pattern'
      case 'mood_based': return 'Mood Based'
      default: return 'Recommended'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Book Cover */}
      <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 relative">
        {recommendation.coverUrl ? (
          <Image
            src={recommendation.coverUrl.replace('http:', 'https:')}
            alt={recommendation.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
            </svg>
          </div>
        )}
        
        {/* Recommendation Type Badge */}
        <div className="absolute top-3 left-3">
          <div className="bg-primary-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm">
            {getRecommendationTypeLabel(recommendation.recommendationType)}
          </div>
        </div>

        {/* Confidence Score */}
        <div className="absolute top-3 right-3">
          <div className={`text-xs font-medium px-2 py-1 rounded-full bg-white dark:bg-gray-800 shadow-sm ${getConfidenceColor(recommendation.confidence)}`}>
            {Math.round(recommendation.confidence * 100)}%
          </div>
        </div>
      </div>

      {/* Book Details */}
      <div className="p-5">
        <div className="mb-3">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 text-lg leading-tight">
            {recommendation.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            by {recommendation.author}
          </p>
        </div>

        {/* Description */}
        {recommendation.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
            {recommendation.description}
          </p>
        )}

        {/* AI Reasoning */}
        {recommendation.reasoning && (
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              💡 {recommendation.reasoning}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button className="flex-1 px-3 py-2 text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors">
            Add to Library
          </button>
          <button className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            Preview
          </button>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  )
}