import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authorId = parseInt(params.id, 10)
    
    if (isNaN(authorId)) {
      return NextResponse.json({ error: 'Invalid author ID' }, { status: 400 })
    }

    // Fetch author with books and statistics
    const author = await prisma.author.findUnique({
      where: { id: authorId },
      include: {
        books: {
          include: {
            author: true,
            genre: true,
            narrator: true,
          },
          orderBy: {
            addedAt: 'desc',
          },
        },
        favoriteAuthors: true,
      },
    })

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 })
    }

    // Calculate statistics
    const stats = {
      totalBooks: author.books.length,
      completedBooks: author.books.filter(book => book.isCompleted).length,
      totalHours: Math.round(author.books.reduce((acc, book) => acc + book.duration, 0) / 60),
      averageRating: author.books.length > 0 
        ? author.books
            .filter(book => book.personalRating !== null)
            .reduce((acc, book) => acc + (book.personalRating || 0), 0) / 
          author.books.filter(book => book.personalRating !== null).length
        : 0
    }

    // Check if author is favorited
    const favoriteAuthor = await prisma.favoriteAuthor.findUnique({
      where: { authorId: author.id }
    })

    const response = {
      author: {
        ...author,
        stats
      },
      isFavorite: !!favoriteAuthor
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching author:', error)
    return NextResponse.json(
      { error: 'Failed to fetch author' },
      { status: 500 }
    )
  }
}