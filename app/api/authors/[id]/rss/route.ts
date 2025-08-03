import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // Import scraper (dynamic import to avoid loading issues)
    const { authorScraper } = await import('@/lib/scraping/scraper')

    // Detect and validate RSS feeds for this author
    const result = await authorScraper.detectAndValidateRSSFeeds(authorId)

    return NextResponse.json({
      authorId,
      detectedFeeds: result.feeds,
      validFeeds: result.validFeeds,
      message: `Found ${result.validFeeds.length} valid RSS feeds out of ${result.feeds.length} detected`
    })
  } catch (error) {
    console.error('Error detecting RSS feeds:', error)
    return NextResponse.json(
      { error: 'Failed to detect RSS feeds' },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()
    const { action, rssUrl } = body

    // Import scraper (dynamic import to avoid loading issues)
    const { authorScraper } = await import('@/lib/scraping/scraper')

    switch (action) {
      case 'auto_setup':
        // Automatically detect and setup the best RSS feed
        const setupResult = await authorScraper.setupAuthorRSSFeeds(authorId)
        return NextResponse.json(setupResult)

      case 'set_feed':
        if (!rssUrl) {
          return NextResponse.json(
            { error: 'RSS URL is required for set_feed action' },
            { status: 400 }
          )
        }

        // Validate the provided RSS URL
        const { rssParser } = await import('@/lib/scraping/rss-parser')
        const validation = await rssParser.validateRSSFeed(rssUrl)
        
        if (!validation.isValid) {
          return NextResponse.json(
            { error: `Invalid RSS feed: ${validation.error}` },
            { status: 400 }
          )
        }

        // Update the author's RSS URL
        const updatedAuthor = await prisma.author.update({
          where: { id: authorId },
          data: { rssUrl }
        })

        return NextResponse.json({
          success: true,
          message: `RSS feed set to: ${rssUrl}`,
          author: {
            id: updatedAuthor.id,
            name: updatedAuthor.name,
            rssUrl: updatedAuthor.rssUrl
          }
        })

      case 'remove_feed':
        // Remove the RSS feed from the author
        const authorWithoutRss = await prisma.author.update({
          where: { id: authorId },
          data: { rssUrl: null }
        })

        return NextResponse.json({
          success: true,
          message: 'RSS feed removed',
          author: {
            id: authorWithoutRss.id,
            name: authorWithoutRss.name,
            rssUrl: authorWithoutRss.rssUrl
          }
        })

      case 'test_feed':
        // Test the current RSS feed for this author
        const author = await prisma.author.findUnique({
          where: { id: authorId }
        })

        if (!author || !author.rssUrl) {
          return NextResponse.json(
            { error: 'No RSS feed configured for this author' },
            { status: 400 }
          )
        }

        const { rssParser: testParser } = await import('@/lib/scraping/rss-parser')
        const testResult = await testParser.parseRSSFeedForReleases(authorId, author.rssUrl)

        return NextResponse.json({
          success: testResult.success,
          message: testResult.success 
            ? `RSS feed test successful. Found ${testResult.newReleases.length} new releases, ${testResult.updatedReleases.length} updated releases`
            : `RSS feed test failed: ${testResult.error}`,
          results: testResult
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be auto_setup, set_feed, remove_feed, or test_feed' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error managing RSS feed:', error)
    return NextResponse.json(
      { error: 'Failed to manage RSS feed' },
      { status: 500 }
    )
  }
}