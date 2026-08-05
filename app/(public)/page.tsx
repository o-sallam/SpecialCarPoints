import { getPlaces } from '@/lib/data/places'
import { getCitiesById } from '@/lib/data/cities'
import { getNeighborhoodsById } from '@/lib/data/neighborhoods'
import AccordionLocator from '@/components/public/AccordionLocator'
import { composeDisplayName, type POSEntry } from '@/lib/points'

// Fallback ceiling only. Primary freshness is driven by the "places" data
// cache tag (busted by revalidateTag('places') on every sales-point write),
// so an admin-created point appears here without waiting for this window.
export const revalidate = 60

export default async function HomePage() {
  let points: POSEntry[] = []

  try {
    const [docs, citiesById, neighborhoodsById] = await Promise.all([
      getPlaces(),
      getCitiesById(),
      getNeighborhoodsById(),
    ])

    points = docs.map((p: any) => {
      const s = p.socialLinks || {}
      const cityName = (p.cityId && citiesById.get(String(p.cityId))?.name) || 'مدن أخرى'
      const neighborhoodName = p.neighborhoodId
        ? neighborhoodsById.get(String(p.neighborhoodId))?.name ?? null
        : null
      const extraLabel = p.extraLabel ?? null
      return {
        _id: p._id.toString(),
        cityId: p.cityId?.toString() ?? '',
        cityName,
        neighborhoodId: p.neighborhoodId ? String(p.neighborhoodId) : null,
        neighborhoodName,
        extraLabel,
        displayName: composeDisplayName(cityName, neighborhoodName, extraLabel),
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
