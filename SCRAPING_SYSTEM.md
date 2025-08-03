# Author Website Scraping System

## Overview

This system automatically scrapes favorite authors' websites to discover upcoming book releases and announcements. It uses multiple strategies including RSS feeds, website content analysis, and social media monitoring to track new books before they appear on major platforms like Google Books.

## Features

### ✅ Implemented
- **Multi-source scraping**: RSS feeds, static websites, and dynamic content
- **Intelligent content analysis**: AI-powered detection of book-related announcements
- **Duplicate prevention**: Avoids creating duplicate releases
- **Rate limiting**: Respectful scraping with delays between requests
- **Automated scheduling**: Daily and weekly scraping with cron jobs
- **REST API**: Complete API for managing releases and scraping
- **User interface**: Dashboard for viewing upcoming releases
- **Legal compliance**: Respects robots.txt and terms of service

### 🔄 In Progress
- Social media integration (Twitter, Instagram, Facebook)
- Enhanced natural language processing for release date extraction
- Email notifications for new releases

## Architecture

### Core Components

1. **RSS Parser** (`lib/scraping/rss-parser.ts`)
   - Auto-detects RSS feeds from author websites
   - Parses feeds for book-related content
   - Extracts release dates and descriptions

2. **Website Scraper** (`lib/scraping/website-scraper.ts`)
   - Static content scraping with Cheerio
   - Dynamic content scraping with Playwright
   - Content analysis and confidence scoring

3. **Main Scraper** (`lib/scraping/scraper.ts`)
   - Orchestrates all scraping methods
   - Manages bulk operations
   - Handles error recovery and logging

4. **Scheduler** (`lib/scraping/scheduler.ts`)
   - Automated daily and weekly scraping
   - Intelligent author prioritization
   - Background job management

### Database Schema

```sql
-- Enhanced Author model
Author {
  websiteUrl     String?   -- Author's official website
  rssUrl         String?   -- RSS feed for announcements
  socialUrls     String?   -- JSON array of social media URLs
  lastScrapedAt  DateTime? -- Last scraping timestamp
}

-- Release tracking
AuthorRelease {
  title          String
  description    String?
  expectedDate   DateTime?
  announcedDate  DateTime
  publishedDate  DateTime?
  preorderUrl    String?
  releaseStatus  String    -- announced, preorder, published, delayed
  sourceUrl      String?   -- Where the announcement was found
  isInterested   Boolean   -- User interest flag
  isNotified     Boolean   -- Notification sent flag
}
```

## API Endpoints

### Release Management
- `GET /api/releases/upcoming` - Fetch upcoming releases
- `POST /api/releases/upcoming` - Create new release
- `GET /api/releases/[id]` - Get specific release
- `PATCH /api/releases/[id]` - Update release
- `DELETE /api/releases/[id]` - Delete release

### Author Scraping
- `POST /api/authors/[id]/scrape` - Manually scrape author
- `GET /api/authors/[id]/scrape` - Get scraping status
- `GET /api/authors/[id]/rss` - Detect RSS feeds
- `POST /api/authors/[id]/rss` - Manage RSS feeds

### Bulk Operations
- `GET /api/scrape/status` - Overall scraping status
- `POST /api/scrape/status` - Trigger bulk scraping
- `GET /api/scrape/scheduler` - Scheduler status
- `POST /api/scrape/scheduler` - Control scheduler

## Usage

### Manual Scraping

```javascript
// Scrape a single author
const response = await fetch('/api/authors/123/scrape', {
  method: 'POST'
})
const result = await response.json()

// Bulk scrape all favorites
const bulkResponse = await fetch('/api/scrape/status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'scrape_favorites' })
})
```

### RSS Feed Setup

```javascript
// Auto-detect and setup RSS feeds
const rssResponse = await fetch('/api/authors/123/rss', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'auto_setup' })
})

// Set specific RSS feed
const setFeedResponse = await fetch('/api/authors/123/rss', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    action: 'set_feed',
    rssUrl: 'https://author-website.com/rss'
  })
})
```

### Scheduler Control

```javascript
// Start automated scraping
const schedulerResponse = await fetch('/api/scrape/scheduler', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'start' })
})

// Manual scrape trigger
const manualResponse = await fetch('/api/scrape/scheduler', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    action: 'manual_scrape',
    scrapeType: 'daily'
  })
})
```

## Testing

Run the scraping system test:

```bash
npx tsx scripts/test-scraping.ts
```

This script will:
1. List favorite authors and their scraping sources
2. Test RSS feed detection
3. Perform a sample scrape
4. Show existing releases
5. Display overall system status

## Configuration

### Scheduler Settings

```javascript
const config = {
  dailyScrapeEnabled: true,        // Enable daily scraping
  weeklyScrapeEnabled: true,       // Enable weekly comprehensive scraping
  scrapingHours: [6, 14, 22],      // Hours to run daily scrapes (UTC)
  maxConcurrentScrapes: 3,         // Max parallel scraping operations
  respectRateLimits: true          // Honor rate limiting
}
```

### Content Detection

The system uses keyword analysis to identify book-related content:

- **High confidence**: "new book", "book release", "pre-order", "coming soon"
- **Medium confidence**: "book", "novel", "audiobook", "published"
- **Bonus factors**: Multiple book terms, date patterns, author context

## Legal & Ethical Compliance

### Implemented Safeguards
- **Robots.txt checking**: Automatic compliance with crawling restrictions
- **Rate limiting**: 2-5 second delays between requests
- **User-agent identification**: Clear identification as a book tracker
- **Respect for bandwidth**: Minimal resource usage
- **Terms of service awareness**: Manual review recommended

### Best Practices
1. Only scrape publicly available content
2. Respect website rate limits and server capacity
3. Use official RSS feeds when available
4. Avoid scraping copyrighted content
5. Monitor for blocking and adjust behavior

## Troubleshooting

### Common Issues

1. **No releases found**
   - Check if authors have scraping sources configured
   - Verify RSS feeds are valid
   - Ensure websites are accessible

2. **Rate limiting errors**
   - Reduce scraping frequency
   - Check if IP is blocked
   - Verify robots.txt compliance

3. **Invalid RSS feeds**
   - Use RSS detection API to find valid feeds
   - Check feed format and accessibility
   - Consider alternative scraping methods

### Monitoring

Check scraping health with:
```bash
curl http://localhost:3001/api/scrape/status
```

Monitor scheduler status:
```bash
curl http://localhost:3001/api/scrape/scheduler
```

## Future Enhancements

1. **Social Media Integration**
   - Twitter API for author tweets
   - Instagram post analysis
   - Facebook page monitoring

2. **Enhanced AI Analysis**
   - Better natural language processing
   - Genre and series detection
   - Cover image extraction

3. **Notification System**
   - Email alerts for new releases
   - Push notifications
   - Customizable notification preferences

4. **Performance Optimization**
   - Caching layer for frequent requests
   - Database indexing improvements
   - Batch processing optimization

## Dependencies

- `rss-parser`: RSS/Atom feed parsing
- `cheerio`: HTML parsing and manipulation
- `playwright`: Browser automation for dynamic content
- `node-cron`: Job scheduling
- `natural`: Natural language processing

## Installation

The scraping system is automatically included with the main application. Dependencies are installed with:

```bash
npm install
```

The scheduler starts automatically in production mode. In development, use the API endpoints to test functionality.

---

*This scraping system provides early detection of book releases while maintaining ethical web scraping practices and legal compliance.*