import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const favoriteAuthors = await prisma.favoriteAuthor.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            websiteUrl: true,
            rssUrl: true,
            socialUrls: true,
            lastScrapedAt: true,
            _count: {
              select: {
                authorReleases: true
              }
            }
          }
        }
      },
      orderBy: {
        author: {
          name: 'asc'
        }
      }
    })

    const authorsWithSources = favoriteAuthors.map(fa => ({
      id: fa.author.id,
      name: fa.author.name,
      imageUrl: fa.author.imageUrl,
      websiteUrl: fa.author.websiteUrl,
      rssUrl: fa.author.rssUrl,
      socialUrls: fa.author.socialUrls,
      lastScrapedAt: fa.author.lastScrapedAt,
      releasesCount: fa.author._count.authorReleases,
      hasScrapingSources: !!(fa.author.websiteUrl || fa.author.rssUrl || fa.author.socialUrls),
      scrapingStatus: getScrapingStatus(fa.author.lastScrapedAt),
      favoritedAt: fa.favoritedAt
    }))

    const stats = {
      totalFavoriteAuthors: favoriteAuthors.length,
      authorsWithScrapingSources: authorsWithSources.filter(a => a.hasScrapingSources).length,
      authorsScrapedToday: authorsWithSources.filter(a => a.scrapingStatus === 'scraped_today').length,
      authorsScrapedThisWeek: authorsWithSources.filter(a => a.scrapingStatus === 'scraped_this_week').length,
      totalReleases: authorsWithSources.reduce((sum, author) => sum + author.releasesCount, 0)
    }

    return NextResponse.json({
      authors: authorsWithSources,
      stats
    })
  } catch (error) {
    console.error('Error fetching authors with scraping sources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch authors with scraping sources' },
      { status: 500 }
    )
  }
}

function getScrapingStatus(lastScrapedAt: Date | null): string {
  if (!lastScrapedAt) return 'never_scraped'
  
  const now = new Date()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  if (lastScrapedAt > dayAgo) return 'scraped_today'
  if (lastScrapedAt > weekAgo) return 'scraped_this_week'
  return 'scraped_older'
}