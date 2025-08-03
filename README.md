# 📚 Audible Clone - Personal Audiobook Library Manager

A comprehensive personal audiobook library management application built with Next.js 14, React 18, TypeScript, and Tailwind CSS. Features advanced search & filtering, progress tracking, series management, data import capabilities, and dark/light theme support.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.2.15-black)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)

## ✨ Features

### 🎯 Core Functionality
- **Smart Library Management**: Import from Audible Library Extractor CSV with duplicate prevention
- **Advanced Search & Filtering**: Debounced search with filters for duration, year, series, narrator
- **Progress Tracking**: Visual progress indicators, completion tracking, and reading streaks
- **Personal Ratings**: 1-5 star rating system with aggregated statistics
- **Series Management**: Auto-detection, reading order tracking, completion status

### 📊 Analytics & Insights
- **5-Tab Analytics Dashboard**: Overview, trends, genres, authors, velocity tracking
- **Reading Trends**: Monthly activity charts and completion patterns
- **Genre Analysis**: Distribution insights with completion rates and ratings
- **Author Statistics**: Most-read authors with completion rates and favorite series
- **Reading Velocity**: Track books completed across different time periods

### 🎨 Modern UI/UX
- **Dark/Light Theme**: System preference detection with persistent user choice
- **Responsive Design**: Mobile-first grid layout (1-4 columns)
- **Modern Card Design**: Hover effects, gradients, and smooth animations
- **Interactive States**: Loading spinners, skeleton loaders, error boundaries

### 🚀 Advanced Features
- **Data Import**: Bulk import from Audible Library Extractor CSV with field mapping and duplicate prevention
- **Pagination System**: Efficient handling of large libraries (296+ books tested)
- **Image Optimization**: Multi-domain CDN support (Amazon, Google Books, Open Library)
- **Placeholder Pages**: Ready framework for new releases, recommendations, and more features

## 🛠️ Technology Stack

- **Framework**: Next.js 14.2.15 with App Router and Turbopack
- **Frontend**: React 18.3.1 with modern hooks patterns
- **Language**: TypeScript for full type safety
- **Styling**: Tailwind CSS v3.4 with dark mode support
- **Database**: Prisma ORM with SQLite
- **Images**: Next.js Image optimization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd MyAudible
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Seed the database (optional)**
   ```bash
   npx tsx prisma/seed.ts
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Import Your Audiobook Library
1. Use the [Audible Library Extractor](https://chrome.google.com/webstore) browser extension
2. Export your library as CSV
3. Navigate to `/import` and upload your CSV file
4. The system will automatically parse and import your books with duplicate prevention

### Explore Your Library
- **Homepage**: Browse your collection with advanced search and filtering
- **Statistics**: View placeholder analytics dashboard (ready for implementation)
- **Series**: Manage book series with auto-detection and reading order
- **Add Books**: Manually add individual books to your library
- **Import**: Bulk import from CSV files with comprehensive field mapping

## 🎨 Theme System

The application includes a comprehensive theme system:
- **Light Mode**: Clean, bright interface
- **Dark Mode**: Easy on the eyes for night reading
- **System Mode**: Automatically follows your OS preference
- **Persistent**: Remembers your choice across browser sessions

## 📊 Statistics Dashboard

The statistics page provides a framework for analytics with:
- **Overview Tab**: Ready for library composition and key metrics
- **Trends Tab**: Placeholder for reading activity over time
- **Genres Tab**: Framework for distribution analysis
- **Authors Tab**: Structure for author statistics
- **Velocity Tab**: Template for reading speed tracking

## 🏗️ Architecture

The application follows modern Next.js patterns:
- **App Router**: File-based routing with layouts
- **Server Components**: Optimal performance with RSC
- **API Routes**: RESTful API endpoints
- **Type Safety**: Full TypeScript coverage
- **Theme Context**: React Context for theme management
- **Database Relations**: Proper foreign key relationships

## 🔧 Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Database Operations
```bash
npx prisma generate    # Generate Prisma client
npx prisma db push     # Push schema changes
npx tsx prisma/seed.ts # Seed with sample data
```

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (pages)/          # App pages
│   └── layout.tsx        # Root layout
├── components/           # Reusable components
├── contexts/            # React contexts
├── lib/                # Utilities and configs
├── prisma/            # Database schema and migrations
├── types/            # TypeScript type definitions
└── public/          # Static assets
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Database powered by [Prisma](https://prisma.io/)
- Icons from [Heroicons](https://heroicons.com/)
- Inspired by Audible's interface and functionality

---

**⭐ If you find this project helpful, please consider giving it a star!**