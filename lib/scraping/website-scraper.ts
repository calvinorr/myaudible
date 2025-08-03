import '../polyfills' // Import polyfills first
import * as cheerio from 'cheerio'
import { chromium, Browser, Page } from 'playwright'
import { prisma } from '@/lib/prisma'

interface ScrapeResult {
  success: boolean
  error?: string
  newReleases: any[]
  updatedReleases: any[]
  scrapedData?: {
    title?: string
    urls: string[]
    content: any[]
  }
}

interface BookRelatedContent {
  title: string
  description?: string
  url: string
  publishDate?: Date
  confidence: number
  selectors?: string[]
}

class WebsiteScraper {
  private browser: Browser | null = null

  /**
   * Initialize Playwright browser
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
    }
    return this.browser
  }

  /**
   * Close browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  /**
   * Scrape author website for book announcements using Cheerio (for static content)
   */
  async scrapeStaticContent(authorId: number, websiteUrl: string): Promise<ScrapeResult> {
    try {
      const author = await prisma.author.findUnique({ where: { id: authorId } })
      if (!author) {
        return { success: false, error: 'Author not found', newReleases: [], updatedReleases: [] }
      }

      // Fetch the website
      const response = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'MyAudible-Scraper/1.0 (Book Release Tracker)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}`, newReleases: [], updatedReleases: [] }
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // Common selectors for book-related content
      const contentSelectors = [
        // General content areas
        'article', '.post', '.entry', '.content', '.news-item',
        '.announcement', '.update', '.release', '.book',
        // Specific book-related selectors
        '.book-announcement', '.new-release', '.upcoming-book',
        '.book-info', '.publication', '.title-info',
        // Blog and news selectors
        '.blog-post', '.news-post', '.press-release',
        // Header areas that might contain announcements
        '.hero', '.banner', '.featured', '.highlight'
      ]

      const bookRelatedContent: BookRelatedContent[] = []

      // Scrape using each selector
      for (const selector of contentSelectors) {
        $(selector).each((index, element) => {
          const $el = $(element)
          const text = $el.text().trim()
          const title = this.extractTitleFromElement($el)
          
          if (text && title && this.isBookRelatedContent(text)) {
            const confidence = this.calculateContentConfidence(text, title)
            
            if (confidence >= 0.3) {
              bookRelatedContent.push({
                title: this.cleanTitle(title),
                description: this.extractDescription($el, text),
                url: this.extractLinkFromElement($el, websiteUrl),
                publishDate: this.extractDateFromText(text),
                confidence,
                selectors: [selector]
              })
            }
          }
        })
      }

      // Remove duplicates and sort by confidence
      const uniqueContent = this.deduplicateContent(bookRelatedContent)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10) // Limit to top 10 results

      // Process the content and create releases
      const newReleases: any[] = []
      const updatedReleases: any[] = []

      for (const content of uniqueContent) {
        if (content.confidence >= 0.5) { // Only process high-confidence matches
          // Check if release already exists
          const existingRelease = await prisma.authorRelease.findFirst({
            where: {
              authorId,
              OR: [
                { title: content.title },
                { sourceUrl: content.url }
              ]
            }
          })

          if (existingRelease) {
            // Update existing release
            const updateData: any = {
              lastScrapedAt: new Date(),
              sourceUrl: content.url
            }

            if (content.publishDate && !existingRelease.expectedDate) {
              updateData.expectedDate = content.publishDate
            }

            if (content.description && !existingRelease.description) {
              updateData.description = content.description
            }

            const updatedRelease = await prisma.authorRelease.update({
              where: { id: existingRelease.id },
              data: updateData
            })
            updatedReleases.push(updatedRelease)
          } else {
            // Create new release
            const newRelease = await prisma.authorRelease.create({
              data: {
                authorId,
                title: content.title,
                description: content.description,
                sourceUrl: content.url,
                expectedDate: content.publishDate,
                announcedDate: new Date(),
                releaseStatus: 'announced',
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
        scrapedData: {
          title: $('title').text() || 'Unknown',
          urls: [websiteUrl],
          content: uniqueContent
        }
      }
    } catch (error) {
      console.error('Error scraping static content:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        newReleases: [],
        updatedReleases: []
      }
    }
  }

  /**
   * Scrape author website using Playwright (for dynamic content)
   */
  async scrapeDynamicContent(authorId: number, websiteUrl: string): Promise<ScrapeResult> {
    let page: Page | null = null
    
    try {
      const author = await prisma.author.findUnique({ where: { id: authorId } })
      if (!author) {
        return { success: false, error: 'Author not found', newReleases: [], updatedReleases: [] }
      }

      const browser = await this.initBrowser()
      page = await browser.newPage()

      // Set user agent and viewport
      await page.setExtraHTTPHeaders({
        'User-Agent': 'MyAudible-Scraper/1.0 (Book Release Tracker)'
      })
      await page.setViewportSize({ width: 1280, height: 720 })

      // Navigate to the website
      await page.goto(websiteUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })

      // Wait for content to load
      await page.waitForTimeout(3000)

      // Get page content
      const content = await page.content()
      const title = await page.title()

      // Also capture any dynamically loaded content
      const dynamicContent = await page.evaluate(() => {
        const elements = document.querySelectorAll([
          '[data-book]', '[data-release]', '[data-announcement]',
          '.book-item', '.release-item', '.announcement-item',
          '.js-book', '.js-release', '.js-content'
        ].join(', '))

        return Array.from(elements).map(el => ({
          text: el.textContent?.trim() || '',
          html: el.innerHTML,
          className: el.className,
          tagName: el.tagName
        }))
      })

      await page.close()
      page = null

      // Process the content using Cheerio
      const $ = cheerio.load(content)
      const bookRelatedContent: BookRelatedContent[] = []

      // Process both static and dynamic content
      const allContentSources = [
        { source: 'static', content: content },
        ...dynamicContent.map(dc => ({ source: 'dynamic', content: dc.html, text: dc.text }))
      ]

      for (const contentSource of allContentSources) {
        if (contentSource.source === 'static') {
          // Use the same logic as static scraping
          const staticResult = await this.scrapeStaticContent(authorId, websiteUrl)
          if (staticResult.success) {
            return staticResult // Return the static result if successful
          }
        } else {
          // Process dynamic content
          const text = ('text' in contentSource) ? contentSource.text || '' : ''
          if (text && this.isBookRelatedContent(text)) {
            const confidence = this.calculateContentConfidence(text, '')
            if (confidence >= 0.3) {
              bookRelatedContent.push({
                title: this.extractTitleFromText(text),
                description: text.length > 100 ? text.substring(0, 500) : text,
                url: websiteUrl,
                publishDate: this.extractDateFromText(text),
                confidence,
                selectors: ['dynamic-content']
              })
            }
          }
        }
      }

      // Process dynamic content results
      const uniqueContent = this.deduplicateContent(bookRelatedContent)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5)

      const newReleases: any[] = []
      const updatedReleases: any[] = []

      for (const content of uniqueContent) {
        if (content.confidence >= 0.6) { // Higher threshold for dynamic content
          const existingRelease = await prisma.authorRelease.findFirst({
            where: {
              authorId,
              title: content.title
            }
          })

          if (!existingRelease) {
            const newRelease = await prisma.authorRelease.create({
              data: {
                authorId,
                title: content.title,
                description: content.description,
                sourceUrl: content.url,
                expectedDate: content.publishDate,
                announcedDate: new Date(),
                releaseStatus: 'announced',
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
        scrapedData: {
          title,
          urls: [websiteUrl],
          content: uniqueContent
        }
      }
    } catch (error) {
      if (page) {
        try {
          await page.close()
        } catch (closeError) {
          console.warn('Error closing page:', closeError)
        }
      }
      
      console.error('Error scraping dynamic content:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        newReleases: [],
        updatedReleases: []
      }
    }
  }

  // Helper methods
  private extractTitleFromElement($el: any): string {
    // Try different title selectors
    const titleSelectors = ['h1', 'h2', 'h3', '.title', '.headline', '.book-title', '.entry-title']
    
    for (const selector of titleSelectors) {
      const title = $el.find(selector).first().text().trim()
      if (title) return title
    }
    
    // Fallback to element text (first 100 chars)
    const text = $el.text().trim()
    return text.length > 100 ? text.substring(0, 100) + '...' : text
  }

  private extractTitleFromText(text: string): string {
    // Extract first sentence or line that might be a title
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    const firstLine = lines[0] || text.substring(0, 100)
    
    // If it's too long, try to find a sentence
    if (firstLine.length > 100) {
      const sentences = firstLine.split(/[.!?]/)
      return sentences[0] + (sentences.length > 1 ? '...' : '')
    }
    
    return firstLine
  }

  private extractDescription($el: any, fullText: string): string | undefined {
    // Try to find a description paragraph
    const descSelectors = ['p', '.description', '.excerpt', '.summary', '.content']
    
    for (const selector of descSelectors) {
      const desc = $el.find(selector).first().text().trim()
      if (desc && desc.length > 50 && desc.length < 1000) {
        return desc
      }
    }
    
    // Fallback to full text if it's reasonable length
    if (fullText.length > 100 && fullText.length < 1000) {
      return fullText
    }
    
    return undefined
  }

  private extractLinkFromElement($el: any, baseUrl: string): string {
    const link = $el.find('a').first().attr('href') || $el.attr('href')
    if (link) {
      try {
        return new URL(link, baseUrl).toString()
      } catch {
        return baseUrl
      }
    }
    return baseUrl
  }

  private isBookRelatedContent(text: string): boolean {
    const lowerText = text.toLowerCase()
    const bookKeywords = [
      'book', 'novel', 'story', 'audiobook', 'kindle',
      'release', 'published', 'coming soon', 'preorder',
      'chapter', 'sequel', 'series', 'bestseller'
    ]
    
    return bookKeywords.some(keyword => lowerText.includes(keyword))
  }

  private calculateContentConfidence(text: string, title: string): number {
    const combinedText = `${title} ${text}`.toLowerCase()
    let confidence = 0

    // High confidence indicators
    const highConfidencePatterns = [
      /new book/i, /book release/i, /coming soon/i, /preorder/i,
      /available now/i, /just published/i, /audiobook/i
    ]

    for (const pattern of highConfidencePatterns) {
      if (pattern.test(combinedText)) confidence += 0.3
    }

    // Medium confidence indicators
    const mediumConfidenceWords = ['book', 'novel', 'story', 'chapter', 'series']
    for (const word of mediumConfidenceWords) {
      if (combinedText.includes(word)) confidence += 0.1
    }

    // Date patterns add confidence
    if (this.extractDateFromText(combinedText)) confidence += 0.2

    // Length penalties for very short or very long content
    if (text.length < 50) confidence -= 0.2
    if (text.length > 2000) confidence -= 0.1

    return Math.max(0, Math.min(1, confidence))
  }

  private extractDateFromText(text: string): Date | null {
    const datePatterns = [
      /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/,
      /\b(\d{4}-\d{2}-\d{2})\b/,
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i,
    ]

    for (const pattern of datePatterns) {
      const match = text.match(pattern)
      if (match) {
        try {
          const date = new Date(match[0])
          if (!isNaN(date.getTime()) && date > new Date('2020-01-01')) {
            return date
          }
        } catch {
          continue
        }
      }
    }

    return null
  }

  private cleanTitle(title: string): string {
    return title
      .replace(/^(new book:?|announcement:?|release:?)\s*/i, '')
      .replace(/\s*-\s*available\s+now$/i, '')
      .replace(/\s*\|\s*.*$/i, '')
      .trim()
  }

  private deduplicateContent(content: BookRelatedContent[]): BookRelatedContent[] {
    const seen = new Set<string>()
    return content.filter(item => {
      const key = item.title.toLowerCase().trim()
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }
}

export const websiteScraper = new WebsiteScraper()