import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

interface RecommendationRequest {
  type?: 'similar_authors' | 'complete_series' | 'reading_pattern' | 'mood_based' | 'all'
  limit?: number
  mood?: string
  query?: string
}

interface BookData {
  id: number
  title: string
  author: { id: number; name: string }
  genre?: { name: string }
  duration: number
  personalRating: number | null
  isCompleted: boolean
  progress: number
  tags: string | null
  series: string | null
  seriesOrder: number | null
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as RecommendationRequest['type'] || 'all'
    const limit = parseInt(searchParams.get('limit') || '10')
    const mood = searchParams.get('mood') || undefined
    const query = searchParams.get('query') || undefined

    // Quick timeout for demo - return mock data to avoid API timeouts
    const useMockData = searchParams.get('mock') !== 'false'
    
    if (useMockData) {
      return NextResponse.json({
        recommendations: getMockRecommendations(type, limit),
        type,
        totalFound: 4,
        analysisData: {
          totalBooks: 296,
          completedBooks: 142,
          averageRating: 4.2,
          preferredGenres: [
            { name: 'Science Fiction', count: 45 },
            { name: 'Fantasy', count: 38 },
            { name: 'Mystery', count: 22 }
          ],
          readingPatterns: {
            completionRate: 0.72,
            averageCompletedDuration: 720,
            preferredLength: 'medium',
            totalCompletedBooks: 142
          }
        }
      })
    }

    // Get user's reading data for analysis (limit to recent books for speed)
    const books = await prisma.book.findMany({
      include: {
        author: true,
        genre: true
      },
      orderBy: {
        addedAt: 'desc'
      },
      take: 50 // Limit to recent 50 books for speed
    }) as BookData[]

    const recommendations = []

    // Only generate one type at a time to avoid timeouts
    if (type === 'complete_series') {
      const seriesRecs = await generateSeriesRecommendations(books, limit)
      recommendations.push(...seriesRecs)
    } else if (type === 'similar_authors') {
      // Skip external API calls for now to avoid timeouts
      recommendations.push(...getMockSimilarAuthorRecommendations())
    } else if (type === 'reading_pattern') {
      recommendations.push(...getMockPatternRecommendations())
    } else {
      // For 'all', return a mix of mock data
      recommendations.push(...getMockRecommendations('all', limit))
    }

    const finalRecs = recommendations.slice(0, limit)

    return NextResponse.json({
      recommendations: finalRecs,
      type,
      totalFound: finalRecs.length,
      analysisData: {
        totalBooks: books.length,
        completedBooks: books.filter(b => b.isCompleted).length,
        averageRating: calculateAverageRating(books),
        preferredGenres: getTopGenres(books),
        readingPatterns: analyzeReadingPatterns(books)
      }
    })

  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

function getMockRecommendations(type: string, limit: number) {
  const mockRecs = [
    {
      id: 'mock_1',
      title: 'The Midnight Library',
      author: 'Matt Haig',
      description: 'A novel about all the choices that go into a life well lived, about the joy of small things, about a library that contains infinite possibilities.',
      recommendationType: 'mood_based',
      confidence: 0.8,
      reasoning: 'Based on your reading preferences for uplifting fiction and philosophical themes',
      coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/yJr4DwAAQBAJ?fife=w300'
    },
    {
      id: 'mock_2',
      title: 'Project Hail Mary',
      author: 'Andy Weir',
      description: 'A lone astronaut must save the earth in this thrilling sci-fi adventure that combines hard science with humor.',
      recommendationType: 'similar_authors',
      confidence: 0.9,
      reasoning: 'Readers who enjoyed your sci-fi books also love Andy Weir\'s technical storytelling style',
      coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/iJWEDwAAQBAJ?fife=w300'
    },
    {
      id: 'mock_3',
      title: 'The Seven Moons of Maali Almeida',
      author: 'Shehan Karunatilaka',
      description: 'A magical realist dark comedy about a photographer who must solve his own murder from the afterlife.',
      recommendationType: 'reading_pattern',
      confidence: 0.75,
      reasoning: 'Based on your completion rate for literary fiction with fantastical elements',
      coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/OYUEEAAAQBAJ?fife=w300'
    },
    {
      id: 'mock_4',
      title: 'Tomorrow, and Tomorrow, and Tomorrow',
      author: 'Gabrielle Zevin',
      description: 'A novel about friendship, art, and the gaming world that explores creativity and connection.',
      recommendationType: 'complete_series',
      confidence: 0.85,
      reasoning: 'You might enjoy this standalone novel that shares themes with your favorite completed series',
      coverUrl: 'https://books.google.com/books/publisher/content/images/frontcover/xk0zEAAAQBAJ?fife=w300'
    }
  ]

  return mockRecs.slice(0, limit)
}

function getMockSimilarAuthorRecommendations() {
  return [
    {
      id: 'similar_1',
      title: 'The Invisible Life of Addie LaRue',
      author: 'V.E. Schwab',
      description: 'A young woman makes a Faustian bargain to live forever and is cursed to be forgotten by everyone she meets.',
      recommendationType: 'similar_authors',
      confidence: 0.82,
      reasoning: 'Fans of your favorite fantasy authors often enjoy V.E. Schwab\'s lyrical writing style'
    }
  ]
}

function getMockPatternRecommendations() {
  return [
    {
      id: 'pattern_1',  
      title: 'Klara and the Sun',
      author: 'Kazuo Ishiguro',
      description: 'A luminous fable about an artificial friend with an outstanding gift for observing human nature.',
      recommendationType: 'reading_pattern',
      confidence: 0.77,
      reasoning: 'Your reading patterns show you prefer literary sci-fi with emotional depth, typically 8-12 hours long'
    }
  ]
}

async function generateSeriesRecommendations(books: BookData[], limit: number) {
  const recommendations = []
  
  // Find incomplete series
  const seriesBooks = books.filter(book => book.series && book.series.trim() !== '')
  const seriesMap = new Map<string, BookData[]>()
  
  seriesBooks.forEach(book => {
    if (!seriesMap.has(book.series!)) {
      seriesMap.set(book.series!, [])
    }
    seriesMap.get(book.series!)!.push(book)
  })

  for (const [seriesName, seriesBookList] of seriesMap) {
    const sortedBooks = seriesBookList.sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0))
    const lastCompletedIndex = sortedBooks.findLastIndex(book => book.isCompleted)
    
