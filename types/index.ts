export interface Author {
  id: number
  name: string
  bio?: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Narrator {
  id: number
  name: string
  bio?: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Genre {
  id: number
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Book {
  id: number
  title: string
  subtitle?: string
  description?: string
  coverUrl?: string
  duration: number
  releaseDate?: string
  isbn?: string
  asin?: string
  language?: string
  publisher?: string
  series?: string
  seriesOrder?: number
  personalRating?: number
  progress: number
  isCompleted: boolean
  isFavorite: boolean
  personalNotes?: string
  tags?: string
  createdAt: string
  updatedAt: string
  addedAt: string
  lastPlayedAt?: string
  completedAt?: string
  authorId: number
  genreId?: number
  narratorId?: number
  author: Author
  genre?: Genre
  narrator?: Narrator
}

export interface BookWithStats extends Book {
  _count?: {
    books: number
  }
}

export interface BooksResponse {
  books: Book[]
  totalCount: number
  hasMore: boolean
}