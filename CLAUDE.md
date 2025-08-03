# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Audible Clone** - a comprehensive personal audiobook library management application built with Next.js 14.2.15, React 18.3.1, TypeScript, and Tailwind CSS. The application manages real audiobook collections with features including advanced search & filtering, progress tracking, series management, data import capabilities, and dark/light theme support.

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
- **Books** - Core audiobook data with metadata, progress, ratings
- **Authors** - Author information with relationships
- **Genres** - Category system with book relationships  
- **Narrators** - Narrator details and associations

### App Structure (Next.js App Router)
- **Homepage (`/`)**: Library grid with debounced search, advanced filtering, and pagination
- **Statistics (`/stats`)**: Multi-tab dashboard framework ready for analytics implementation
- **Series Management (`/series`)**: Placeholder page for series tracking features
- **New Releases (`/new-releases`)**: Placeholder page for release monitoring
- **Recommendations (`/recommendations`)**: Placeholder page for book recommendations
- **Import (`/import`)**: Bulk CSV import with Audible Library Extractor format support
- **Add Book (`/add`)**: Placeholder page for manual book entry
- **Book Details (`/books/[id]`)**: Individual book pages with progress tracking and metadata
- **API Routes**: Comprehensive REST API with advanced filtering, analytics, and batch operations

### Implemented Features
- **Search & Filtering**: Debounced search (500ms) with advanced filters (duration, year, series, narrator)
- **Pagination System**: Load-more functionality handling 296+ books efficiently  
- **Modern UI Design**: Card-based layout with hover effects, gradients, and smooth animations
- **Dark/Light Theme**: System preference detection with persistent user choice
- **Progress Tracking**: Visual indicators, completion tracking, and reading streaks
- **Personal Ratings**: 1-5 star system with aggregated statistics
- **Data Import**: Audible Library Extractor CSV support with field mapping and duplicate prevention
- **Image Optimization**: Multi-domain CDN support (Amazon, Google Books, Open Library)
- **Placeholder Framework**: Ready structure for analytics, recommendations, and additional features

### Current State
- **Live Database**: Real audiobooks with complete metadata and reading progress
- **Performance**: Optimized pagination, debounced search, and image caching for large libraries
- **Theme System**: Full dark/light mode support with system preference integration
- **Import Ready**: Tested with 296+ book imports from Audible Library Extractor
- **Foundation Built**: Solid architecture ready for additional feature development

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
- **`prisma/schema.prisma`**: Complete database schema with relationships and indexing
- **`tailwind.config.js`**: Dark mode configuration with custom color system
- **`next.config.js`**: Image optimization for multiple CDN domains

### API Architecture
- **Books API (`/api/books`)**: Enhanced filtering with pagination and search
- **Import API (`/api/import`)**: Audible CSV parsing with duplicate prevention
- **Statistics API (`/api/stats`)**: Basic statistics endpoint framework
- **Placeholder APIs**: Ready structure for analytics, series, and other features

## Critical Implementation Patterns

### Search & Performance Optimization
- **Debounced Search**: 500ms delay prevents excessive API calls on keystroke
- **Pagination Strategy**: Load-more pattern with 24 items per page for 296+ book performance
- **Advanced Filtering**: Duration ranges, release years, series, narrator filtering with smart query building
- **Image Optimization**: Next.js Image with remotePatterns for Amazon, Google Books CDNs

### Theme Implementation (Dark Mode)
- **Theme Context Pattern**: React Context with localStorage persistence and system preference detection
- **Tailwind Dark Mode**: Class-based approach with `dark:` variants throughout components
- **Component Consistency**: All UI elements support both light and dark themes seamlessly

### Statistics Framework
- **Multi-Tab Interface**: 5-tab structure ready for analytics implementation
- **Database Foundation**: Prisma schema supports comprehensive statistics queries
- **Real-Time Potential**: Database aggregations ready for genre insights, reading velocity, completion rates
- **Visualization Ready**: Framework for progress bars, charts, and trend indicators

### Series Support
- **Database Schema**: Series fields in book model (series, seriesOrder)
- **Import Mapping**: Audible CSV series data automatically parsed and stored
- **Future Implementation**: Framework ready for auto-detection and reading order tracking

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
- **Database Optimization**: Add indexes and query caching for improved performance
- **Bulk Operations**: Multi-select functionality for batch editing and rating
- **PWA Features**: Offline support and mobile app-like experience
- **Advanced Import**: Support for additional audiobook platforms and formats