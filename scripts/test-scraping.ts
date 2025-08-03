#!/usr/bin/env npx tsx

/**
 * Test script for the author scraping system
 * 
 * Usage:
 *   npx tsx scripts/test-scraping.ts
 */

import '../lib/polyfills' // Import polyfills first
import { prisma } from '../lib/prisma'
import { authorScraper } from '../lib/scraping/scraper'
import { rssParser } from '../lib/scraping/rss-parser'

async function main() {
  console.log('🔍 Testing Author Scraping System\n')

  try {
    // 1. Get a sample of favorite authors
    console.log('1. Fetching favorite authors...')
    const favoriteAuthors = await prisma.author.findMany({
      where: {
        favoriteAuthors: {
          some: {}
        }
      },
      select: {
        id: true,
        name: true,
        websiteUrl: true,
        rssUrl: true,
        socialUrls: true,
        lastScrapedAt: true
      },
      take: 5
    })

    console.log(`   Found ${favoriteAuthors.length} favorite authors`)
    favoriteAuthors.forEach(author => {
      console.log(`   - ${author.name} (ID: ${author.id})`)
      console.log(`     Website: ${author.websiteUrl || 'None'}`)
      console.log(`     RSS: ${author.rssUrl || 'None'}`)
      console.log(`     Last scraped: ${author.lastScrapedAt ? author.lastScrapedAt.toISOString() : 'Never'}`)
    })

    if (favoriteAuthors.length === 0) {
      console.log('   No favorite authors found. Please add some favorite authors first.')
      return
    }

    // 2. Test RSS feed detection on first author with website
    const authorWithWebsite = favoriteAuthors.find(a => a.websiteUrl)
    if (authorWithWebsite) {
      console.log(`\n2. Testing RSS feed detection for ${authorWithWebsite.name}...`)
      try {
        const rssFeeds = await rssParser.detectRSSFeeds(authorWithWebsite.websiteUrl!)
        console.log(`   Detected ${rssFeeds.length} potential RSS feeds:`)
        rssFeeds.slice(0, 5).forEach(feed => console.log(`   - ${feed}`))

        // Validate first feed
        if (rssFeeds.length > 0) {
          console.log(`\n   Validating first feed: ${rssFeeds[0]}`)
          const validation = await rssParser.validateRSSFeed(rssFeeds[0])
          console.log(`   Valid: ${validation.isValid}`)
          if (validation.isValid) {
            console.log(`   Title: ${validation.title}`)
          } else {
            console.log(`   Error: ${validation.error}`)
          }
        }
      } catch (error) {
        console.log(`   RSS detection failed: ${error}`)
      }
    } else {
      console.log('\n2. No authors with websites found for RSS testing')
    }

    // 3. Test single author scraping
    const testAuthor = favoriteAuthors[0]
    console.log(`\n3. Testing scraper for ${testAuthor.name}...`)

    // Add a simple website URL if none exists (for testing)
    if (!testAuthor.websiteUrl && !testAuthor.rssUrl) {
      console.log('   No scraping sources configured. Adding example sources...')
      await prisma.author.update({
        where: { id: testAuthor.id },
        data: {
          websiteUrl: 'https://example.com', // This will fail gracefully
          rssUrl: null
        }
      })
    }

    const scrapeResult = await authorScraper.scrapeAuthor(testAuthor.id)
    console.log(`   Scrape result:`)
    console.log(`   - Success: ${scrapeResult.success}`)
    console.log(`   - New releases: ${scrapeResult.results.newReleases}`)
    console.log(`   - Updated releases: ${scrapeResult.results.updatedReleases}`)
    console.log(`   - Sources: Website=${scrapeResult.scrapingSources.website}, RSS=${scrapeResult.scrapingSources.rss}, Social=${scrapeResult.scrapingSources.social}`)
    
    if (scrapeResult.error) {
      console.log(`   - Error: ${scrapeResult.error}`)
    }

    // 4. Check existing releases
    console.log(`\n4. Checking existing releases...`)
    const existingReleases = await prisma.authorRelease.findMany({
      include: {
        author: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    console.log(`   Found ${existingReleases.length} existing releases:`)
    existingReleases.forEach(release => {
      console.log(`   - "${release.title}" by ${release.author.name}`)
      console.log(`     Status: ${release.releaseStatus}`)
      console.log(`     Expected: ${release.expectedDate ? release.expectedDate.toISOString().split('T')[0] : 'Unknown'}`)
      console.log(`     Source: ${release.sourceUrl || 'Unknown'}`)
    })

    // 5. Test scraping status
    console.log(`\n5. Overall scraping status...`)
    const totalFavoriteAuthors = await prisma.author.count({
      where: {
        favoriteAuthors: {
          some: {}
        }
      }
    })

    const authorsWithSources = await prisma.author.count({
      where: {
        favoriteAuthors: {
          some: {}
        },
        OR: [
          { websiteUrl: { not: null } },
          { rssUrl: { not: null } },
          { socialUrls: { not: null } }
        ]
      }
    })

    const totalReleases = await prisma.authorRelease.count()
    const recentReleases = await prisma.authorRelease.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    })

    console.log(`   Total favorite authors: ${totalFavoriteAuthors}`)
    console.log(`   Authors with scraping sources: ${authorsWithSources}`)
    console.log(`   Total releases tracked: ${totalReleases}`)
    console.log(`   Releases found this week: ${recentReleases}`)

    console.log(`\n✅ Scraping system test completed successfully!`)

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
main().catch(console.error)