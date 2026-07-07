import { connectToDatabase } from '../lib/mongodb'
import { DataJsonItem, SalesPoint, Settings } from '../lib/types'
import fs from 'fs'
import path from 'path'

const dataJsonPath = path.join(process.cwd(), 'data.json')

function sanitizeString(input: string | null | undefined): string {
  if (!input) return ''
  return input.trim().replace(/<script[^>]*>.*?<\/script>/gi, '')
}

async function seed() {
  try {
    const { db } = await connectToDatabase()
    
    // Read data.json
    const dataJsonContent = fs.readFileSync(dataJsonPath, 'utf-8')
    const dataJson: DataJsonItem[] = JSON.parse(dataJsonContent)
    
    console.log(`Found ${dataJson.length} items in data.json`)
    
    // Clear existing sales_points collection
    await db.collection('sales_points').deleteMany({})
    console.log('Cleared sales_points collection')
    
    // Insert sales points with field mapping
    const now = new Date()
    const salesPoints: Omit<SalesPoint, '_id'>[] = dataJson.map((item) => ({
      legacyId: item.id || null,
      name: sanitizeString(item.name),
      location: sanitizeString(item.location || ''),
      neighborhood: sanitizeString(item.neighborhood || ''),
      googleMapUrl: sanitizeString(item.url),
      vip: Boolean(item.vip),
      lat: item.latitude ?? null,
      lng: item.longitude ?? null,
      socialLinks: {
        x: '',
        facebook: '',
        whatsapp: '',
        linkedin: '',
        email: '',
        messenger: '',
        snapchat: '',
      },
      createdAt: now,
      updatedAt: now,
    }))
    
    const result = await db.collection('sales_points').insertMany(salesPoints)
    console.log(`Inserted ${result.insertedCount} sales points`)
    
    // Seed settings document
    await db.collection('settings').deleteOne({ _id: 'main' as any })
    const settings = {
      _id: 'main',
      storeName: 'Special Car',
      storeUrl: 'https://specialcarsa.com',
      storeDescription: 'Find Special Car sales points across Saudi Arabia',
    }
    await db.collection('settings').insertOne(settings as any)
    console.log('Inserted settings document')
    
    console.log('Seed completed successfully!')
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }
}

seed()
