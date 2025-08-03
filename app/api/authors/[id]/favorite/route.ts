import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authorId = parseInt(params.id, 10)
    
    if (isNaN(authorId)) {
      return NextResponse.json({ error: 'Invalid author ID' }, { status: 400 })
    }

    // Check if author exists
    const author = await prisma.author.findUnique({
      where: { id: authorId }
    })

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 })
    }

    // Check if author is already favorited
    const existingFavorite = await prisma.favoriteAuthor.findUnique({
      where: { authorId }
    })

    let isFavorite: boolean

    if (existingFavorite) {
      // Remove from favorites
      await prisma.favoriteAuthor.delete({
        where: { id: existingFavorite.id }
      })
      isFavorite = false
    } else {
      // Add to favorites
      await prisma.favoriteAuthor.create({
        data: { authorId }
      })
      isFavorite = true
    }

    return NextResponse.json({ 
      isFavorite,
      message: isFavorite ? 'Author added to favorites' : 'Author removed from favorites'
    })
  } catch (error) {
    console.error('Error toggling author favorite:', error)
    return NextResponse.json(
      { error: 'Failed to update favorite status' },
      { status: 500 }
    )
  }
}