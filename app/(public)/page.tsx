import { getDistrictsById } from '@/lib/data/districts'
import { getPlaces } from '@/lib/data/places'
import AccordionLocator from '@/components/public/AccordionLocator'
import type { POSEntry } from '@/lib/points'

// Fallback ceiling only. Primary freshness is driven by the "places" data
// cache tag (busted by revalidateTag('places') on every sales-point write),
// so an admin-created point appears here without waiting for this window.
export const revalidate = 60

export default async function HomePage() {
  let points: POSEntry[] = []

  try {
    const districtsById = await getDistrictsById()
    const docs = await getPlaces()

    points = docs.map((p) => {
      const s = p.socialLinks || {}
      const districtId = p.districtId?.toString() ?? ''
      return {
        _id: p._id.toString(),
        districtId,
        districtName: districtsById.get(districtId)?.name ?? 'مناطق أخرى',
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
