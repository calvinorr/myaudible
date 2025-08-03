import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

// Input validation and sanitization
function validateAndSanitizeInput(query: string, limit: string): { sanitizedQuery: string; validLimit: number } {
  // Sanitize query: remove potentially dangerous characters, limit length
  const sanitizedQuery = query
    .trim()
    .replace(/[<>"'%;()&+]/g, '') // Remove potentially dangerous characters
    .substring(0, 100) // Limit query length
  
  // Validate and sanitize limit
  const parsedLimit = parseInt(limit, 10)
  const validLimit = isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50 ? 10 : parsedLimit
  
  return { sanitizedQuery, validLimit }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const rawQuery = searchParams.get('q') || ''
    const rawLimit = searchParams.get('limit') || '10'

    // Validate and sanitize inputs
    const { sanitizedQuery, validLimit } = validateAndSanitizeInput(rawQuery, rawLimit)

    if (!sanitizedQuery) {
      return NextResponse.json({ authors: [] })
    }

    // Optimized single query to avoid N+1 problem
    const authors = await prisma.author.findMany({
      where: {
        name: {
          contains: sanitizedQuery
        }
      },
      include: {
        _count: {
          select: {
            books: true,
            favoriteAuthors: true
          }
        }
      },
      orderBy: [
        {
          favoriteAuthors: {
            _count: 'desc'
          }
        },
        {
          books: {
            _count: 'desc'
          }
        },
        {
          name: 'asc'
        }
      ],
      take: validLimit
    })

    // Transform the data to include favorite status and book count
    const authorsWithDetails = authors.map(author => ({
      id: author.id,
      name: author.name,
      bookCount: author._count.books,
      isFavorite: author._count.favoriteAuthors > 0
    }))

    return NextResponse.json({ authors: authorsWithDetails })
  } catch (error) {
    console.error('Error searching authors:', error)
    
    // Return more specific error information in development
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    return NextResponse.json(
      { 
        error: 'Failed to search authors',
        details: isDevelopment ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}