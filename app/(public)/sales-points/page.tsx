import { connectToDatabase } from '@/lib/mongodb'
import SalesPointCard from '@/components/public/SalesPointCard'
import SalesPointsInteractive from './SalesPointsInteractive'

export const revalidate = 60

export default async function SalesPointsPage() {
  let points: {
    _id: string
    name: string
    location: string
    neighborhood: string | null
    vip: boolean
    googleMapUrl: string
    lat: number | null
    lng: number | null
  }[] = []

  try {
    const { db } = await connectToDatabase()
    const docs = await db
      .collection('sales_points')
      .find({}, {
        projection: {
          _id: 1, name: 1, location: 1, neighborhood: 1,
          vip: 1, googleMapUrl: 1, lat: 1, lng: 1,
        },
      })
      .sort({ name: 1 })
      .toArray()

    points = docs.map((p) => ({
      _id: p._id.toString(),
      name: p.name,
      location: p.location,
      neighborhood: p.neighborhood || null,
      vip: p.vip,
      googleMapUrl: p.googleMapUrl,
      lat: p.lat ?? null,
      lng: p.lng ?? null,
    }))
  } catch {
    // DB not available
  }

  return <SalesPointsInteractive points={points} />
}
