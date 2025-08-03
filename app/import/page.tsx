'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [importType, setImportType] = useState<'csv' | 'json'>('csv')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
  }

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const books = []

    // Check if this is an Audible Library Extractor CSV
    const isAudibleCSV = headers.includes('Title') && headers.includes('Authors') && headers.includes('ASIN')

    for (let i = 1; i < lines.length; i++) {
      const values = []
      let current = ''
      let inQuotes = false
      
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())

      if (values.length >= headers.length) {
        const book: any = {}
        headers.forEach((header, index) => {
          let value = values[index] || ''
          book[header] = value
        })

        if (isAudibleCSV) {
          // Map Audible CSV format to our format
          const mappedBook = mapAudibleBook(book)
          if (mappedBook.title && mappedBook.author) {
            books.push(mappedBook)
          }
        } else {
          // Handle standard CSV format
          headers.forEach((header, index) => {
            let value = values[index] || ''
            
            // Convert specific fields
            if (header === 'duration' || header === 'progress' || header === 'seriesOrder') {
              book[header] = value ? parseInt(value) : null
            } else if (header === 'rating') {
              book[header] = value ? parseFloat(value) : null
            } else if (header === 'completed') {
              book[header] = value.toLowerCase() === 'true'
            } else {
              book[header] = value || null
            }
          })
          
          if (book.title && book.author) {
            books.push(book)
          }
        }
      }
    }

    return books
  }

  const mapAudibleBook = (audibleBook: any) => {
    // Parse length "9h 37m " to minutes
    let duration = 0
    if (audibleBook.Length) {
      const lengthMatch = audibleBook.Length.match(/(\d+)h?\s*(\d+)?m?/i)
      if (lengthMatch) {
        const hours = parseInt(lengthMatch[1]) || 0
        const minutes = parseInt(lengthMatch[2]) || 0
        duration = hours * 60 + minutes
      }
    }

    // Extract primary genre from "Science Fiction & Fantasy > Science Fiction"
    let genre = ''
    if (audibleBook.Categories) {
      const parts = audibleBook.Categories.split('>')
      genre = parts[parts.length - 1]?.trim() || parts[0]?.trim() || ''
    }

    // Handle multiple authors (take first one)
    const author = audibleBook.Authors?.split(',')[0]?.trim() || ''
    
    // Handle multiple narrators (take first one)
    const narrator = audibleBook.Narrators?.split(',')[0]?.trim() || ''

    // Parse progress (if available)
    const progress = audibleBook.Progress === 'Finished' ? 100 : 0
    const completed = audibleBook.Progress === 'Finished'

    // Parse rating
    const rating = audibleBook.Rating ? parseFloat(audibleBook.Rating) : null

    // Parse release date
    let releaseDate = null
    if (audibleBook['Release Date']) {
      try {
        releaseDate = audibleBook['Release Date']
      } catch (e) {
        // Invalid date format
      }
    }

    return {
      title: audibleBook.Title || '',
      author: author,
      narrator: narrator,
      genre: genre,
      duration: duration,
      rating: rating,
      progress: progress,
      completed: completed,
      coverUrl: audibleBook.Cover || '',
      description: audibleBook.Blurb || '',
      isbn: audibleBook.ISBN13 || audibleBook.ISBN10 || '',
      asin: audibleBook.ASIN || '',
      publisher: audibleBook.Publishers || '',
      series: audibleBook.Series || '',
      seriesOrder: audibleBook['Book Numbers'] ? parseInt(audibleBook['Book Numbers']) : null,
      language: audibleBook.Language || 'English',
      releaseDate: releaseDate,
      personalNotes: `Imported from Audible Library - Added: ${audibleBook.Added || 'Unknown'}`,
      tags: audibleBook.Tags || ''
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setError(null)
    setResults(null)

    try {
      const text = await file.text()
      let books = []

      if (importType === 'csv') {
        books = parseCSV(text)
      } else {
        books = JSON.parse(text)
      }

      if (!Array.isArray(books) || books.length === 0) {
        throw new Error('No valid books found in file')
      }

      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ books, format: importType }),
      })

      if (!response.ok) {
        throw new Error('Import failed')
      }

      const result = await response.json()
      setResults(result)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const downloadSampleCSV = () => {
    const sampleCsv = `title,author,narrator,genre,duration,rating,progress,completed,coverUrl,description,isbn,publisher,series,seriesOrder,personalNotes,tags
"Atomic Habits","James Clear","James Clear","Self-Help",330,4.8,100,true,"https://images-na.ssl-images-amazon.com/images/P/0735211299.01.L.jpg","An Easy & Proven Way to Build Good Habits & Break Bad Ones","","","","","Excellent book on habit formation","productivity,habits,self-improvement"
"Dune","Frank Herbert","Scott Brick","Science Fiction",1260,4.6,20,false,"https://images-na.ssl-images-amazon.com/images/P/0593099322.01.L.jpg","Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides","","","Dune Chronicles",1,"Epic science fiction classic","sci-fi,classic,space-opera"`

    const blob = new Blob([sampleCsv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-books.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const downloadSampleJSON = () => {
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
        coverUrl: "https://images-na.ssl-images-amazon.com/images/P/0735211299.01.L.jpg",
        description: "An Easy & Proven Way to Build Good Habits & Break Bad Ones",
        isbn: "",
        publisher: "",
        series: "",
        seriesOrder: null,
        personalNotes: "Excellent book on habit formation",
        tags: "productivity,habits,self-improvement"
      },
      {
        title: "Dune",
        author: "Frank Herbert",
        narrator: "Scott Brick",
        genre: "Science Fiction",
        duration: 1260,
        rating: 4.6,
        progress: 20,
        completed: false,
        coverUrl: "https://images-na.ssl-images-amazon.com/images/P/0593099322.01.L.jpg",
        description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides",
        isbn: "",
        publisher: "",
        series: "Dune Chronicles",
        seriesOrder: 1,
        personalNotes: "Epic science fiction classic",
        tags: "sci-fi,classic,space-opera"
      }
    ]

    const blob = new Blob([JSON.stringify(sampleJson, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-books.json'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Import Books</h1>
        <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
          ← Back to Library
        </Link>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">How to Import Your Books</h2>
        <div className="space-y-2 text-blue-800 dark:text-blue-200">
          <p>• <strong>From Audible:</strong> Use the Audible Library Extractor browser extension to export your library as CSV</p>
          <p>• <strong>From other apps:</strong> Export your audiobook data in CSV or JSON format</p>
          <p>• Upload the file and we&apos;ll import your entire library automatically</p>
          <p>• Duplicate books (same title + author) will be automatically skipped</p>
          <p>• Supports Audible-specific fields like ASIN, length format &ldquo;5h 30m&rdquo;, and purchase dates</p>
        </div>
      </div>

      {/* Audible-Specific Instructions */}
      <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-3">📚 Import from Audible</h2>
        <div className="space-y-3 text-orange-800 dark:text-orange-200">
          <div className="flex items-start space-x-3">
            <span className="bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-100 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
            <div>
              <p className="font-medium">Install Audible Library Extractor</p>
              <p className="text-sm">Available for Chrome, Firefox, Edge, Opera, and Brave browsers</p>
              <a 
                href="https://chromewebstore.google.com/detail/audible-library-extractor/deifcolkciolkllaikijldnjeloeaall" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 underline text-sm"
              >
                Get Chrome Extension →
              </a>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-100 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
            <div>
              <p className="font-medium">Go to Your Audible Library</p>
              <p className="text-sm">Visit audible.com/lib and click the &ldquo;Audible Library Extractor&rdquo; button</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-100 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
            <div>
              <p className="font-medium">Export to CSV</p>
              <p className="text-sm">Wait 5-15 minutes for extraction, then export as CSV using the extension</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-100 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
            <div>
              <p className="font-medium">Upload Here</p>
              <p className="text-sm">Use the CSV upload below to import your entire Audible library</p>
            </div>
          </div>
        </div>
      </div>

      {/* File Format Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Import Format</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setImportType('csv')}
            className={`p-4 border-2 rounded-lg transition-colors ${
              importType === 'csv' 
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <div className="text-left">
              <h3 className="font-semibold">CSV Format</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Comma-separated values, works with Excel</p>
            </div>
          </button>

          <button
            onClick={() => setImportType('json')}
            className={`p-4 border-2 rounded-lg transition-colors ${
              importType === 'json' 
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <div className="text-left">
              <h3 className="font-semibold">JSON Format</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">JavaScript Object Notation, for developers</p>
            </div>
          </button>
        </div>

        {/* Sample Files */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={importType === 'csv' ? downloadSampleCSV : downloadSampleJSON}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Download Sample {importType.toUpperCase()}
          </button>
        </div>

        {/* File Upload */}
        <div className="space-y-4">
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload Your {importType.toUpperCase()} File
            </label>
            <input
              type="file"
              id="file"
              accept={importType === 'csv' ? '.csv' : '.json'}
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-lg file:border-0
                         file:text-sm file:font-medium
                         file:bg-primary-50 dark:file:bg-primary-900/30 file:text-primary-700 dark:file:text-primary-300
                         hover:file:bg-primary-100 dark:hover:file:bg-primary-900/50"
            />
          </div>

          {file && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {importing ? 'Importing...' : 'Import Books'}
          </button>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">Import Results</h2>
          <div className="space-y-2 text-green-800 dark:text-green-200">
            <p>✅ {results.results.imported} books imported successfully</p>
            {results.results.duplicates > 0 && (
              <p>⚠️ {results.results.duplicates} duplicates skipped</p>
            )}
            {results.results.errors.length > 0 && (
              <div>
                <p className="text-red-800 dark:text-red-200">❌ {results.results.errors.length} errors occurred:</p>
                <ul className="list-disc list-inside ml-4 text-sm">
                  {results.results.errors.slice(0, 5).map((error: string, index: number) => (
                    <li key={index} className="text-red-700 dark:text-red-300">{error}</li>
                  ))}
                  {results.results.errors.length > 5 && (
                    <li className="text-red-700 dark:text-red-300">...and {results.results.errors.length - 5} more errors</li>
                  )}
                </ul>
              </div>
            )}
          </div>
          <div className="mt-4">
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              View Your Library
            </Link>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Supported Fields */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Supported Fields</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Required Fields</h3>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• title</li>
              <li>• author</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Optional Fields</h3>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• narrator</li>
              <li>• genre</li>
              <li>• duration (minutes)</li>
              <li>• rating (1-5)</li>
              <li>• progress (0-100)</li>
              <li>• completed (true/false)</li>
              <li>• coverUrl</li>
              <li>• description</li>
              <li>• isbn</li>
              <li>• publisher</li>
              <li>• series</li>
              <li>• seriesOrder</li>
              <li>• personalNotes</li>
              <li>• tags (comma-separated)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}