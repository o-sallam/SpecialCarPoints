/*
 * lib/geo.ts
 * Arabic text normalization + haversine distance. No network calls, fully
 * deterministic.
 *
 * Region/district keyword detection (detectRegion / REGIONS / REGION_KEYWORDS)
 * was removed when sales points gained an explicit cityId — region is no
 * longer guessed from free text. See scripts/migrate-cities-neighborhoods.ts.
 */

export interface LatLng {
  lat: number
  lng: number
}

/**
 * Strip tatweel + tashkeel and fold alef/ya variants so messy source data
 * ("مكـة المـكرمـة", "أبـها", "جـدة") collapses to a comparable form.
 */
export function normalizeArabic(input: string | null | undefined): string {
  if (!input) return ''
  return input
    .replace(/[\u0640]/g, '') // tatweel
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '') // tashkeel + superscript alef
    .replace(/[أإآٱ]/g, 'ا') // alef variants
    .replace(/ى/g, 'ي') // alef maqsura
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Great-circle distance in kilometres between two coordinates. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Format a km distance for display, e.g. 3.21 → "3.2 كم", 1204 → "١٫٢ ألف". */
export function formatDistance(km: number): string {
  if (km < 10) return `${km.toFixed(1)} كم`
  if (km < 100) return `${Math.round(km)} كم`
  return `${Math.round(km / 10) * 10} كم`
}