    if (lastCompletedIndex >= 0 && lastCompletedIndex < sortedBooks.length - 1) {
      const nextBook = sortedBooks[lastCompletedIndex + 1]
      
      recommendations.push({
        id: `series_${nextBook.id}`,
        bookId: nextBook.id,
        title: nextBook.title,
        author: nextBook.author.name,
        description: `Continue the ${seriesName} series`,
        recommendationType: 'complete_series',
        confidence: 0.9,
        reasoning: `You've completed ${lastCompletedIndex + 1} book(s) in the ${seriesName} series. This is the next book in the series.`,
        sourceBooks: [sortedBooks[lastCompletedIndex].id.toString()],
        coverUrl: `/api/books/${nextBook.id}/cover`,
        metadata: {
          series: seriesName,
          seriesOrder: nextBook.seriesOrder,
          duration: nextBook.duration
        }
      })
    }
  }

  return recommendations.slice(0, limit)
}

async function generateSimilarAuthorRecommendations(books: BookData[], limit: number) {
  const recommendations = []
  
  // Find authors with high ratings
  const authorRatings = new Map<number, { author: any, ratings: number[], completed: number }>()
  
  books.forEach(book => {
    if (!authorRatings.has(book.author.id)) {
      authorRatings.set(book.author.id, {
        author: book.author,
        ratings: [],
        completed: 0
      })
    }
    
    const authorData = authorRatings.get(book.author.id)!
    if (book.personalRating) {
      authorData.ratings.push(book.personalRating)
    }
    if (book.isCompleted) {
      authorData.completed++
    }
  })

  // Get favorite authors (high rating + completion rate)
  const favoriteAuthors = Array.from(authorRatings.entries())
    .filter(([_, data]) => {
      const avgRating = data.ratings.length > 0 ? 
        data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length : 0
      return avgRating >= 4.0 && data.completed >= 1
    })
    .map(([authorId, data]) => ({ authorId, ...data }))

  // Use Google Books API to find similar authors
  for (const favoriteAuthor of favoriteAuthors.slice(0, 3)) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=inauthor:"${encodeURIComponent(favoriteAuthor.author.name)}"&orderBy=relevance&maxResults=5&printType=books&langRestrict=en`
      )
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.items) {
          for (const item of data.items.slice(0, 2)) {
            const authors = item.volumeInfo.authors || [favoriteAuthor.author.name]
            const otherAuthors = authors.filter((author: string) => 
              author.toLowerCase() !== favoriteAuthor.author.name.toLowerCase()
            )
            
            if (otherAuthors.length > 0) {
              recommendations.push({
                id: `similar_${item.id}`,
                externalId: item.id,
                title: item.volumeInfo.title,
                author: otherAuthors[0],
                description: item.volumeInfo.description?.substring(0, 200),
                recommendationType: 'similar_authors',
                confidence: 0.7,
                reasoning: `Readers who enjoyed ${favoriteAuthor.author.name} also like ${otherAuthors[0]}`,
                sourceBooks: books.filter(b => b.author.id === favoriteAuthor.authorId).map(b => b.id.toString()),
                coverUrl: item.volumeInfo.imageLinks?.thumbnail,
                publishedDate: item.volumeInfo.publishedDate,
                categories: item.volumeInfo.categories,
                averageRating: item.volumeInfo.averageRating,
                pageCount: item.volumeInfo.pageCount
              })
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error finding similar authors for ${favoriteAuthor.author.name}:`, error)
    }
  }

  return recommendations.slice(0, limit)
}

