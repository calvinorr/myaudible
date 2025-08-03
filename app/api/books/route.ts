import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '24', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const minDuration = searchParams.get('minDuration')
    const maxDuration = searchParams.get('maxDuration')
    const releaseYear = searchParams.get('releaseYear')
    const series = searchParams.get('series')
    const narrator = searchParams.get('narrator')
    const genre = searchParams.get('genre')
    const sortBy = searchParams.get('sortBy') || 'addedAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    // Build where clause
    const where: any = {}

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { name: { contains: search, mode: 'insensitive' } } },
        { narrator: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Status filter
    if (status === 'reading') {
      where.AND = [
        { progress: { gt: 0 } },
        { isCompleted: false }
      ]
    } else if (status === 'completed') {
      where.isCompleted = true
    } else if (status === 'not_started') {
      where.progress = 0
    }

    // Duration filters
    if (minDuration) {
      where.duration = { ...where.duration, gte: parseInt(minDuration) * 60 }
    }
    if (maxDuration) {
      where.duration = { ...where.duration, lte: parseInt(maxDuration) * 60 }
    }

    // Release year filter
    if (releaseYear) {
      const year = parseInt(releaseYear)
      where.releaseDate = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`)
      }
    }

    // Series filter
    if (series) {
      where.series = { contains: series, mode: 'insensitive' }
    }

    // Narrator filter
    if (narrator) {
      where.narrator = { name: { contains: narrator, mode: 'insensitive' } }
    }

    // Genre filter
    if (genre) {
      where.genre = { name: { contains: genre, mode: 'insensitive' } }
    }

    // Build orderBy clause
    let orderBy: any = {}
    
    switch (sortBy) {
      case 'title':
        orderBy = { title: sortOrder }
        break
      case 'author':
        orderBy = { author: { name: sortOrder } }
        break
      case 'releaseDate':
        orderBy = { releaseDate: sortOrder }
        break
      case 'duration':
        orderBy = { duration: sortOrder }
        break
      case 'personalRating':
        orderBy = { personalRating: sortOrder }
        break
      case 'addedAt':
      default:
        orderBy = { addedAt: sortOrder }
        break
    }

    const books = await prisma.book.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        author: true,
        genre: true,
        narrator: true,
      },
      orderBy,
    })

    const totalCount = await prisma.book.count({ where })
    const hasMore = offset + limit < totalCount

    return NextResponse.json({
      books,
      totalCount,
      hasMore,
    })
  } catch (error) {
    console.error('Error fetching books:', error)
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    )
  }
}