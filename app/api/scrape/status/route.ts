import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // Get overall scraping statistics
    const [
      totalAuthors,
      authorsWithScrapingSources,
      favoriteAuthors,
      totalReleases,
      recentReleases,
      recentlyScrapedAuthors
    ] = await Promise.all([
      // Total authors count
      prisma.author.count(),
      
      // Authors with at least one scraping source
      prisma.author.count({
        where: {
          OR: [
            { websiteUrl: { not: null } },
            { rssUrl: { not: null } },
            { socialUrls: { not: null } }
          ]
        }
      }),
      
      // Favorite authors count
      prisma.author.count({
        where: {
          favoriteAuthors: {
            some: {}
          }
        }
      }),
      
      // Total releases tracked
      prisma.authorRelease.count(),
      
      // Releases discovered in the last 30 days
      prisma.authorRelease.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Recently scraped authors
      prisma.author.findMany({
        where: {
          lastScrapedAt: { not: null }
        },
        select: {
          id: true,
          name: true,
          lastScrapedAt: true,
          websiteUrl: true,
          rssUrl: true,
          socialUrls: true,
          favoriteAuthors: true,
          _count: {
            select: {
              authorReleases: true
            }
          }
        },
        orderBy: { lastScrapedAt: 'desc' },
        take: limit
      })
    ])

    // Get upcoming releases count by status
    const releasesByStatus = await prisma.authorRelease.groupBy({
      by: ['releaseStatus'],
      _count: {
        releaseStatus: true
      }
    })

    // Transform recently scraped authors data
    const transformedRecentlyScraped = recentlyScrapedAuthors.map(author => ({
      id: author.id,
      name: author.name,
      lastScrapedAt: author.lastScrapedAt,
      isFavorite: author.favoriteAuthors.length > 0,
      releasesTracked: author._count.authorReleases,
      sources: {
        website: !!author.websiteUrl,
        rss: !!author.rssUrl,
        social: author.socialUrls ? JSON.parse(author.socialUrls).length > 0 : false
      }
    }))

    // Calculate scraping health metrics
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [authorsScrapedToday, authorsScrapedThisWeek] = await Promise.all([
      prisma.author.count({
        where: {
          lastScrapedAt: { gte: oneDayAgo }
        }
      }),
      prisma.author.count({
        where: {
          lastScrapedAt: { gte: oneWeekAgo }
        }
      })
    ])

    const scrapingStatus = {
      overview: {
        totalAuthors,
        authorsWithScrapingSources,
        favoriteAuthors,
        totalReleases,
        recentReleases,
        scrapingCoverage: totalAuthors > 0 ? Math.round((authorsWithScrapingSources / totalAuthors) * 100) : 0
      },
      releases: {
        byStatus: releasesByStatus.reduce((acc, item) => {
          acc[item.releaseStatus] = item._count.releaseStatus
          return acc
        }, {} as Record<string, number>)
      },
      activity: {
        authorsScrapedToday,
        authorsScrapedThisWeek,
        recentlyScrapedAuthors: transformedRecentlyScraped
      },
      health: {
        status: authorsScrapedToday > 0 ? 'active' : 'inactive',
        lastActivity: recentlyScrapedAuthors[0]?.lastScrapedAt || null,
        dailyActivityRate: favoriteAuthors > 0 ? Math.round((authorsScrapedToday / favoriteAuthors) * 100) : 0,
        weeklyActivityRate: favoriteAuthors > 0 ? Math.round((authorsScrapedThisWeek / favoriteAuthors) * 100) : 0
      }
    }

    return NextResponse.json(scrapingStatus)
  } catch (error) {
    console.error('Error fetching scraping status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scraping status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, authorIds } = body

    if (action === 'scrape_favorites') {
      // Import the scraper (dynamic import to avoid loading issues)
      const { authorScraper } = await import('@/lib/scraping/scraper')
      
      // Perform bulk scraping of favorite authors
      const bulkResult = await authorScraper.scrapeFavoriteAuthors()

      return NextResponse.json({
        message: `Scraped ${bulkResult.totalAuthors} favorite authors`,
        results: bulkResult
      })
    }

    if (action === 'scrape_specific' && authorIds && Array.isArray(authorIds)) {
      // Import the scraper (dynamic import to avoid loading issues)
      const { authorScraper } = await import('@/lib/scraping/scraper')
      
      // Convert to numbers and scrape specific authors
      const numericIds = authorIds.map(id => parseInt(id)).filter(id => !isNaN(id))
      const bulkResult = await authorScraper.scrapeSpecificAuthors(numericIds)

      return NextResponse.json({
        message: `Scraped ${bulkResult.totalAuthors} specific authors`,
        results: bulkResult
      })
    }

    return NextResponse.json(
      { error: 'Invalid action or parameters' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing scraping action:', error)
    return NextResponse.json(
      { error: 'Failed to process scraping action' },
      { status: 500 }
    )
  }
}