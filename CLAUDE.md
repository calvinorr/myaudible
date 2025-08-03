# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Audible Clone** - a comprehensive personal audiobook library management application built with Next.js 14.2.15, React 18.3.1, TypeScript, and Tailwind CSS. The application manages real audiobook collections with enterprise-grade features including advanced analytics, interactive author management, comprehensive book tracking, series management, and dark/light theme support.

## Development Commands

```bash
# Start development server (uses Turbopack for faster builds)
npm run dev

# Build for production
npm run build

# Start production server  
npm start

# Run ESLint
npm run lint

# Database operations
npx prisma generate    # Generate Prisma client
npx prisma db push     # Push schema changes to database
npx tsx prisma/seed.ts # Seed database with sample data
```

## Current Architecture

### Technology Stack
- **Next.js 14.2.15** with App Router architecture and Turbopack for fast development
- **React 18.3.1** with client components and modern hooks patterns
- **TypeScript** for type safety and developer experience
- **Tailwind CSS v3.4** with dark mode support and custom Audible orange theme (`#f97316`)
- **Prisma ORM** with SQLite database for data persistence and type-safe queries
- **Next.js Image** optimization with remote patterns for multiple CDN domains
- **Theme System** with React Context providing dark/light/system preference detection

### Database Schema
- **Books** - Core audiobook data with metadata, progress, ratings, completion tracking
- **Authors** - Author information with relationships, favorite status, and scraping configuration (websiteUrl, rssUrl, socialUrls, lastScrapedAt)
- **FavoriteAuthors** - Junction table for user's favorite authors with timestamps
- **AuthorReleases** - Scraped upcoming releases with announcement dates, expected dates, and source URLs
- **Genres** - Category system with book relationships  
- **Narrators** - Narrator details and associations

### App Structure (Next.js App Router)
- **Homepage (`/`)**: Library grid with debounced search, advanced filtering, sorting controls, and pagination
- **Author Pages (`/authors/[id]`)**: Individual author profiles with book listings, statistics, and favoriting
- **Book Details (`/books/[id]`)**: Comprehensive book pages with progress tracking, rating, notes, and quick actions
- **Statistics (`/stats`)**: Multi-tab dashboard framework ready for analytics implementation
- **Series Management (`/series`)**: Placeholder page for series tracking features
- **Releases (`/releases`)**: Advanced release monitoring with web scraping, RSS parsing, and author website management
- **Recommendations (`/recommendations`)**: Placeholder page for book recommendations
- **Import (`/import`)**: Bulk CSV import with Audible Library Extractor format support
- **Add Book (`/add`)**: Placeholder page for manual book entry
- **API Routes**: Comprehensive REST API with filtering, sorting, author favoriting, and book management

### Implemented Features (Production Ready)
- **Search & Filtering**: Debounced search (500ms) with advanced filters (duration, year, series, narrator)
- **Advanced Sorting**: 6 sorting options (title, author, date, duration, rating, added) with visual indicators
- **Author Management**: Clickable author names, dedicated author pages, favoriting system with heart icons
- **Book Detail Pages**: Comprehensive pages with progress tracking, rating, personal notes, and quick actions
- **Interactive Elements**: AuthorQuickActions component, progress sliders, star ratings, completion toggles
- **Pagination System**: Load-more functionality handling 296+ books efficiently  
- **Modern UI Design**: Card-based layout with hover effects, gradients, and smooth animations
- **Dark/Light Theme**: System preference detection with persistent user choice
- **Progress Tracking**: Visual indicators, completion tracking, and reading streaks
- **Personal Ratings**: 1-5 star system with aggregated statistics
- **Data Import**: Audible Library Extractor CSV support with field mapping and duplicate prevention
- **Image Optimization**: Multi-domain CDN support (Amazon, Google Books, Open Library)
- **Web Scraping System**: Automated release monitoring with RSS feeds, website scraping, and intelligent content analysis
- **Author Website Management**: Configure and manage scraping sources for favorite authors with modal interface

### Current State (Enterprise-Grade Personal App)
- **Live Database**: 296+ real audiobooks with complete metadata, progress tracking, and favorite authors
- **Interactive Features**: Functional author pages, book detail pages, favoriting system, and comprehensive sorting
- **Performance**: Optimized pagination, debounced search, and image caching for large libraries
- **Theme System**: Full dark/light mode support with system preference integration
- **User Experience**: Production-ready interface with smooth interactions and visual feedback
- **Data Management**: Complete CRUD operations for books, authors, and user preferences
- **Release Monitoring**: Automated scraping system tracking upcoming books from favorite authors with 5-tab interface

### Styling & Design System
- **Theme System**: React Context-based theme provider with dark/light/system modes
- **Color Palette**: Custom Audible orange primary scale (50-900) with dark mode variants
- **Responsive Design**: Mobile-first grid layout (1-4 columns) with breakpoint optimization
- **Component Patterns**: Modern card design with gradients, hover effects, and smooth transitions
- **Typography**: Consistent heading hierarchy with improved contrast for accessibility
- **Interactive States**: Loading spinners, skeleton loaders, and comprehensive error boundaries

