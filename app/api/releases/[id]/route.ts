import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const releaseId = parseInt(params.id)

    if (isNaN(releaseId)) {
      return NextResponse.json(
        { error: 'Invalid release ID' },
        { status: 400 }
      )
    }

    const release = await prisma.authorRelease.findUnique({
      where: { id: releaseId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            bio: true,
            websiteUrl: true,
            favoriteAuthors: true
          }
        }
      }
    })

    if (!release) {
      return NextResponse.json(
        { error: 'Release not found' },
        { status: 404 }
      )
    }

    // Transform response to include favorite status
    const transformedRelease = {
      ...release,
      author: {
        ...release.author,
        isFavorite: release.author.favoriteAuthors.length > 0,
        favoriteAuthors: undefined
      }
    }

    return NextResponse.json(transformedRelease)
  } catch (error) {
    console.error('Error fetching release:', error)
    return NextResponse.json(
      { error: 'Failed to fetch release' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const releaseId = parseInt(params.id)

    if (isNaN(releaseId)) {
      return NextResponse.json(
        { error: 'Invalid release ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      coverUrl,
      isbn,
      expectedDate,
      announcedDate,
      publishedDate,
      preorderUrl,
      releaseStatus,
      sourceUrl,
      isInterested,
      isNotified
    } = body

    // Check if release exists
    const existingRelease = await prisma.authorRelease.findUnique({
      where: { id: releaseId }
    })

    if (!existingRelease) {
      return NextResponse.json(
        { error: 'Release not found' },
        { status: 404 }
      )
    }

    // Update the release
    const updateData: any = {
      lastScrapedAt: new Date()
    }

    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl
    if (isbn !== undefined) updateData.isbn = isbn
    if (expectedDate !== undefined) updateData.expectedDate = expectedDate ? new Date(expectedDate) : null
    if (announcedDate !== undefined) updateData.announcedDate = announcedDate ? new Date(announcedDate) : null
    if (publishedDate !== undefined) updateData.publishedDate = publishedDate ? new Date(publishedDate) : null
    if (preorderUrl !== undefined) updateData.preorderUrl = preorderUrl
    if (releaseStatus !== undefined) updateData.releaseStatus = releaseStatus
    if (sourceUrl !== undefined) updateData.sourceUrl = sourceUrl
    if (isInterested !== undefined) updateData.isInterested = isInterested
    if (isNotified !== undefined) {
      updateData.isNotified = isNotified
      if (isNotified && !existingRelease.notifiedAt) {
        updateData.notifiedAt = new Date()
      }
    }

    const updatedRelease = await prisma.authorRelease.update({
      where: { id: releaseId },
      data: updateData,
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
      ...updatedRelease,
      author: {
        ...updatedRelease.author,
        isFavorite: updatedRelease.author.favoriteAuthors.length > 0,
        favoriteAuthors: undefined
      }
    }

    return NextResponse.json(transformedRelease)
  } catch (error) {
    console.error('Error updating release:', error)
    return NextResponse.json(
      { error: 'Failed to update release' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const releaseId = parseInt(params.id)

    if (isNaN(releaseId)) {
      return NextResponse.json(
        { error: 'Invalid release ID' },
        { status: 400 }
      )
    }

    // Check if release exists
    const existingRelease = await prisma.authorRelease.findUnique({
      where: { id: releaseId }
    })

    if (!existingRelease) {
      return NextResponse.json(
        { error: 'Release not found' },
        { status: 404 }
      )
    }

    // Delete the release
    await prisma.authorRelease.delete({
      where: { id: releaseId }
    })

    return NextResponse.json({ message: 'Release deleted successfully' })
  } catch (error) {
    console.error('Error deleting release:', error)
    return NextResponse.json(
      { error: 'Failed to delete release' },
      { status: 500 }
    )
  }
}