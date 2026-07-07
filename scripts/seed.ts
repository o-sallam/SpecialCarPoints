import { connectToDatabase } from '../lib/mongodb'
import { ensureSeeded } from '../lib/seed-data'

async function seed() {
  try {
    const { db } = await connectToDatabase()
    await db.collection('sales_points').deleteMany({})
    console.log('Cleared sales_points collection')
    await ensureSeeded(db)
    console.log('Seed completed successfully!')
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }
}

seed()