### Key Architecture Files
- **`app/layout.tsx`**: Root layout with ThemeProvider, navigation, and dark mode support
- **`contexts/ThemeContext.tsx`**: Theme management with localStorage persistence and system detection
- **`components/ThemeToggle.tsx`**: Dropdown theme selector with visual feedback
- **`components/AuthorQuickActions.tsx`**: Reusable heart icon component for author favoriting
- **`app/authors/[id]/page.tsx`**: Complete author profile pages with statistics and book listings
- **`app/books/[id]/page.tsx`**: Comprehensive book detail pages with full interaction capabilities
- **`app/releases/page.tsx`**: Advanced release monitoring interface with scraping sources management
- **`lib/scraping/`**: Complete web scraping system with RSS parsing, website scraping, and scheduling
- **`prisma/schema.prisma`**: Complete database schema with FavoriteAuthor and AuthorReleases models
- **`tailwind.config.js`**: Dark mode configuration with custom color system
- **`next.config.js`**: Image optimization for multiple CDN domains

### API Architecture
- **Books API (`/api/books`)**: Enhanced filtering with pagination, search, and sorting capabilities
- **Individual Book API (`/api/books/[id]`)**: GET and PATCH endpoints for detailed book management
- **Authors API (`/api/authors/[id]`)**: Author profiles with statistics and book listings
- **Author Favoriting API (`/api/authors/[id]/favorite`)**: Toggle favorite status for authors
- **Author Scraping Config API (`/api/authors/[id]/scraping-config`)**: Manage website URLs and scraping sources
- **Scraping Sources API (`/api/authors/scraping-sources`)**: Fetch favorite authors with their scraping configuration
- **Releases API (`/api/releases/upcoming`)**: Upcoming releases with filtering and status management
- **Scraping Status API (`/api/scrape/status`)**: Scraping statistics and bulk operations
- **Import API (`/api/import`)**: Audible CSV parsing with duplicate prevention
- **Statistics API (`/api/stats`)**: Basic statistics endpoint framework

## Critical Implementation Patterns

### Search & Performance Optimization
- **Debounced Search**: 500ms delay prevents excessive API calls on keystroke
- **Advanced Sorting**: 6 sorting options with visual indicators and intelligent defaults
- **Pagination Strategy**: Load-more pattern with 24 items per page for 296+ book performance
- **Advanced Filtering**: Duration ranges, release years, series, narrator filtering with smart query building
- **Image Optimization**: Next.js Image with remotePatterns for Amazon, Google Books CDNs

### Theme Implementation (Dark Mode)
- **Theme Context Pattern**: React Context with localStorage persistence and system preference detection
- **Tailwind Dark Mode**: Class-based approach with `dark:` variants throughout components
- **Component Consistency**: All UI elements support both light and dark themes seamlessly

### Author Management System
- **Interactive Elements**: Clickable author names throughout the application
- **Author Pages**: Comprehensive profiles with book statistics, completion rates, and favoriting
- **Quick Actions**: Heart icon components for immediate favoriting from any book card
- **Database Relationships**: FavoriteAuthor junction table with proper cascade deletion
- **Optimistic Updates**: Instant UI feedback with server synchronization

### Book Detail Architecture
- **Comprehensive Tracking**: Progress sliders, star ratings, personal notes, and completion status
- **Real-Time Updates**: PATCH API with optimistic UI updates for smooth user experience
- **Responsive Design**: Sticky sidebar layout with mobile-friendly interactions
- **Visual Feedback**: Loading states, status badges, and interactive transitions

### Series Support
- **Database Schema**: Series fields in book model (series, seriesOrder)
- **Import Mapping**: Audible CSV series data automatically parsed and stored
- **Future Implementation**: Framework ready for auto-detection and reading order tracking

### Web Scraping & Release Monitoring System
- **Multi-Strategy Scraping**: RSS feed parsing, static website scraping, and dynamic content handling
- **Intelligent Content Analysis**: Natural language processing to identify book announcements with confidence scoring
- **Automated Scheduling**: Cron job system for daily/weekly scraping with intelligent author prioritization
- **Rate Limiting & Ethics**: Respectful scraping with proper user agents, robots.txt compliance, and rate limiting
- **Duplicate Prevention**: Advanced duplicate detection preventing redundant release entries
- **Source Management**: Complete interface for managing author websites, RSS feeds, and social media sources
- **Real-time Status Tracking**: Live scraping status with last-scraped timestamps and health monitoring

## Development Approach & Code Quality

### Component Architecture
- **Modern React Patterns**: Hooks-based components with proper state management
- **TypeScript Integration**: Full type safety with interfaces for all data models
- **Error Boundaries**: Comprehensive error handling throughout the application
- **Loading States**: Skeleton loaders and spinners for optimal user experience

### Database & Performance
- **Prisma ORM**: Type-safe database queries with relationship management
- **SQLite Database**: Optimized for personal use with 296+ books performance
- **Query Optimization**: Efficient filtering, pagination, and aggregation queries
- **Image Caching**: Next.js Image optimization with multi-domain CDN support

### API Design Principles
- **RESTful Architecture**: Consistent endpoint naming and HTTP method usage
- **Error Handling**: Standardized error responses with proper HTTP status codes
- **Data Validation**: Input validation and sanitization on all endpoints
- **Response Consistency**: Uniform JSON response structure across all APIs

### Future Enhancement Areas
- **Author Search**: Autocomplete search functionality for quick author discovery
- **Advanced Scraping**: Social media API integration (Twitter, Facebook, Instagram) for enhanced release detection
- **Smart Notifications**: Email/push notifications for new releases from favorite authors
- **Database Optimization**: Add indexes and query caching for improved performance
- **Bulk Operations**: Multi-select functionality for batch editing and rating
- **PWA Features**: Offline support and mobile app-like experience
- **Advanced Import**: Support for additional audiobook platforms and formats
- **AI-Powered Analysis**: Machine learning for better release date prediction and content categorization