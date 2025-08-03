import * as cron from 'node-cron'
import { prisma } from '@/lib/prisma'
import { authorScraper } from './scraper'

interface SchedulerConfig {
  dailyScrapeEnabled: boolean
  weeklyScrapeEnabled: boolean
  scrapingHours: number[] // Hours of day to run scraping (0-23)
  maxConcurrentScrapes: number
  respectRateLimits: boolean
}

class ScrapingScheduler {
  private config: SchedulerConfig = {
    dailyScrapeEnabled: true,
    weeklyScrapeEnabled: true,
    scrapingHours: [6, 14, 22], // 6 AM, 2 PM, 10 PM
    maxConcurrentScrapes: 3,
    respectRateLimits: true
  }

  private isRunning = false
  private scheduledTasks: cron.ScheduledTask[] = []

  /**
   * Start the automated scraping scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.log('Scraping scheduler is already running')
      return
    }

    console.log('Starting scraping scheduler...')
    this.isRunning = true

    // Daily scraping for highly active/prolific authors
    if (this.config.dailyScrapeEnabled) {
      // Run every day at specified hours
      for (const hour of this.config.scrapingHours) {
        const task = cron.schedule(`0 ${hour} * * *`, async () => {
          console.log(`Running daily scrape at ${hour}:00`)
          await this.runDailyScrape()
        })
        
        this.scheduledTasks.push(task)
        task.start()
        console.log(`Scheduled daily scrape for ${hour}:00 UTC`)
      }
    }

    // Weekly deep scraping for all favorite authors
    if (this.config.weeklyScrapeEnabled) {
      // Run every Sunday at 3 AM UTC
      const weeklyTask = cron.schedule('0 3 * * 0', async () => {
        console.log('Running weekly comprehensive scrape')
        await this.runWeeklyScrape()
      })
      
      this.scheduledTasks.push(weeklyTask)
      weeklyTask.start()
      console.log('Scheduled weekly scrape for Sundays at 3:00 UTC')
    }

    // Cleanup old releases (monthly)
    const cleanupTask = cron.schedule('0 2 1 * *', async () => {
      console.log('Running monthly cleanup')
      await this.runMonthlyCleanup()
    })
    
    this.scheduledTasks.push(cleanupTask)
    cleanupTask.start()
    console.log('Scheduled monthly cleanup for 1st of each month at 2:00 UTC')

    console.log(`Scraping scheduler started with ${this.scheduledTasks.length} scheduled tasks`)
  }

  /**
   * Stop the automated scraping scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('Scraping scheduler is not running')
      return
    }

    console.log('Stopping scraping scheduler...')
    
    for (const task of this.scheduledTasks) {
      task.stop()
      task.destroy()
    }
    
    this.scheduledTasks = []
    this.isRunning = false
    
    console.log('Scraping scheduler stopped')
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; scheduledTasks: number; config: SchedulerConfig } {
    return {
      isRunning: this.isRunning,
      scheduledTasks: this.scheduledTasks.length,
      config: this.config
    }
  }

  /**
   * Update scheduler configuration
   */
  updateConfig(newConfig: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // If scheduler is running, restart it with new config
    if (this.isRunning) {
      this.stop()
      this.start()
    }
  }

