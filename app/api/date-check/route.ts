import { NextResponse } from 'next/server'

export async function GET() {
  const now = new Date()
  
  return NextResponse.json({
    serverDate: now.toISOString(),
    localDate: now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    }),
    timestamp: now.getTime(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate()
  })
}