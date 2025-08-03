import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookId = parseInt(params.id, 10)
    
    if (isNaN(bookId)) {
      return NextResponse.json({ error: 'Invalid book ID' }, { status: 400 })
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        author: true,
        genre: true,
        narrator: true,
      },
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    return NextResponse.json({ book })
  } catch (error) {
    console.error('Error fetching book:', error)
    return NextResponse.json(
      { error: 'Failed to fetch book' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookId = parseInt(params.id, 10)
    
    if (isNaN(bookId)) {
      return NextResponse.json({ error: 'Invalid book ID' }, { status: 400 })
    }

    const body = await request.json()
    const { progress, personalRating, personalNotes, isFavorite, isCompleted } = body

    // Build update data
    const updateData: any = {}
    
    if (typeof progress === 'number') {
      updateData.progress = Math.max(0, Math.min(100, progress))
      updateData.isCompleted = progress >= 100
      if (progress >= 100 && !updateData.completedAt) {
        updateData.completedAt = new Date()
      }
    }
    
    if (typeof personalRating === 'number') {
      updateData.personalRating = Math.max(0, Math.min(5, personalRating))
    }
    
    if (typeof personalNotes === 'string') {
      updateData.personalNotes = personalNotes
    }
    
    if (typeof isFavorite === 'boolean') {
      updateData.isFavorite = isFavorite
    }
    
    if (typeof isCompleted === 'boolean') {
      updateData.isCompleted = isCompleted
      if (isCompleted && !updateData.completedAt) {
        updateData.completedAt = new Date()
      } else if (!isCompleted) {
        updateData.completedAt = null
      }
    }

    const updatedBook = await prisma.book.update({
      where: { id: bookId },
      data: updateData,
      include: {
        author: true,
        genre: true,
        narrator: true,
      },
    })

    return NextResponse.json({ book: updatedBook })
  } catch (error) {
    console.error('Error updating book:', error)
    return NextResponse.json(
      { error: 'Failed to update book' },
      { status: 500 }
    )
  }
}