import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create genres
  const fiction = await prisma.genre.upsert({
    where: { name: 'Fiction' },
    update: {},
    create: {
      name: 'Fiction',
      description: 'Literary fiction and contemporary novels'
    }
  })

  const selfHelp = await prisma.genre.upsert({
    where: { name: 'Self-Help' },
    update: {},
    create: {
      name: 'Self-Help',
      description: 'Personal development and improvement books'
    }
  })

  const scienceFiction = await prisma.genre.upsert({
    where: { name: 'Science Fiction' },
    update: {},
    create: {
      name: 'Science Fiction',
      description: 'Science fiction and fantasy novels'
    }
  })

  const biography = await prisma.genre.upsert({
    where: { name: 'Biography' },
    update: {},
    create: {
      name: 'Biography',
      description: 'Memoirs and biographical accounts'
    }
  })

  // Create authors
  const taylorReid = await prisma.author.upsert({
    where: { name: 'Taylor Jenkins Reid' },
    update: {},
    create: {
      name: 'Taylor Jenkins Reid',
      bio: 'New York Times bestselling author known for contemporary fiction'
    }
  })

  const jamesClear = await prisma.author.upsert({
    where: { name: 'James Clear' },
    update: {},
    create: {
      name: 'James Clear',
      bio: 'Author and speaker focused on habits, decision making, and continuous improvement'
    }
  })

  const frankHerbert = await prisma.author.upsert({
    where: { name: 'Frank Herbert' },
    update: {},
    create: {
      name: 'Frank Herbert',
      bio: 'Science fiction author best known for the Dune series'
    }
  })

  const taraWestover = await prisma.author.upsert({
    where: { name: 'Tara Westover' },
    update: {},
    create: {
      name: 'Tara Westover',
      bio: 'American historian and author, known for her memoir Educated'
    }
  })

  // Create narrators
  const almaCuervo = await prisma.narrator.upsert({
    where: { name: 'Alma Cuervo' },
    update: {},
    create: {
      name: 'Alma Cuervo',
      bio: 'Professional audiobook narrator'
    }
  })

  const juliaWhelan = await prisma.narrator.upsert({
    where: { name: 'Julia Whelan' },
    update: {},
    create: {
      name: 'Julia Whelan',
      bio: 'Award-winning audiobook narrator and author'
    }
  })

  const robinMiles = await prisma.narrator.upsert({
    where: { name: 'Robin Miles' },
    update: {},
    create: {
      name: 'Robin Miles',
      bio: 'Audiobook narrator with extensive experience'
    }
  })

  const scottBrick = await prisma.narrator.upsert({
    where: { name: 'Scott Brick' },
    update: {},
    create: {
      name: 'Scott Brick',
      bio: 'Prolific audiobook narrator known for science fiction'
    }
  })

  // Create books with current sample data
  const book1 = await prisma.book.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'The Seven Husbands of Evelyn Hugo',
      coverUrl: 'https://images-na.ssl-images-amazon.com/images/P/1508234663.01.L.jpg',
      duration: 720, // 12 hours in minutes
      personalRating: 4.5,
      progress: 85,
      isCompleted: false,
      authorId: taylorReid.id,
      genreId: fiction.id,
      narratorId: almaCuervo.id
    }
  })

  const book2 = await prisma.book.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: 'Atomic Habits',
      subtitle: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones',
      coverUrl: 'https://images-na.ssl-images-amazon.com/images/P/0735211299.01.L.jpg',
      duration: 330, // 5.5 hours
      personalRating: 4.8,
      progress: 100,
      isCompleted: true,
      completedAt: new Date(),
      authorId: jamesClear.id,
      genreId: selfHelp.id,
      narratorId: jamesClear.id
    }
  })

  const book3 = await prisma.book.upsert({
    where: { id: 3 },
    update: {},
    create: {
      title: 'Dune',
      coverUrl: 'https://images-na.ssl-images-amazon.com/images/P/0593099322.01.L.jpg',
      duration: 1260, // 21 hours
      personalRating: 4.6,
      progress: 20,
      isCompleted: false,
      series: 'Dune Chronicles',
      seriesOrder: 1,
      authorId: frankHerbert.id,
      genreId: scienceFiction.id,
      narratorId: scottBrick.id
    }
  })

  const book4 = await prisma.book.upsert({
    where: { id: 4 },
    update: {},
    create: {
      title: 'Educated',
      subtitle: 'A Memoir',
      coverUrl: 'https://images-na.ssl-images-amazon.com/images/P/0399590501.01.L.jpg',
      duration: 720, // 12 hours
      personalRating: 4.7,
      progress: 0,
      isCompleted: false,
      authorId: taraWestover.id,
      genreId: biography.id,
      narratorId: juliaWhelan.id
    }
  })

  console.log('Database seeded successfully!')
  console.log({
    genres: [fiction, selfHelp, scienceFiction, biography],
    authors: [taylorReid, jamesClear, frankHerbert, taraWestover],
    books: [book1, book2, book3, book4]
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })