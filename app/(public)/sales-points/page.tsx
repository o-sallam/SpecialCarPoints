import { connectToDatabase } from '@/lib/mongodb'
import AccordionLocator from '@/components/public/AccordionLocator'
import type { POSEntry } from '@/lib/points'

export const revalidate = 60

export default async function SalesPointsPage() {
  let points: POSEntry[] = []

  try {
    const { db } = await connectToDatabase()
    const docs = await db
      .collection('sales_points')
      .find(
        {},
        {
          projection: {
            _id: 1,
            name: 1,
            location: 1,
            neighborhood: 1,
            vip: 1,
            googleMapUrl: 1,
            lat: 1,
            lng: 1,
            socialLinks: 1,
          },
        },
      )
      .sort({ name: 1 })
      .toArray()

    points = docs.map((p) => {
      const s = p.socialLinks || {}
      return {
        _id: p._id.toString(),
        name: p.name,
        location: p.location,
        neighborhood: p.neighborhood || null,
        vip: p.vip,
        googleMapUrl: p.googleMapUrl,
        lat: p.lat ?? null,
        lng: p.lng ?? null,
        whatsapp: s.whatsapp || '',
        email: s.email || '',
        phone: '', // not stored yet — wire a `phone` field to enable the call action
      }
    })
  } catch {
    // DB not available — render empty state
  }

  return <AccordionLocator points={points} />
}
