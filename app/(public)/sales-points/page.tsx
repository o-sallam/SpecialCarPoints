import { Suspense } from 'react'
import SalesPointsClient from './SalesPointsClient'

export const revalidate = 60

export default async function SalesPointsPage() {
  let serialized: {
    _id: string; name: string; location: string; neighborhood: string | null
    vip: boolean; googleMapUrl: string; lat: number | null; lng: number | null
  }[] = []

  if (process.env.MONGODB_URI) {
    try {
      const { connectToDatabase } = await import('@/lib/mongodb')
      const { db } = await connectToDatabase()
      const points = await db
        .collection('sales_points')
        .find({}, {
          projection: {
            _id: 1,
            name: 1,
            location: 1,
            neighborhood: 1,
            vip: 1,
            googleMapUrl: 1,
            lat: 1,
            lng: 1,
          },
        })
        .sort({ name: 1 })
        .toArray()

      serialized = points.map((p) => ({
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
      // gracefully handle missing DB at build time
    }
  }

  return (
    <Suspense fallback={<div className="container py-8 text-center text-[var(--color-text-secondary)]">جاري التحميل...</div>}>
      <SalesPointsClient initialPoints={serialized} />
    </Suspense>
  )
}
