/*
 * lib/coordinates.ts
 * Single source of truth for coordinate rules & KSA-geography helpers, shared by
 * the client (form, picker) and the server (Zod validator, parser). See
 * specs/002-admin-coordinate-picker/research.md R5.
 */

export const LAT_RANGE = [-90, 90] as const
export const LNG_RANGE = [-180, 180] as const

/** Non-blocking "looks outside KSA" warning box (lat/lng approx. extents). */
export const KSA_BBOX = { lat: [16, 33], lng: [34, 56] } as const

/** Riyadh — the picker default center for a brand-new point (never (0,0)). */
export const KSA_DEFAULT_CENTER = { lat: 24.7136, lng: 46.6753 }

/** True when v is a finite number within [min, max]. */
export function isFiniteInRange(v: unknown, [min, max]: readonly number[]): boolean {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max
}

/**
 * Both-or-neither + range rule for a lat/lng pair:
 *  - (null, null)  ⇒ valid (a point may legitimately have no coordinates)
 *  - (lat, lng)    ⇒ valid only if both are finite and in range
 *  - half-filled   ⇒ invalid
 */
export function isCoordinatePairValid(lat: number | null, lng: number | null): boolean {
  if (lat == null && lng == null) return true
  if (lat == null || lng == null) return false
  return isFiniteInRange(lat, LAT_RANGE) && isFiniteInRange(lng, LNG_RANGE)
}

/**
 * Friendly, NON-blocking notice when a committed coordinate is far outside KSA.
 * Returns null when within the box (no warning needed).
 */
export function ksaWarning(lat: number, lng: number): string | null {
  const [minLat, maxLat] = KSA_BBOX.lat
  const [minLng, maxLng] = KSA_BBOX.lng
  if (lat < minLat || lat > maxLat || lng < minLng || lng > maxLng) {
    return 'هذا الموقع يبدو خارج المملكة العربية السعودية — تأكد من صحة الإحداثيات قبل الحفظ.'
  }
  return null
}