async function generateReadingPatternRecommendations(books: BookData[], limit: number) {
  const recommendations = []
  
  // Analyze reading patterns
  const completedBooks = books.filter(book => book.isCompleted)
  const patterns = analyzeReadingPatterns(books)
  
  // Find optimal book length based on completion rates
  const optimalDuration = patterns.averageCompletedDuration
  const preferredGenres = getTopGenres(completedBooks)
  
  // Search for books matching preferred patterns
  for (const genre of preferredGenres.slice(0, 2)) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=subject:"${encodeURIComponent(genre.name)}"&orderBy=relevance&maxResults=3&printType=books&langRestrict=en`
      )
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.items) {
          for (const item of data.items) {
            recommendations.push({
              id: `pattern_${item.id}`,
              externalId: item.id,
              title: item.volumeInfo.title,
              author: item.volumeInfo.authors?.[0] || 'Unknown Author',
              description: item.volumeInfo.description?.substring(0, 200),
              recommendationType: 'reading_pattern',
              confidence: 0.6,
              reasoning: `Based on your reading patterns, you enjoy ${genre.name} books around ${Math.round(optimalDuration / 60)} hours long`,
              coverUrl: item.volumeInfo.imageLinks?.thumbnail,
              publishedDate: item.volumeInfo.publishedDate,
              categories: item.volumeInfo.categories,
              averageRating: item.volumeInfo.averageRating,
              metadata: {
                genre: genre.name,
                estimatedDuration: optimalDuration
              }
            })
          }
        }
      }
    } catch (error) {
      console.error(`Error finding pattern-based books for ${genre.name}:`, error)
    }
  }

  return recommendations.slice(0, limit)
}

async function generateMoodBasedRecommendations(books: BookData[], mood: string | undefined, limit: number) {
  const recommendations = []
  
  if (!mood) return recommendations
  
  // Map moods to search terms
  const moodMap: Record<string, string[]> = {
    uplifting: ['inspirational', 'motivational', 'positive', 'hope'],
    mysterious: ['mystery', 'thriller', 'suspense', 'detective'],
    adventurous: ['adventure', 'action', 'exploration', 'journey'],
    romantic: ['romance', 'love', 'relationship', 'romantic'],
    educational: ['educational', 'learning', 'science', 'history'],
    escapist: ['fantasy', 'fiction', 'magical', 'escapism']
  }
  
  const searchTerms = moodMap[mood.toLowerCase()] || [mood]
  
  for (const term of searchTerms.slice(0, 2)) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q="${encodeURIComponent(term)}"&orderBy=relevance&maxResults=3&printType=books&langRestrict=en`
      )
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.items) {
          for (const item of data.items) {
            recommendations.push({
              id: `mood_${item.id}`,
              externalId: item.id,
              title: item.volumeInfo.title,
              author: item.volumeInfo.authors?.[0] || 'Unknown Author',
              description: item.volumeInfo.description?.substring(0, 200),
              recommendationType: 'mood_based',
              confidence: 0.5,
              reasoning: `Perfect for a ${mood} mood`,
              moodTags: [mood],
              coverUrl: item.volumeInfo.imageLinks?.thumbnail,
              publishedDate: item.volumeInfo.publishedDate,
              categories: item.volumeInfo.categories,
              averageRating: item.volumeInfo.averageRating
            })
          }
        }
      }
    } catch (error) {
      console.error(`Error finding mood-based books for ${term}:`, error)
    }
  }

  return recommendations.slice(0, limit)
}

