import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authorId = parseInt(params.id)
    
    const author = await prisma.author.findUnique({
      where: { id: authorId },
      select: {
        id: true,
        name: true,
        websiteUrl: true,
        rssUrl: true,
        socialUrls: true,
        lastScrapedAt: true
      }
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(author)
  } catch (error) {
    console.error('Error fetching author scraping config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch author scraping config' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authorId = parseInt(params.id)
    const { websiteUrl, rssUrl, socialUrls } = await request.json()

    // Validate URLs if provided
    const urlRegex = /^https?:\/\/.+\..+/
    if (websiteUrl && !urlRegex.test(websiteUrl)) {
      return NextResponse.json(
        { error: 'Invalid website URL format' },
        { status: 400 }
      )
    }
    if (rssUrl && !urlRegex.test(rssUrl)) {
      return NextResponse.json(
        { error: 'Invalid RSS URL format' },
        { status: 400 }
      )
    }

    // Parse and validate social URLs
    let parsedSocialUrls = null
    if (socialUrls) {
      if (typeof socialUrls === 'string') {
        try {
          parsedSocialUrls = JSON.parse(socialUrls)
        } catch (e) {
          // Treat as single URL
          if (urlRegex.test(socialUrls)) {
            parsedSocialUrls = [socialUrls]
          } else {
            return NextResponse.json(
              { error: 'Invalid social URL format' },
              { status: 400 }
            )
          }
        }
      } else if (Array.isArray(socialUrls)) {
        parsedSocialUrls = socialUrls.filter(url => url && urlRegex.test(url))
      }
    }

    const updatedAuthor = await prisma.author.update({
      where: { id: authorId },
      data: {
        websiteUrl: websiteUrl || null,
        rssUrl: rssUrl || null,
        socialUrls: parsedSocialUrls
      },
      select: {
        id: true,
        name: true,
        websiteUrl: true,
        rssUrl: true,
        socialUrls: true,
        lastScrapedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      author: updatedAuthor
    })
  } catch (error) {
    console.error('Error updating author scraping config:', error)
    return NextResponse.json(
      { error: 'Failed to update author scraping config' },
      { status: 500 }
    )
  }
}