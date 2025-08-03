import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ImportBookData {
  title: string
  author: string
  narrator?: string
  genre?: string
  duration?: number
  rating?: number
  progress?: number
  completed?: boolean
  coverUrl?: string
  description?: string
  isbn?: string
  publisher?: string
  series?: string
  seriesOrder?: number
  personalNotes?: string
  tags?: string
  // Audible-specific fields
  asin?: string
  purchaseDate?: string
  downloadDate?: string
  audibleUrl?: string
  length?: string // "5h 30m" format
  releaseDate?: string
  language?: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { books, format } = body // books array and format type (csv, json, audible)

    if (!books || !Array.isArray(books)) {
      return NextResponse.json({ error: 'Invalid books data' }, { status: 400 })
    }

    const results = {
      imported: 0,
      updated: 0,
      errors: [] as string[],
      duplicates: 0
    }

    for (const bookData of books) {
      try {
        // Validate required fields
        if (!bookData.title || !bookData.author) {
          results.errors.push(`Skipped book: Missing title or author - ${JSON.stringify(bookData)}`)
          continue
        }

        // Check for existing book
        const existingBook = await prisma.book.findFirst({
          where: {
            title: bookData.title,
            author: {
              name: bookData.author
            }
          }
        })

        if (existingBook) {
          results.duplicates++
          continue
        }

        // Find or create author
        let author = await prisma.author.findUnique({
          where: { name: bookData.author }
        })
        if (!author) {
          author = await prisma.author.create({
            data: { name: bookData.author }
          })
        }

        // Find or create narrator if provided
        let narrator = null
        if (bookData.narrator && bookData.narrator.trim()) {
          narrator = await prisma.narrator.findUnique({
            where: { name: bookData.narrator }
          })
          if (!narrator) {
            narrator = await prisma.narrator.create({
              data: { name: bookData.narrator }
            })
          }
        }

        // Find or create genre if provided
        let genre = null
        if (bookData.genre && bookData.genre.trim()) {
          genre = await prisma.genre.findUnique({
            where: { name: bookData.genre }
          })
          if (!genre) {
            genre = await prisma.genre.create({
              data: { name: bookData.genre }
            })
          }
        }

        // Parse Audible duration format "5h 30m" to minutes
        let durationMinutes = bookData.duration || 0
        if (bookData.length && typeof bookData.length === 'string') {
          const lengthMatch = bookData.length.match(/(\d+)h?\s*(\d+)?m?/i)
          if (lengthMatch) {
            const hours = parseInt(lengthMatch[1]) || 0
            const minutes = parseInt(lengthMatch[2]) || 0
            durationMinutes = hours * 60 + minutes
          }
        }

        // Parse release date
        let releaseDate = null
        if (bookData.releaseDate) {
          try {
            releaseDate = new Date(bookData.releaseDate)
          } catch (e) {
            // Invalid date format, skip
          }
        }

        // Create book
        await prisma.book.create({
          data: {
            title: bookData.title,
            description: bookData.description || null,
            coverUrl: bookData.coverUrl || null,
            duration: durationMinutes,
            personalRating: bookData.rating || null,
            progress: bookData.progress || 0,
            isCompleted: bookData.completed || false,
            isbn: bookData.isbn || null,
            asin: bookData.asin || null,
            publisher: bookData.publisher || null,
            series: bookData.series || null,
            seriesOrder: bookData.seriesOrder || null,
            personalNotes: bookData.personalNotes || null,
            tags: bookData.tags || null,
            language: bookData.language || 'en',
            releaseDate: releaseDate,
            authorId: author.id,
            narratorId: narrator?.id || null,
            genreId: genre?.id || null,
            completedAt: bookData.completed ? new Date() : null
          }
        })

        results.imported++

      } catch (error) {
        console.error('Error importing book:', error)
        results.errors.push(`Failed to import: ${bookData.title} - ${error}`)
      }
    }

    return NextResponse.json({
      message: `Import completed. ${results.imported} books imported, ${results.duplicates} duplicates skipped.`,
      results
    })

  } catch (error) {
    console.error('Error in bulk import:', error)
    return NextResponse.json({ error: 'Failed to import books' }, { status: 500 })
  }
}

// Sample CSV parser helper
export async function GET() {
  // Return sample CSV format for users
  const sampleCsv = `title,author,narrator,genre,duration,rating,progress,completed,coverUrl,description,isbn,publisher,series,seriesOrder,personalNotes,tags
"Atomic Habits","James Clear","James Clear","Self-Help",330,4.8,100,true,"https://example.com/cover.jpg","Great book about habits","1234567890","Publisher","","","Loved this book","productivity,habits"
"Dune","Frank Herbert","Scott Brick","Science Fiction",1260,4.6,20,false,"","Classic sci-fi novel","0987654321","Publisher","Dune Chronicles",1,"","sci-fi,classic"`

  const sampleJson = [
    {
      title: "Atomic Habits",
      author: "James Clear",
      narrator: "James Clear",
      genre: "Self-Help",
      duration: 330,
      rating: 4.8,
      progress: 100,
      completed: true,
      coverUrl: "https://example.com/cover.jpg",
      description: "Great book about habits",
      isbn: "1234567890",
      publisher: "Publisher",
      series: "",
      seriesOrder: null,
      personalNotes: "Loved this book",
      tags: "productivity,habits"
    }
  ]

  return NextResponse.json({
    message: "Sample import formats",
    csvFormat: sampleCsv,
    jsonFormat: sampleJson,
    supportedFields: [
      "title (required)",
      "author (required)", 
      "narrator",
      "genre",
      "duration (minutes)",
      "rating (1-5)",
      "progress (0-100)",
      "completed (true/false)",
      "coverUrl",
      "description",
      "isbn",
      "publisher",
      "series",
      "seriesOrder",
      "personalNotes",
      "tags (comma-separated)"
    ]
  })
}