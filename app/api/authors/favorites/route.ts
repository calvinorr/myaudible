import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const favoriteAuthors = await prisma.favoriteAuthor.findMany({
      include: {
        author: {
          include: {
            _count: {
              select: {
                books: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ favoriteAuthors })
  } catch (error) {
    console.error('Error fetching favorite authors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch favorite authors' },
      { status: 500 }
    )
  }
}