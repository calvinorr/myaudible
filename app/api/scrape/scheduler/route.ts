import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Import scheduler (dynamic import to avoid loading issues)
    const { scrapingScheduler } = await import('@/lib/scraping/scheduler')
    
    const status = scrapingScheduler.getStatus()
    
    return NextResponse.json(status)
  } catch (error) {
    console.error('Error getting scheduler status:', error)
    return NextResponse.json(
      { error: 'Failed to get scheduler status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, config } = body

    // Import scheduler (dynamic import to avoid loading issues)
    const { scrapingScheduler } = await import('@/lib/scraping/scheduler')

    switch (action) {
      case 'start':
        scrapingScheduler.start()
        return NextResponse.json({ message: 'Scheduler started', status: scrapingScheduler.getStatus() })

      case 'stop':
        scrapingScheduler.stop()
        return NextResponse.json({ message: 'Scheduler stopped', status: scrapingScheduler.getStatus() })

      case 'restart':
        scrapingScheduler.stop()
        scrapingScheduler.start()
        return NextResponse.json({ message: 'Scheduler restarted', status: scrapingScheduler.getStatus() })

      case 'update_config':
        if (config) {
          scrapingScheduler.updateConfig(config)
          return NextResponse.json({ 
            message: 'Configuration updated', 
            status: scrapingScheduler.getStatus() 
          })
        } else {
          return NextResponse.json(
            { error: 'Configuration is required for update_config action' },
            { status: 400 }
          )
        }

      case 'manual_scrape':
        const { scrapeType } = body
        if (!scrapeType || !['daily', 'weekly', 'cleanup'].includes(scrapeType)) {
          return NextResponse.json(
            { error: 'Invalid scrape type. Must be daily, weekly, or cleanup' },
            { status: 400 }
          )
        }

        // Run manual scrape asynchronously
        scrapingScheduler.runManualScrape(scrapeType as 'daily' | 'weekly' | 'cleanup')
          .then(() => console.log(`Manual ${scrapeType} scrape completed`))
          .catch(error => console.error(`Manual ${scrapeType} scrape failed:`, error))

        return NextResponse.json({ 
          message: `Manual ${scrapeType} scrape triggered`,
          status: 'running'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be start, stop, restart, update_config, or manual_scrape' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error managing scheduler:', error)
    return NextResponse.json(
      { error: 'Failed to manage scheduler' },
      { status: 500 }
    )
  }
}