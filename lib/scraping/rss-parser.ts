import '../polyfills' // Import polyfills first
import Parser from 'rss-parser'
import { prisma } from '@/lib/prisma'

interface CustomFeed {
  title?: string
  description?: string
  link?: string
  language?: string
  pubDate?: string
  lastBuildDate?: string
}

interface CustomItem {
  title?: string
  link?: string
  pubDate?: string
  contentSnippet?: string
  content?: string
  categories?: string[]
  author?: string
  guid?: string
}

type RSSParser = Parser<CustomFeed, CustomItem>

interface RSSParseResult {
  success: boolean
  error?: string
  newReleases: any[]
  updatedReleases: any[]
  feedInfo?: {
    title?: string
    description?: string
    lastUpdated?: string
  }
}

class RSSFeedParser {
  private parser: RSSParser
  
  constructor() {
    this.parser = new Parser({
      customFields: {
        feed: ['title', 'description', 'link', 'language', 'pubDate', 'lastBuildDate'],
        item: ['title', 'link', 'pubDate', 'contentSnippet', 'content', 'categories', 'author', 'guid']
      }
    })
  }

  /**
   * Detect RSS feeds from a website URL
   */
  async detectRSSFeeds(websiteUrl: string): Promise<string[]> {
    const feeds: string[] = []
    
    try {
      // Common RSS feed patterns
      const commonPaths = [
        '/rss',
        '/feed',
        '/rss.xml',
        '/feed.xml',  
        '/atom.xml',
        '/news/rss',
        '/blog/rss',
        '/blog/feed',
        '/news.xml',
        '/posts/rss',
        '/updates/rss'
      ]

      const baseUrl = new URL(websiteUrl)
      
      // Add common feed paths
      for (const path of commonPaths) {
        const feedUrl = new URL(path, baseUrl).toString()
        feeds.push(feedUrl)
      }

      // Try to fetch the main page and look for feed links
      try {
        const response = await fetch(websiteUrl, {
          headers: {
            'User-Agent': 'MyAudible-Scraper/1.0 (Book Release Tracker)'
          }
        })

        if (response.ok) {
          const html = await response.text()
          
          // Look for RSS/Atom feed links in HTML
          const feedLinkRegex = /<link[^>]*(?:type=["']application\/(?:rss\+xml|atom\+xml|rdf\+xml)["'][^>]*href=["']([^"']+)["']|href=["']([^"']+)["'][^>]*type=["']application\/(?:rss\+xml|atom\+xml|rdf\+xml)["'])/gi
          
          let match
          while ((match = feedLinkRegex.exec(html)) !== null) {
            const feedPath = match[1] || match[2]
            if (feedPath) {
              const absoluteFeedUrl = new URL(feedPath, baseUrl).toString()
              feeds.push(absoluteFeedUrl)
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch website for RSS detection:', error)
      }

      // Remove duplicates
      return [...new Set(feeds)]
    } catch (error) {
      console.error('Error detecting RSS feeds:', error)
      return feeds
    }
  }

  /**
   * Validate if a URL is a valid RSS/Atom feed
   */
  async validateRSSFeed(feedUrl: string): Promise<{ isValid: boolean; title?: string; error?: string }> {
    try {
      const feed = await this.parser.parseURL(feedUrl)
      return {
        isValid: true,
        title: feed.title || 'Unknown Feed'
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Parse RSS feed and extract potential book releases
   */
  async parseRSSFeedForReleases(authorId: number, feedUrl: string): Promise<RSSParseResult> {
    try {
      const feed = await this.parser.parseURL(feedUrl)
      const author = await prisma.author.findUnique({ where: { id: authorId } })
      
      if (!author) {
        return { success: false, error: 'Author not found', newReleases: [], updatedReleases: [] }
      }

      const newReleases: any[] = []
      const updatedReleases: any[] = []
      
      // Filter items from the last 6 months to avoid too much noise
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const recentItems = feed.items.filter(item => {
        if (!item.pubDate) return true // Include items without dates
        const itemDate = new Date(item.pubDate)
        return itemDate >= sixMonthsAgo
      })

      for (const item of recentItems) {
        if (!item.title) continue

        // Check if this looks like a book announcement
        const isBookRelated = this.detectBookRelatedContent(item.title, item.contentSnippet || item.content || '')
        
        if (isBookRelated.isBook) {
          const releaseInfo = {
            title: this.extractBookTitle(item.title),
            description: item.contentSnippet || item.content?.substring(0, 500) || null,
            sourceUrl: item.link || feedUrl,
            announcedDate: item.pubDate ? new Date(item.pubDate) : new Date(),
            expectedDate: this.extractReleaseDate(item.title, item.contentSnippet || item.content || ''),
            releaseStatus: 'announced' as const,
            confidence: isBookRelated.confidence
          }

          // Check if we already have this release
          const existingRelease = await prisma.authorRelease.findUnique({
            where: {
              authorId_title: {
                authorId,
                title: releaseInfo.title
              }
            }
          })

          if (existingRelease) {
            // Update existing release if we have new information
            if (releaseInfo.expectedDate && !existingRelease.expectedDate) {
              await prisma.authorRelease.update({
                where: { id: existingRelease.id },
                data: {
                  expectedDate: releaseInfo.expectedDate,
                  sourceUrl: releaseInfo.sourceUrl,
                  lastScrapedAt: new Date()
                }
              })
              updatedReleases.push({ ...existingRelease, ...releaseInfo })
            }
          } else {
            // Create new release
            const newRelease = await prisma.authorRelease.create({
              data: {
                authorId,
                ...releaseInfo,
                lastScrapedAt: new Date()
              }
            })
            newReleases.push(newRelease)
          }
        }
      }

      return {
        success: true,
        newReleases,
        updatedReleases,
        feedInfo: {
          title: feed.title,
          description: feed.description,
          lastUpdated: feed.lastBuildDate || feed.pubDate
        }
      }
    } catch (error) {
      console.error('Error parsing RSS feed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        newReleases: [],
        updatedReleases: []
      }
    }
  }

  /**
   * Detect if content is book-related using keywords and patterns
   */
  private detectBookRelatedContent(title: string, content: string): { isBook: boolean; confidence: number } {
    const combinedText = `${title} ${content}`.toLowerCase()
    
    // High confidence keywords
    const highConfidenceKeywords = [
      'new book', 'upcoming book', 'book release', 'book announcement',
      'pre-order', 'preorder', 'coming soon', 'available now',
      'published', 'release date', 'audiobook', 'new novel',
      'sequel', 'new series', 'book cover reveal'
    ]
    
    // Medium confidence keywords
    const mediumConfidenceKeywords = [
      'book', 'novel', 'story', 'chapter', 'writing', 'author',
      'publisher', 'isbn', 'kindle', 'hardcover', 'paperback'
    ]

    let confidence = 0
    
    // Check high confidence keywords
    for (const keyword of highConfidenceKeywords) {
      if (combinedText.includes(keyword)) {
        confidence += 0.3
      }
    }
    
    // Check medium confidence keywords
    for (const keyword of mediumConfidenceKeywords) {
      if (combinedText.includes(keyword)) {
        confidence += 0.1
      }
    }

    // Bonus for multiple book-related terms
    const bookTermCount = combinedText.match(/\b(book|novel|story|audiobook|kindle|hardcover|paperback)\b/g)?.length || 0
    if (bookTermCount > 2) confidence += 0.2

    // Check for date patterns (release dates)
    const datePattern = /\b(?:january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})\b/i
    if (datePattern.test(combinedText)) confidence += 0.1

    return {
      isBook: confidence >= 0.4,
      confidence: Math.min(confidence, 1.0)
    }
  }

  /**
   * Extract clean book title from RSS item title
   */
  private extractBookTitle(itemTitle: string): string {
    // Remove common prefixes and suffixes
    let title = itemTitle
      .replace(/^(new book:?|book announcement:?|coming soon:?|pre-?order:?)\s*/i, '')
      .replace(/\s*-\s*available\s+now$/i, '')
      .replace(/\s*-\s*coming\s+soon$/i, '')
      .replace(/\s*\|\s*.*$/i, '') // Remove everything after |
      .trim()

    // Remove quotes if the entire title is quoted
    if ((title.startsWith('"') && title.endsWith('"')) || 
        (title.startsWith("'") && title.endsWith("'"))) {
      title = title.slice(1, -1)
    }

    return title
  }

  /**
   * Extract potential release date from content
   */
  private extractReleaseDate(title: string, content: string): Date | null {
    const combinedText = `${title} ${content}`
    
    // Look for explicit date patterns
    const patterns = [
      /(?:coming|available|released?|published?)\s+(?:on\s+)?([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
      /(?:coming|available|released?|published?)\s+(?:on\s+)?(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /(?:coming|available|released?|published?)\s+(?:on\s+)?(\d{4}-\d{2}-\d{2})/i,
      /release\s+date:?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
      /([A-Za-z]+\s+\d{4})\s+release/i
    ]

    for (const pattern of patterns) {
      const match = combinedText.match(pattern)
      if (match) {
        try {
          const date = new Date(match[1])
          if (!isNaN(date.getTime()) && date > new Date()) {
            return date
          }
        } catch (error) {
          // Ignore invalid dates
        }
      }
    }

    return null
  }
}

export const rssParser = new RSSFeedParser()