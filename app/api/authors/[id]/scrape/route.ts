import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authorId = parseInt(params.id)

    if (isNaN(authorId)) {
      return NextResponse.json(
        { error: 'Invalid author ID' },
        { status: 400 }
      )
    }

    // Check if author exists and has scraping information
    const author = await prisma.author.findUnique({
      where: { id: authorId },
      include: {
        favoriteAuthors: true,
        authorReleases: {
          orderBy: { announcedDate: 'desc' },
          take: 5
        }
      }
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      )
    }

    // Check if this author has any scraping sources
    const hasScrapingSources = !!(
      author.websiteUrl || 
      author.rssUrl || 
      (author.socialUrls && JSON.parse(author.socialUrls || '[]').length > 0)
    )

    if (!hasScrapingSources) {
      return NextResponse.json(
        { 
          error: 'No scraping sources configured for this author',
          suggestion: 'Please add websiteUrl, rssUrl, or socialUrls to enable scraping'
        },
        { status: 400 }
      )
    }

    // Check if we scraped recently (prevent spam)
    const lastScrapedAt = author.lastScrapedAt
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    if (lastScrapedAt && lastScrapedAt > oneHourAgo) {
      const nextScrapeTime = new Date(lastScrapedAt.getTime() + 60 * 60 * 1000)
      return NextResponse.json(
        { 
          error: 'Author was scraped recently. Please wait before scraping again.',
          lastScrapedAt: lastScrapedAt.toISOString(),
          nextAllowedScrape: nextScrapeTime.toISOString()
        },
        { status: 429 }
      )
    }

    // Update the lastScrapedAt timestamp
    await prisma.author.update({
      where: { id: authorId },
      data: { lastScrapedAt: new Date() }
    })

    // Import the scraper (dynamic import to avoid loading issues)
    const { authorScraper } = await import('@/lib/scraping/scraper')
    
    // Perform the actual scraping
    const scrapeResult = await authorScraper.scrapeAuthor(authorId)

    return NextResponse.json(scrapeResult)
  } catch (error) {
    console.error('Error triggering scrape:', error)
    return NextResponse.json(
      { error: 'Failed to trigger scrape job' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authorId = parseInt(params.id)

    if (isNaN(authorId)) {
      return NextResponse.json(
        { error: 'Invalid author ID' },
        { status: 400 }
      )
    }

    // Get scraping status and recent activity for this author
    const author = await prisma.author.findUnique({
      where: { id: authorId },
      select: {
        id: true,
        name: true,
        websiteUrl: true,
        rssUrl: true,
        socialUrls: true,
        lastScrapedAt: true,
        authorReleases: {
          orderBy: { lastScrapedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            releaseStatus: true,
            expectedDate: true,
            announcedDate: true,
            sourceUrl: true,
            lastScrapedAt: true,
            createdAt: true
          }
        }
      }
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      )
    }

    // Parse social URLs
    const socialUrls = author.socialUrls ? JSON.parse(author.socialUrls) : []

    // Determine scraping status
    const hasScrapingSources = !!(author.websiteUrl || author.rssUrl || socialUrls.length > 0)
    const lastScrapedAt = author.lastScrapedAt
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const canScrapeNow = !lastScrapedAt || lastScrapedAt <= oneHourAgo

    const status = {
      authorId,
      authorName: author.name,
      hasScrapingSources,
      canScrapeNow,
      lastScrapedAt: lastScrapedAt?.toISOString() || null,
      nextAllowedScrape: lastScrapedAt && lastScrapedAt > oneHourAgo 
        ? new Date(lastScrapedAt.getTime() + 60 * 60 * 1000).toISOString()
        : null,
      sources: {
        website: author.websiteUrl,
        rss: author.rssUrl,
        social: socialUrls
      },
      recentReleases: author.authorReleases
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error('Error fetching scrape status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scrape status' },
      { status: 500 }
    )
  }
}