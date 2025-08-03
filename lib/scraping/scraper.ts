import '../polyfills' // Import polyfills first
import { prisma } from '@/lib/prisma'
import { rssParser } from './rss-parser'
import { websiteScraper } from './website-scraper'

interface ScrapeAuthorResult {
  authorId: number
  authorName: string
  success: boolean
  error?: string
  scrapingSources: {
    website: boolean
    rss: boolean
    social: boolean
  }
  results: {
    newReleases: number
    updatedReleases: number
    totalProcessed: number
  }
  details: {
    rssResults?: any
    websiteResults?: any
    socialResults?: any
  }
  scrapedAt: string
}

interface BulkScrapeResult {
  totalAuthors: number
  successfulScrapes: number
  failedScrapes: number
  totalNewReleases: number
  totalUpdatedReleases: number
  results: ScrapeAuthorResult[]
  startedAt: string
  completedAt: string
}

class AuthorScraper {
  /**
   * Scrape a single author for new book releases
   */
  async scrapeAuthor(authorId: number): Promise<ScrapeAuthorResult> {
    const startTime = new Date()
    
    try {
      // Get author with scraping configuration
      const author = await prisma.author.findUnique({
        where: { id: authorId },
        include: {
          favoriteAuthors: true,
          authorReleases: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      })

      if (!author) {
        return {
          authorId,
          authorName: 'Unknown',
          success: false,
          error: 'Author not found',
          scrapingSources: { website: false, rss: false, social: false },
          results: { newReleases: 0, updatedReleases: 0, totalProcessed: 0 },
          details: {},
          scrapedAt: startTime.toISOString()
        }
      }

      // Check rate limiting
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      if (author.lastScrapedAt && author.lastScrapedAt > oneHourAgo) {
        return {
          authorId,
          authorName: author.name,
          success: false,
          error: 'Rate limited - scraped recently',
          scrapingSources: { website: false, rss: false, social: false },
          results: { newReleases: 0, updatedReleases: 0, totalProcessed: 0 },
          details: {},
          scrapedAt: startTime.toISOString()
        }
      }

      // Determine available scraping sources
      const scrapingSources = {
        website: !!author.websiteUrl,
        rss: !!author.rssUrl,
        social: !!(author.socialUrls && JSON.parse(author.socialUrls || '[]').length > 0)
      }

      if (!scrapingSources.website && !scrapingSources.rss && !scrapingSources.social) {
        return {
          authorId,
          authorName: author.name,
          success: false,
          error: 'No scraping sources configured',
          scrapingSources,
          results: { newReleases: 0, updatedReleases: 0, totalProcessed: 0 },
          details: {},
          scrapedAt: startTime.toISOString()
        }
      }

      let totalNewReleases = 0
      let totalUpdatedReleases = 0
      const details: any = {}

      // 1. RSS Scraping
      if (scrapingSources.rss && author.rssUrl) {
        try {
          console.log(`Scraping RSS feed for ${author.name}: ${author.rssUrl}`)
          const rssResult = await rssParser.parseRSSFeedForReleases(authorId, author.rssUrl)
          details.rssResults = rssResult
          
          if (rssResult.success) {
            totalNewReleases += rssResult.newReleases.length
            totalUpdatedReleases += rssResult.updatedReleases.length
          }
        } catch (error) {
          console.error(`RSS scraping failed for ${author.name}:`, error)
          details.rssResults = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
      }

      // 2. Website Scraping
      if (scrapingSources.website && author.websiteUrl) {
        try {
          console.log(`Scraping website for ${author.name}: ${author.websiteUrl}`)
          
          // Try static scraping first (faster)
          let websiteResult = await websiteScraper.scrapeStaticContent(authorId, author.websiteUrl)
          
          // If static scraping didn't find much, try dynamic scraping
          if (websiteResult.success && websiteResult.newReleases.length === 0 && websiteResult.updatedReleases.length === 0) {
            console.log(`Static scraping found nothing, trying dynamic scraping for ${author.name}`)
            websiteResult = await websiteScraper.scrapeDynamicContent(authorId, author.websiteUrl)
          }
          
          details.websiteResults = websiteResult
          
          if (websiteResult.success) {
            totalNewReleases += websiteResult.newReleases.length
            totalUpdatedReleases += websiteResult.updatedReleases.length
          }
        } catch (error) {
          console.error(`Website scraping failed for ${author.name}:`, error)
          details.websiteResults = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
      }

      // 3. Social Media Scraping (placeholder for now)
      if (scrapingSources.social && author.socialUrls) {
        try {
          const socialUrls = JSON.parse(author.socialUrls)
          console.log(`Social media scraping for ${author.name}: ${socialUrls.length} URLs`)
          
          // Placeholder - would implement Twitter/Instagram/Facebook scraping
          details.socialResults = {
            success: true,
            message: `Social media scraping not yet implemented. Found ${socialUrls.length} social URLs.`,
            urls: socialUrls,
            newReleases: [],
            updatedReleases: []
          }
        } catch (error) {
          console.error(`Social media scraping failed for ${author.name}:`, error)
          details.socialResults = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
      }

      // Update author's last scraped timestamp
      await prisma.author.update({
        where: { id: authorId },
        data: { lastScrapedAt: new Date() }
      })

      const success = totalNewReleases > 0 || totalUpdatedReleases > 0 || 
                     (details.rssResults?.success || details.websiteResults?.success)

      return {
        authorId,
        authorName: author.name,
        success,
        scrapingSources,
        results: {
          newReleases: totalNewReleases,
          updatedReleases: totalUpdatedReleases,
          totalProcessed: totalNewReleases + totalUpdatedReleases
        },
        details,
        scrapedAt: startTime.toISOString()
      }
    } catch (error) {
      console.error(`Failed to scrape author ${authorId}:`, error)
      return {
        authorId,
        authorName: 'Unknown',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        scrapingSources: { website: false, rss: false, social: false },
        results: { newReleases: 0, updatedReleases: 0, totalProcessed: 0 },
        details: {},
        scrapedAt: startTime.toISOString()
      }
    }
  }

  /**
   * Scrape all favorite authors
   */
  async scrapeFavoriteAuthors(): Promise<BulkScrapeResult> {
    const startTime = new Date()
    
    // Get all favorite authors with scraping sources
    const favoriteAuthors = await prisma.author.findMany({
      where: {
        favoriteAuthors: {
          some: {}
        },
        OR: [
          { websiteUrl: { not: null } },
          { rssUrl: { not: null } },
          { socialUrls: { not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        lastScrapedAt: true
      }
    })

    console.log(`Found ${favoriteAuthors.length} favorite authors with scraping sources`)

    // Filter authors that haven't been scraped recently
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const authorsToScrape = favoriteAuthors.filter(author => 
      !author.lastScrapedAt || author.lastScrapedAt < oneHourAgo
    )

    console.log(`Scraping ${authorsToScrape.length} authors (${favoriteAuthors.length - authorsToScrape.length} skipped due to rate limiting)`)

    const results: ScrapeAuthorResult[] = []
    let successfulScrapes = 0
    let totalNewReleases = 0
    let totalUpdatedReleases = 0

    // Scrape authors with delay between requests
    for (const author of authorsToScrape) {
      console.log(`Scraping ${author.name} (${author.id})...`)
      
      const result = await this.scrapeAuthor(author.id)
      results.push(result)
      
      if (result.success) {
        successfulScrapes++
        totalNewReleases += result.results.newReleases
        totalUpdatedReleases += result.results.updatedReleases
      }

      // Rate limiting delay between requests (2-5 seconds)
      const delay = 2000 + Math.random() * 3000
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    // Close browser if it was used
    await websiteScraper.closeBrowser()

    const completedAt = new Date()

    return {
      totalAuthors: authorsToScrape.length,
      successfulScrapes,
      failedScrapes: authorsToScrape.length - successfulScrapes,
      totalNewReleases,
      totalUpdatedReleases,
      results,
      startedAt: startTime.toISOString(),
      completedAt: completedAt.toISOString()
    }
  }

  /**
   * Scrape specific list of authors
   */
  async scrapeSpecificAuthors(authorIds: number[]): Promise<BulkScrapeResult> {
    const startTime = new Date()
    
    console.log(`Scraping ${authorIds.length} specific authors`)

    const results: ScrapeAuthorResult[] = []
    let successfulScrapes = 0
    let totalNewReleases = 0
    let totalUpdatedReleases = 0

    for (const authorId of authorIds) {
      const result = await this.scrapeAuthor(authorId)
      results.push(result)
      
      if (result.success) {
        successfulScrapes++
        totalNewReleases += result.results.newReleases
        totalUpdatedReleases += result.results.updatedReleases
      }

      // Rate limiting delay
      const delay = 2000 + Math.random() * 3000
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    // Close browser if it was used
    await websiteScraper.closeBrowser()

    const completedAt = new Date()

    return {
      totalAuthors: authorIds.length,
      successfulScrapes,
      failedScrapes: authorIds.length - successfulScrapes,
      totalNewReleases,
      totalUpdatedReleases,
      results,
      startedAt: startTime.toISOString(),
      completedAt: completedAt.toISOString()
    }
  }

  /**
   * Auto-detect and validate RSS feeds for an author
   */
  async detectAndValidateRSSFeeds(authorId: number): Promise<{ feeds: string[], validFeeds: string[] }> {
    const author = await prisma.author.findUnique({ where: { id: authorId } })
    
    if (!author || !author.websiteUrl) {
      return { feeds: [], validFeeds: [] }
    }

    // Detect RSS feeds
    const detectedFeeds = await rssParser.detectRSSFeeds(author.websiteUrl)
    const validFeeds: string[] = []

    // Validate each detected feed
    for (const feedUrl of detectedFeeds) {
      try {
        const validation = await rssParser.validateRSSFeed(feedUrl)
        if (validation.isValid) {
          validFeeds.push(feedUrl)
          console.log(`Valid RSS feed found for ${author.name}: ${feedUrl} (${validation.title})`)
        }
      } catch (error) {
        console.warn(`Failed to validate RSS feed ${feedUrl}:`, error)
      }
      
      // Small delay between validation requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return { feeds: detectedFeeds, validFeeds }
  }

  /**
   * Setup RSS feeds for an author
   */
  async setupAuthorRSSFeeds(authorId: number): Promise<{ success: boolean, message: string, rssUrl?: string }> {
    const author = await prisma.author.findUnique({ where: { id: authorId } })
    
    if (!author) {
      return { success: false, message: 'Author not found' }
    }

    if (author.rssUrl) {
      return { success: true, message: 'RSS feed already configured', rssUrl: author.rssUrl }
    }

    if (!author.websiteUrl) {
      return { success: false, message: 'No website URL configured for author' }
    }

    const { validFeeds } = await this.detectAndValidateRSSFeeds(authorId)
    
    if (validFeeds.length === 0) {
      return { success: false, message: 'No valid RSS feeds found' }
    }

    // Use the first valid feed
    const selectedFeed = validFeeds[0]
    
    await prisma.author.update({
      where: { id: authorId },
      data: { rssUrl: selectedFeed }
    })

    return { 
      success: true, 
      message: `RSS feed configured: ${selectedFeed}`,
      rssUrl: selectedFeed
    }
  }
}

export const authorScraper = new AuthorScraper()