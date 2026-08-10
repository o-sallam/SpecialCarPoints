/*
 * lib/maps.ts — pure destination-link builders for the sales-point detail
 * sheet (feature 004). No imports, no side effects — the prime unit-test
 * candidate if an automated runner ever lands.
 *
 * Contract 4 (contracts/component-contracts.md):
 * - googleMapsLink: non-empty stored googleMapUrl verbatim; else coords-based;
 *   else null.
 * - directionsLink: universal Google Maps dir link from coordinates (Q2-A
 *   default) — no UA sniffing, no Apple Maps branching; else null.
 */

export interface MapsLinkSource {
  googleMapUrl: string
  lat: number | null
  lng: number | null
}

/** "فتح في خرائط Google" — stored link wins, coordinates fall back, else null. */
export function googleMapsLink(p: MapsLinkSource): string | null {
  if (p.googleMapUrl && p.googleMapUrl.trim().length > 0) return p.googleMapUrl
  if (p.lat != null && p.lng != null) return `https://www.google.com/maps?q=${p.lat},${p.lng}`
  return null
}

/** "الاتجاهات" — universal Google Maps directions link (Q2-A default). */
export function directionsLink(p: MapsLinkSource): string | null {
  if (p.lat != null && p.lng != null)
    return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`
  return null
}