  /**
   * Daily scraping - focus on prolific authors and recent favorites
   */
  private async runDailyScrape(): Promise<void> {
    try {
      // Get authors that should be scraped daily
      const authorsToScrape = await this.getAuthorsForDailyScrape()
      
      if (authorsToScrape.length === 0) {
        console.log('No authors need daily scraping')
        return
      }

      console.log(`Daily scrape: processing ${authorsToScrape.length} authors`)

      // Process authors in batches to respect rate limits
      const batchSize = this.config.maxConcurrentScrapes
      const batches = this.chunkArray(authorsToScrape, batchSize)

      let totalNewReleases = 0
      let totalUpdatedReleases = 0
      let successCount = 0

      for (const batch of batches) {
        const batchPromises = batch.map(author => 
          authorScraper.scrapeAuthor(author.id)
            .then(result => {
              if (result.success) {
                successCount++
                totalNewReleases += result.results.newReleases
                totalUpdatedReleases += result.results.updatedReleases
              }
              return result
            })
            .catch(error => {
              console.error(`Failed to scrape author ${author.id} (${author.name}):`, error)
              return null
            })
        )

        await Promise.all(batchPromises)

        // Rate limiting delay between batches
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 5000)) // 5 second delay
        }
      }

      console.log(`Daily scrape completed: ${successCount}/${authorsToScrape.length} authors, ${totalNewReleases} new releases, ${totalUpdatedReleases} updated`)

      // Log scraping activity
      await this.logScrapingActivity('daily', {
        authorsProcessed: authorsToScrape.length,
        successfulScrapes: successCount,
        newReleases: totalNewReleases,
        updatedReleases: totalUpdatedReleases
      })

    } catch (error) {
      console.error('Daily scrape failed:', error)
    }
  }

  /**
   * Weekly comprehensive scraping - all favorite authors
   */
  private async runWeeklyScrape(): Promise<void> {
    try {
      console.log('Starting weekly comprehensive scrape')
      
      const result = await authorScraper.scrapeFavoriteAuthors()
      
      console.log(`Weekly scrape completed: ${result.successfulScrapes}/${result.totalAuthors} authors, ${result.totalNewReleases} new releases, ${result.totalUpdatedReleases} updated`)

      // Log scraping activity
      await this.logScrapingActivity('weekly', {
        authorsProcessed: result.totalAuthors,
        successfulScrapes: result.successfulScrapes,
        newReleases: result.totalNewReleases,
        updatedReleases: result.totalUpdatedReleases
      })

    } catch (error) {
      console.error('Weekly scrape failed:', error)
    }
  }

  /**
   * Monthly cleanup - remove old/outdated releases
   */
  private async runMonthlyCleanup(): Promise<void> {
    try {
      console.log('Starting monthly cleanup')

      // Remove releases that are older than 1 year and still "announced"
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

      const outdatedReleases = await prisma.authorRelease.deleteMany({
        where: {
          announcedDate: { lt: oneYearAgo },
          releaseStatus: 'announced',
          publishedDate: null
        }
      })

      // Remove releases that were expected more than 6 months ago but never published
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const missedReleases = await prisma.authorRelease.deleteMany({
        where: {
          expectedDate: { lt: sixMonthsAgo },
          releaseStatus: { in: ['announced', 'preorder'] },
          publishedDate: null
        }
      })

      console.log(`Monthly cleanup completed: removed ${outdatedReleases.count} outdated releases, ${missedReleases.count} missed releases`)

      // Log cleanup activity
      await this.logScrapingActivity('cleanup', {
        outdatedRemoved: outdatedReleases.count,
        missedRemoved: missedReleases.count
      })

    } catch (error) {
      console.error('Monthly cleanup failed:', error)
    }
  }

  /**
   * Get authors that should be scraped daily
   */
  private async getAuthorsForDailyScrape(): Promise<{ id: number; name: string; lastScrapedAt?: Date | null }[]> {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Get favorite authors with scraping sources that haven't been scraped today
    const authors = await prisma.author.findMany({
      where: {
        favoriteAuthors: { some: {} },
        OR: [
          { websiteUrl: { not: null } },
          { rssUrl: { not: null } },
          { socialUrls: { not: null } }
        ],
        AND: [
          {
            OR: [
              { lastScrapedAt: null },
              { lastScrapedAt: { lt: oneDayAgo } }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        lastScrapedAt: true,
        authorReleases: {
          where: {
            createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } // Releases from last 30 days
          },
          take: 1
        }
      }
    })

    // Prioritize authors who have had recent releases or announcements
    return authors
      .sort((a, b) => {
        // Authors with recent releases first
        const aHasRecentRelease = a.authorReleases.length > 0
        const bHasRecentRelease = b.authorReleases.length > 0
        
        if (aHasRecentRelease && !bHasRecentRelease) return -1
        if (!aHasRecentRelease && bHasRecentRelease) return 1
        
        // Then by last scraped (least recently scraped first)
        const aLastScraped = a.lastScrapedAt?.getTime() || 0
        const bLastScraped = b.lastScrapedAt?.getTime() || 0
        
        return aLastScraped - bLastScraped
      })
      .slice(0, 20) // Limit to top 20 authors per day
  }

  /**
   * Log scraping activity for monitoring
   */
  private async logScrapingActivity(type: string, data: any): Promise<void> {
    try {
      console.log(`Scraping activity logged: ${type}`, data)
      // In a real application, you might want to store this in a dedicated logging table
      // For now, we'll just log to console
    } catch (error) {
      console.warn('Failed to log scraping activity:', error)
    }
  }

  /**
   * Utility function to chunk arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  /**
   * Manual trigger for testing
   */
  async runManualScrape(type: 'daily' | 'weekly' | 'cleanup'): Promise<void> {
    switch (type) {
      case 'daily':
        await this.runDailyScrape()
        break
      case 'weekly':
        await this.runWeeklyScrape()
        break
      case 'cleanup':
        await this.runMonthlyCleanup()
        break
    }
  }
}

// Export singleton instance
export const scrapingScheduler = new ScrapingScheduler()

// Auto-start scheduler in production
if (process.env.NODE_ENV === 'production') {
  scrapingScheduler.start()
  console.log('Scraping scheduler auto-started in production mode')
}