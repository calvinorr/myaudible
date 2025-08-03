import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get basic counts
    const [totalBooks, completedBooks, totalAuthors, totalGenres] = await Promise.all([
      prisma.book.count(),
      prisma.book.count({ where: { isCompleted: true } }),
      prisma.author.count(),
      prisma.genre.count(),
    ])

    // Get reading progress stats
    const currentlyReading = await prisma.book.count({
      where: {
        progress: { gt: 0 },
        isCompleted: false,
      },
    })

    // Calculate total duration
    const booksWithDuration = await prisma.book.findMany({
      select: { duration: true }
    })
    const totalMinutes = booksWithDuration.reduce((sum, book) => sum + book.duration, 0)
    const totalHours = Math.round(totalMinutes / 60)

    // Get completion rate
    const completionRate = totalBooks > 0 ? Math.round((completedBooks / totalBooks) * 100) : 0

    // Get favorite books count
    const favoriteBooks = await prisma.book.count({
      where: { isFavorite: true }
    })

    return NextResponse.json({
      totalBooks,
      completedBooks,
      currentlyReading,
      notStarted: totalBooks - completedBooks - currentlyReading,
      totalHours,
      totalAuthors,
      totalGenres,
      completionRate,
      favoriteBooks,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}