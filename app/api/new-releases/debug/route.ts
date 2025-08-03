import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '90', 10) // Default to 90 days
    const author = searchParams.get('author') || 'Stephen King'

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    console.log('=== DEBUG NEW RELEASES ===')
    console.log('Search author:', author)
    console.log('Days:', days)
    console.log('Start date:', startDate.toISOString().split('T')[0])
    console.log('End date:', endDate.toISOString().split('T')[0])

    // Search Google Books API
    const authorName = encodeURIComponent(author)
    const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=inauthor:"${authorName}"&orderBy=newest&maxResults=10&printType=books&langRestrict=en`
    
    console.log('Google Books URL:', googleBooksUrl)
    
    const response = await fetch(googleBooksUrl)
    if (!response.ok) {
      return NextResponse.json({ error: `Google Books API error: ${response.status}` }, { status: 500 })
    }
    
    const data = await response.json()
    console.log('Total items from Google:', data.totalItems)
    console.log('Items returned:', data.items?.length || 0)

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({
        debug: {
          author,
          days,
          dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
          googleResponse: 'No items returned'
        },
        releases: []
      })
    }

    // Process and filter results with debug info
    const allBooks = data.items.map((item: any) => ({
      id: item.id,
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors,
      publishedDate: item.volumeInfo.publishedDate,
      parsedDate: item.volumeInfo.publishedDate ? new Date(item.volumeInfo.publishedDate) : null,
      isInRange: item.volumeInfo.publishedDate ? 
        (() => {
          const bookDate = new Date(item.volumeInfo.publishedDate)
          const inRange = bookDate >= startDate && bookDate <= endDate
          console.log(`Book: "${item.volumeInfo.title}" - Published: ${item.volumeInfo.publishedDate} - In range: ${inRange}`)
          return inRange
        })() : false,
      description: item.volumeInfo.description?.substring(0, 200),
      thumbnail: item.volumeInfo.imageLinks?.thumbnail
    }))

    const filteredBooks = allBooks.filter(book => book.isInRange)
    
    console.log('Books after date filtering:', filteredBooks.length)
    console.log('=== END DEBUG ===')

    return NextResponse.json({
      debug: {
        author,
        days,
        dateRange: { 
          start: startDate.toISOString().split('T')[0], 
          end: endDate.toISOString().split('T')[0] 
        },
        totalFromGoogle: data.totalItems,
        itemsReturned: data.items?.length || 0,
        afterDateFilter: filteredBooks.length
      },
      allBooks,
      filteredBooks,
      releases: filteredBooks
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: 'Debug API failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}