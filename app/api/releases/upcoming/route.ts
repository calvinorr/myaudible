import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const authorId = searchParams.get('authorId')
    const status = searchParams.get('status') || 'announced'
    const favoritesOnly = searchParams.get('favorites') === 'true'

    // Build where clause
    const where: any = {
      releaseStatus: status
    }

    // Filter by specific author
    if (authorId) {
      where.authorId = parseInt(authorId)
    }

    // Filter by favorite authors only
    if (favoritesOnly) {
      where.author = {
        favoriteAuthors: {
          some: {}
        }
      }
    }

    // Only show future releases or recently announced
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - 1) // Include releases from last month

    where.OR = [
      { expectedDate: { gte: new Date() } },
      { announcedDate: { gte: cutoffDate } },
      { publishedDate: { gte: cutoffDate } }
    ]

    const releases = await prisma.authorRelease.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            favoriteAuthors: true
          }
        }
      },
      orderBy: [
        { expectedDate: 'asc' },
        { announcedDate: 'desc' }
      ]
    })

    const totalCount = await prisma.authorRelease.count({ where })
    const hasMore = offset + limit < totalCount

    // Transform the data to include favorite status
    const transformedReleases = releases.map(release => ({
      ...release,
      author: {
        ...release.author,
        isFavorite: release.author.favoriteAuthors.length > 0,
        favoriteAuthors: undefined // Remove from response
      }
    }))

    return NextResponse.json({
      releases: transformedReleases,
      totalCount,
      hasMore,
    })
  } catch (error) {
    console.error('Error fetching upcoming releases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch upcoming releases' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      authorId,
      title,
      description,
      coverUrl,
      isbn,
      expectedDate,
      announcedDate,
      publishedDate,
      preorderUrl,
      releaseStatus = 'announced',
      sourceUrl,
      isInterested = true
    } = body

    // Validate required fields
    if (!authorId || !title) {
      return NextResponse.json(
        { error: 'Author ID and title are required' },
        { status: 400 }
      )
    }

    // Check if author exists
    const author = await prisma.author.findUnique({
      where: { id: parseInt(authorId) }
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      )
    }

    // Check for duplicate release
    const existingRelease = await prisma.authorRelease.findUnique({
      where: {
        authorId_title: {
          authorId: parseInt(authorId),
          title: title.trim()
        }
      }
    })

    if (existingRelease) {
      return NextResponse.json(
        { error: 'Release already exists for this author' },
        { status: 409 }
      )
    }

    // Create the release
    const release = await prisma.authorRelease.create({
      data: {
        authorId: parseInt(authorId),
        title: title.trim(),
        description,
        coverUrl,
        isbn,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        announcedDate: announcedDate ? new Date(announcedDate) : new Date(),
        publishedDate: publishedDate ? new Date(publishedDate) : null,
        preorderUrl,
        releaseStatus,
        sourceUrl,
        isInterested,
        lastScrapedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            favoriteAuthors: true
          }
        }
      }
    })

    // Transform response to include favorite status
    const transformedRelease = {
      ...release,
      author: {
        ...release.author,
        isFavorite: release.author.favoriteAuthors.length > 0,
        favoriteAuthors: undefined
      }
    }

    return NextResponse.json(transformedRelease, { status: 201 })
  } catch (error) {
    console.error('Error creating release:', error)
    return NextResponse.json(
      { error: 'Failed to create release' },
      { status: 500 }
    )
  }
}