import { Db } from 'mongodb'
import fs from 'fs'
import path from 'path'

const dataJsonPath = path.join(process.cwd(), 'data.json')

interface DataJsonItem {
  url: string
  name: string
  description?: string
  location: string | null
  neighborhood: string | null
  type?: string
  id: string
  vip: boolean
  latitude?: number | null
  longitude?: number | null
}

function sanitizeString(input: string | null | undefined): string {
  if (!input) return ''
  return input.trim().replace(/<script[^>]*>.*?<\/script>/gi, '')
}

export async function ensureSeeded(db: Db) {
  const count = await db.collection('sales_points').countDocuments()
  if (count > 0) return

  console.log('Database empty — seeding initial data...')

  const content = fs.readFileSync(dataJsonPath, 'utf-8')
  const dataJson: DataJsonItem[] = JSON.parse(content)
  const now = new Date()

  const salesPoints = dataJson.map((item) => ({
    legacyId: item.id || null,
    name: sanitizeString(item.name),
    location: sanitizeString(item.location || ''),
    neighborhood: sanitizeString(item.neighborhood || ''),
    googleMapUrl: sanitizeString(item.url),
    vip: Boolean(item.vip),
    lat: item.latitude ?? null,
    lng: item.longitude ?? null,
    socialLinks: { x: '', facebook: '', whatsapp: '', linkedin: '', email: '', messenger: '', snapchat: '' },
    createdAt: now,
    updatedAt: now,
  }))

  await db.collection('sales_points').insertMany(salesPoints)
  console.log(`Inserted ${salesPoints.length} sales points`)

  await db.collection('settings').deleteOne({ _id: 'main' as any })
  await db.collection('settings').insertOne({
    _id: 'main' as any,
    storeName: 'Special Car',
    storeUrl: 'https://specialcarsa.com',
    storeDescription: 'Find Special Car sales points across Saudi Arabia',
  })
  console.log('Settings document created')
}
