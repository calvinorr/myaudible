import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as cheerio from 'cheerio'
import RSS from 'rss-parser'

// Mark this route as dynamic
export const dynamic = 'force-dynamic'

interface ScrapedRelease {
  title: string
  description?: string
  expectedDate?: Date
  announcedDate?: Date
  preorderUrl?: string
  sourceUrl: string
}

const rssParser = new RSS()

export async function GET() {
  try {
    // Get favorite authors that need release monitoring
    const favoriteAuthors = await prisma.favoriteAuthor.findMany({
      include: {
        author: true
      },
      where: {
        author: {
          OR: [
            { websiteUrl: { not: null } },
            { rssUrl: { not: null } },
            { socialUrls: { not: null } }
          ]
        }
      }
    })

    const releases = await prisma.authorRelease.findMany({
      include: {
        author: true
      },
      orderBy: {
        expectedDate: 'asc'
      },
      where: {
        OR: [
          { releaseStatus: { in: ['announced', 'preorder'] } },
          { 
            expectedDate: { 
              gte: new Date() 
            } 
          }
        ]
      }
    })

    return NextResponse.json({
      releases,
      monitoredAuthors: favoriteAuthors.length,
      lastUpdate: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching author releases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch author releases' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorId, forceRefresh = false } = await request.json()

    const author = await prisma.author.findUnique({
      where: { id: authorId },
      include: { favoriteAuthors: true }
    })

    if (!author || author.favoriteAuthors.length === 0) {
      return NextResponse.json(
        { error: 'Author not found or not favorited' },
        { status: 404 }
      )
    }

    // Check if we need to refresh (max once per day unless forced)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    if (!forceRefresh && author.lastScrapedAt && author.lastScrapedAt > dayAgo) {
      const existingReleases = await prisma.authorRelease.findMany({
        where: { authorId }
      })
      return NextResponse.json({
        releases: existingReleases,
        cached: true,
        lastScrapedAt: author.lastScrapedAt
      })
    }

    const newReleases: ScrapedRelease[] = []

    // Scrape RSS feed if available
    if (author.rssUrl) {
      try {
        const feed = await rssParser.parseURL(author.rssUrl)
        const recentItems = feed.items?.slice(0, 10) || []
        
        for (const item of recentItems) {
          const releaseInfo = await extractReleaseFromRSSItem(item, author.name)
          if (releaseInfo) {
            newReleases.push(releaseInfo)
          }
        }
      } catch (error) {
        console.error(`RSS parsing failed for ${author.name}:`, error)
      }
    }

    // Scrape website if available
    if (author.websiteUrl) {
      try {
        const websiteReleases = await scrapeAuthorWebsite(author.websiteUrl, author.name)
        newReleases.push(...websiteReleases)
      } catch (error) {
        console.error(`Website scraping failed for ${author.name}:`, error)
      }
    }

    // Save discovered releases to database
    const savedReleases = []
    for (const release of newReleases) {
      try {
        const savedRelease = await prisma.authorRelease.upsert({
          where: {
            authorId_title: {
              authorId: author.id,
              title: release.title
            }
          },
          update: {
            description: release.description,
            expectedDate: release.expectedDate,
            preorderUrl: release.preorderUrl,
            sourceUrl: release.sourceUrl,
            lastScrapedAt: new Date()
          },
          create: {
            authorId: author.id,
            title: release.title,
            description: release.description,
            expectedDate: release.expectedDate,
            announcedDate: release.announcedDate || new Date(),
            preorderUrl: release.preorderUrl,
            sourceUrl: release.sourceUrl,
            releaseStatus: release.expectedDate && release.expectedDate > new Date() ? 'announced' : 'published'
          }
        })
        savedReleases.push(savedRelease)
      } catch (error) {
        console.error(`Failed to save release ${release.title}:`, error)
      }
    }

    // Update author's last scraped timestamp
    await prisma.author.update({
      where: { id: author.id },
      data: { lastScrapedAt: new Date() }
    })

    return NextResponse.json({
      releases: savedReleases,
      newReleases: savedReleases.length,
      author: author.name,
      scrapedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error refreshing author releases:', error)
    return NextResponse.json(
      { error: 'Failed to refresh author releases' },
      { status: 500 }
    )
  }
}

// Helper functions
async function extractReleaseFromRSSItem(item: any, authorName: string): Promise<ScrapedRelease | null> {
  const title = item.title
  const content = item.content || item.contentSnippet || item.summary || ''
  
  // Look for book-related keywords
  const bookKeywords = ['book', 'novel', 'release', 'publish', 'available', 'preorder', 'coming']
  const hasBookKeywords = bookKeywords.some(keyword => 
    title.toLowerCase().includes(keyword) || content.toLowerCase().includes(keyword)
  )
  
  if (!hasBookKeywords) return null
  
  // Try to extract dates from content
  const dateMatches = content.match(/(?:coming|available|released?|publish(?:ed)?)\s+(?:on\s+)?([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/i)
  let expectedDate: Date | undefined
  
  if (dateMatches && dateMatches[1]) {
    try {
      expectedDate = new Date(dateMatches[1])
      if (isNaN(expectedDate.getTime())) expectedDate = undefined
    } catch (e) {
      expectedDate = undefined
    }
  }
  
  return {
    title: title.replace(/^[^:]*:\s*/, ''), // Remove "Author Name: " prefix
    description: content.substring(0, 500),
    expectedDate,
    announcedDate: new Date(item.pubDate || item.isoDate || Date.now()),
    sourceUrl: item.link || '',
  }
}

async function scrapeAuthorWebsite(url: string, authorName: string): Promise<ScrapedRelease[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AudiobookLibrary/1.0)'
      }
    })
    
    if (!response.ok) return []
    
    const html = await response.text()
    const $ = cheerio.load(html)
    const releases: ScrapedRelease[] = []
    
    // Common selectors for book announcements
    const bookSelectors = [
      '.book', '.novel', '.release', '.upcoming',
      '[class*="book"]', '[class*="novel"]', '[class*="release"]',
      'article', '.post', '.news-item'
    ]
    
    for (const selector of bookSelectors) {
      $(selector).each((_, element) => {
        const $el = $(element)
        const text = $el.text().toLowerCase()
        
        // Look for book-related content
        if (text.includes('book') || text.includes('novel') || text.includes('release')) {
          const title = $el.find('h1, h2, h3, .title').first().text().trim() || 
                       $el.text().split('\n')[0].trim()
          
          if (title && title.length > 0 && title.length < 200) {
            const description = $el.text().substring(0, 500).trim()
            
            // Try to find preorder links
            const preorderLink = $el.find('a[href*="amazon"], a[href*="preorder"], a[href*="buy"]').attr('href')
            
            releases.push({
              title,
              description,
              sourceUrl: url,
              preorderUrl: preorderLink
            })
          }
        }
      })
      
      if (releases.length >= 5) break // Limit results
    }
    
    return releases.slice(0, 5) // Return max 5 releases
    
  } catch (error) {
    console.error(`Website scraping error for ${url}:`, error)
    return []
  }
}