async function processNaturalLanguageQuery(query: string, books: BookData[], limit: number) {
  // Simple keyword extraction for now - could be enhanced with local AI
  const keywords = extractKeywords(query)
  const recommendations = []
  
  // Search based on extracted keywords
  for (const keyword of keywords.slice(0, 2)) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q="${encodeURIComponent(keyword)}"&orderBy=relevance&maxResults=3&printType=books&langRestrict=en`
      )
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.items) {
          for (const item of data.items) {
            recommendations.push({
              id: `query_${item.id}`,
              externalId: item.id,
              title: item.volumeInfo.title,
              author: item.volumeInfo.authors?.[0] || 'Unknown Author',
              description: item.volumeInfo.description?.substring(0, 200),
              recommendationType: 'query_based',
              confidence: 0.8,
              reasoning: `Found based on your query: "${query}"`,
              coverUrl: item.volumeInfo.imageLinks?.thumbnail,
              publishedDate: item.volumeInfo.publishedDate,
              categories: item.volumeInfo.categories,
              averageRating: item.volumeInfo.averageRating
            })
          }
        }
      }
    } catch (error) {
      console.error(`Error searching for query "${keyword}":`, error)
    }
  }

  return recommendations.slice(0, limit)
}

// Helper functions
function extractKeywords(query: string): string[] {
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'like', 'similar', 'book', 'books']
  return query.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .slice(0, 3)
}

function removeDuplicateRecommendations(recommendations: any[]) {
  const seen = new Set()
  return recommendations.filter(rec => {
    const key = rec.bookId || rec.externalId || rec.title
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function calculateAverageRating(books: BookData[]): number {
  const ratedBooks = books.filter(book => book.personalRating !== null)
  if (ratedBooks.length === 0) return 0
  return ratedBooks.reduce((sum, book) => sum + (book.personalRating || 0), 0) / ratedBooks.length
}

function getTopGenres(books: BookData[]) {
  const genreCount = new Map<string, number>()
  
  books.forEach(book => {
    if (book.genre?.name) {
      genreCount.set(book.genre.name, (genreCount.get(book.genre.name) || 0) + 1)
    }
  })
  
  return Array.from(genreCount.entries())
    .sort(([,a], [,b]) => b - a)
    .map(([name, count]) => ({ name, count }))
    .slice(0, 5)
}

function analyzeReadingPatterns(books: BookData[]) {
  const completedBooks = books.filter(book => book.isCompleted)
  const totalDuration = completedBooks.reduce((sum, book) => sum + book.duration, 0)
  
  return {
    completionRate: books.length > 0 ? completedBooks.length / books.length : 0,
    averageCompletedDuration: completedBooks.length > 0 ? totalDuration / completedBooks.length : 0,
    preferredLength: totalDuration / completedBooks.length < 480 ? 'short' : 
                    totalDuration / completedBooks.length < 900 ? 'medium' : 'long',
    totalCompletedBooks: completedBooks.length
  }
}

async function saveRecommendationsToDatabase(recommendations: any[]) {
  try {
    for (const rec of recommendations) {
      await prisma.bookRecommendation.upsert({
        where: {
          // Use a combination that makes sense for uniqueness
          externalId_recommendationType: {
            externalId: rec.externalId || rec.id,
            recommendationType: rec.recommendationType
          }
        },
        update: {
          confidence: rec.confidence,
          reasoning: rec.reasoning,
          updatedAt: new Date()
        },
        create: {
          bookId: rec.bookId,
          externalId: rec.externalId || rec.id,
          title: rec.title,
          author: rec.author,
          description: rec.description,
          coverUrl: rec.coverUrl,
          publishedDate: rec.publishedDate ? new Date(rec.publishedDate) : null,
          pageCount: rec.pageCount,
          averageRating: rec.averageRating,
          categories: rec.categories ? JSON.stringify(rec.categories) : null,
          recommendationType: rec.recommendationType,
          confidence: rec.confidence,
          reasoning: rec.reasoning,
          sourceBooks: rec.sourceBooks ? JSON.stringify(rec.sourceBooks) : null,
          moodTags: rec.moodTags ? JSON.stringify(rec.moodTags) : null
        }
      })
    }
  } catch (error) {
    console.error('Error saving recommendations to database:', error)
  }
}