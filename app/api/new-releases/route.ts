import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

interface GoogleBooksItem {
  id: string
  volumeInfo: {
    title: string
    authors?: string[]
    publishedDate?: string
    description?: string
    imageLinks?: {
      thumbnail?: string
      smallThumbnail?: string
    }
    industryIdentifiers?: Array<{
      type: string
      identifier: string
    }>
    pageCount?: number
    categories?: string[]
    averageRating?: number
    ratingsCount?: number
    language?: string
    previewLink?: string
    infoLink?: string
  }
}

interface GoogleBooksResponse {
  totalItems: number
  items?: GoogleBooksItem[]
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Get favorite authors
    const favoriteAuthors = await prisma.favoriteAuthor.findMany({
      include: {
        author: true
      }
    })

    if (favoriteAuthors.length === 0) {
      return NextResponse.json({ 
        releases: [], 
        totalItems: 0,
        message: 'No favorite authors found. Add some favorite authors to see new releases!' 
      })
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const allReleases: any[] = []
    const searchPromises = favoriteAuthors.slice(0, 10).map(async (favoriteAuthor) => {
      try {
        const authorName = encodeURIComponent(favoriteAuthor.author.name)
        const startDateStr = startDate.toISOString().split('T')[0]
        const endDateStr = endDate.toISOString().split('T')[0]
        
        // Search Google Books API for recent releases by this author
        const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=inauthor:"${authorName}"&orderBy=newest&maxResults=5&printType=books&langRestrict=en`
        
        const response = await fetch(googleBooksUrl)
        if (!response.ok) {
          console.warn(`Google Books API error for ${favoriteAuthor.author.name}:`, response.status)
          return []
        }
        
        const data: GoogleBooksResponse = await response.json()
        
        if (!data.items || data.items.length === 0) {
          return []
        }

        // Filter and format results
        const recentReleases = data.items
          .filter(item => {
            const publishedDate = item.volumeInfo.publishedDate
            if (!publishedDate) return false
            
            const bookDate = new Date(publishedDate)
            return bookDate >= startDate && bookDate <= endDate
          })
          .map(item => ({
            id: item.id,
            title: item.volumeInfo.title,
            authors: item.volumeInfo.authors || [favoriteAuthor.author.name],
            publishedDate: item.volumeInfo.publishedDate,
            description: item.volumeInfo.description,
            thumbnail: item.volumeInfo.imageLinks?.thumbnail || item.volumeInfo.imageLinks?.smallThumbnail,
            isbn: item.volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier,
            pageCount: item.volumeInfo.pageCount,
            categories: item.volumeInfo.categories,
            averageRating: item.volumeInfo.averageRating,
            ratingsCount: item.volumeInfo.ratingsCount,
            language: item.volumeInfo.language,
            previewLink: item.volumeInfo.previewLink,
            infoLink: item.volumeInfo.infoLink,
            favoriteAuthor: {
              id: favoriteAuthor.author.id,
              name: favoriteAuthor.author.name
            }
          }))

        return recentReleases
      } catch (error) {
        console.error(`Error fetching releases for ${favoriteAuthor.author.name}:`, error)
        return []
      }
    })

    // Wait for all searches to complete
    const results = await Promise.all(searchPromises)
    
    // Flatten and sort results
    const flatResults = results.flat()
    allReleases.push(...flatResults)

    // Sort by publication date (newest first) and limit results
    const sortedReleases = allReleases
      .sort((a, b) => {
        const dateA = new Date(a.publishedDate || '1900-01-01')
        const dateB = new Date(b.publishedDate || '1900-01-01')
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, limit)

    return NextResponse.json({
      releases: sortedReleases,
      totalItems: sortedReleases.length,
      searchedAuthors: favoriteAuthors.length,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        days
      }
    })

  } catch (error) {
    console.error('Error fetching new releases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch new releases' },
      { status: 500 }
    )
  }
}