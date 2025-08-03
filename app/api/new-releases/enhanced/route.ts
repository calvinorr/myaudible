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
    const pastDays = parseInt(searchParams.get('pastDays') || '90', 10)
    const futureDays = parseInt(searchParams.get('futureDays') || '180', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Get favorite authors
    const favoriteAuthors = await prisma.favoriteAuthor.findMany({
      include: {
        author: true
      }
    })

    if (favoriteAuthors.length === 0) {
      return NextResponse.json({ 
        releases: [], 
        upcoming: [],
        totalItems: 0,
        message: 'No favorite authors found. Add some favorite authors to see new releases!' 
      })
    }

    // Calculate date ranges - FIXED FOR 2025
    const today = new Date('2025-08-03') // Override current date for testing
    const pastStartDate = new Date(today)
    pastStartDate.setDate(today.getDate() - pastDays)
    
    const futureEndDate = new Date(today)
    futureEndDate.setDate(today.getDate() + futureDays)

    console.log('=== NEW RELEASES DEBUG ===')
    console.log('Current date (corrected):', today.toISOString().split('T')[0])
    console.log('Past range:', pastStartDate.toISOString().split('T')[0], 'to', today.toISOString().split('T')[0])
    console.log('Future range:', today.toISOString().split('T')[0], 'to', futureEndDate.toISOString().split('T')[0])

    const allReleases: any[] = []
    const allUpcoming: any[] = []
    
    // Search for each favorite author
    const searchPromises = favoriteAuthors.slice(0, 10).map(async (favoriteAuthor) => {
      try {
        const authorName = encodeURIComponent(favoriteAuthor.author.name)
        
        // Search Google Books API for this author's books
        const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=inauthor:"${authorName}"&orderBy=newest&maxResults=20&printType=books&langRestrict=en`
        
        console.log(`Searching for: ${favoriteAuthor.author.name}`)
        
        const response = await fetch(googleBooksUrl)
        if (!response.ok) {
          console.warn(`Google Books API error for ${favoriteAuthor.author.name}:`, response.status)
          return { releases: [], upcoming: [] }
        }
        
        const data: GoogleBooksResponse = await response.json()
        
        if (!data.items || data.items.length === 0) {
          console.log(`No books found for ${favoriteAuthor.author.name}`)
          return { releases: [], upcoming: [] }
        }

        const releases: any[] = []
        const upcoming: any[] = []

        // Process each book
        data.items.forEach(item => {
          if (!item.volumeInfo.publishedDate) return

          // Parse publication date - handle various formats
          let bookDate: Date
          const publishedDate = item.volumeInfo.publishedDate
          
          if (publishedDate.length === 4) {
            // Year only (e.g., "2025")
            bookDate = new Date(`${publishedDate}-01-01`)
          } else if (publishedDate.length === 7) {
            // Year-Month (e.g., "2025-05")
            bookDate = new Date(`${publishedDate}-01`)
          } else {
            // Full date (e.g., "2025-05-21")
            bookDate = new Date(publishedDate)
          }

          if (isNaN(bookDate.getTime())) return // Invalid date

          const bookInfo = {
            id: item.id,
            title: item.volumeInfo.title,
            authors: item.volumeInfo.authors || [favoriteAuthor.author.name],
            publishedDate: publishedDate,
            parsedDate: bookDate.toISOString(),
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
          }

          // Categorize as recent release or upcoming
          if (bookDate >= pastStartDate && bookDate <= today) {
            releases.push(bookInfo)
            console.log(`Recent release: "${item.volumeInfo.title}" - ${publishedDate}`)
          } else if (bookDate > today && bookDate <= futureEndDate) {
            upcoming.push(bookInfo)
            console.log(`Upcoming release: "${item.volumeInfo.title}" - ${publishedDate}`)
          }
        })

        return { releases, upcoming }
      } catch (error) {
        console.error(`Error fetching releases for ${favoriteAuthor.author.name}:`, error)
        return { releases: [], upcoming: [] }
      }
    })

    // Wait for all searches to complete
    const results = await Promise.all(searchPromises)
    
    // Flatten results
    results.forEach(result => {
      allReleases.push(...result.releases)
      allUpcoming.push(...result.upcoming)
    })

    // Sort by publication date (newest first for releases, earliest first for upcoming)
    const sortedReleases = allReleases
      .sort((a, b) => new Date(b.parsedDate).getTime() - new Date(a.parsedDate).getTime())
      .slice(0, limit)

    const sortedUpcoming = allUpcoming
      .sort((a, b) => new Date(a.parsedDate).getTime() - new Date(b.parsedDate).getTime())
      .slice(0, limit)

    console.log(`Found ${sortedReleases.length} recent releases, ${sortedUpcoming.length} upcoming`)
    console.log('=== END DEBUG ===')

    return NextResponse.json({
      releases: sortedReleases,
      upcoming: sortedUpcoming,
      totalItems: sortedReleases.length + sortedUpcoming.length,
      searchedAuthors: favoriteAuthors.length,
      dateRanges: {
        past: {
          start: pastStartDate.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0],
          days: pastDays
        },
        future: {
          start: today.toISOString().split('T')[0],
          end: futureEndDate.toISOString().split('T')[0],
          days: futureDays
        }
      },
      debug: {
        currentDate: today.toISOString().split('T')[0],
        favoriteAuthorsCount: favoriteAuthors.length,
        favoriteAuthors: favoriteAuthors.map(fa => fa.author.name)
      }
    })

  } catch (error) {
    console.error('Error fetching new releases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch new releases', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}