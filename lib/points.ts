/*
 * lib/points.ts
 * Types + grouping + category config + display-name composition for the POS
 * locator.
 *
 * Display strings are GENERATED here from city/neighborhood references and
 * never stored in the database. The literal "نقطة بيع" prefix lives only in
 * composeDisplayName() — it is UI copy, not data.
 */

/** A single point-of-sale entry, normalized for the UI. */
export interface POSEntry {
  _id: string
  cityId: string
  cityName: string
  /** city class (مدينة | محافظة | منطقة) — makes the composed name explicit */
  cityType: string
  neighborhoodId: string | null
  neighborhoodName: string | null
  extraLabel: string | null
  /** composed display name, e.g. "نقطة بيع مدينة الرياض حي السويدي" (UI-only) */
  displayName: string
  vip: boolean
  googleMapUrl: string
  lat: number | null
  lng: number | null
  /** free-form contact fields; empty string when absent */
  whatsapp?: string
  email?: string
  phone?: string
}

export type CategoryId = 'all' | 'vip' | 'standard'

export interface CategoryMeta {
  id: CategoryId
  label: string
  /** token/var or hex used for the chip dot + entry accent */
  color: string
}

export const CATEGORY_META: CategoryMeta[] = [
  { id: 'all', label: 'الكل', color: 'var(--color-primary)' },
  { id: 'vip', label: 'VIP', color: 'var(--color-accent-hover)' },
  { id: 'standard', label: 'عادي', color: 'var(--color-text-secondary)' },
]

/** A group of entries sharing one city (kept named `Region` to match the
 *  existing RegionGroup component; `id` is the city ObjectId hex string). */
export interface Region {
  /** city ObjectId hex string — stable React key */
  id: string
  /** city name, used as the accordion header label */
  label: string
  entries: POSEntry[]
}

/**
 * Compose the human-readable sales-point name. UI-only — never persisted.
 *   "نقطة بيع " + cityType + " " + city + (" حي " + neighborhood | " " + extraLabel | "")
 */
export function composeDisplayName(
  cityName: string,
  cityType: string,
  neighborhoodName: string | null,
  extraLabel: string | null,
): string {
  let s = 'نقطة بيع ' + cityType + ' ' + cityName
  if (neighborhoodName) s += ' حي ' + neighborhoodName
  else if (extraLabel) s += ' ' + extraLabel
  return s
}

/** Keep only entries matching a category (VIP tier). */
export function filterByCategory(entries: POSEntry[], category: CategoryId): POSEntry[] {
  if (category === 'all') return entries
  if (category === 'vip') return entries.filter((e) => e.vip)
  return entries.filter((e) => !e.vip)
}

/**
 * Group entries by city (bucket key = e.cityId, display label = e.cityName),
 * drop empty groups, sort by entry count desc then city name — busiest city
 * leads.
 */
export function groupByCity(entries: POSEntry[]): Region[] {
  const buckets = new Map<string, POSEntry[]>()
  for (const e of entries) {
    const key = e.cityId || 'unknown'
    const arr = buckets.get(key) ?? []
    arr.push(e)
    buckets.set(key, arr)
  }
  return [...buckets.entries()]
    .map(([id, list]) => ({
      id,
      label: list[0]?.cityName || 'مدن أخرى',
      entries: list,
    }))
    .sort((a, b) => b.entries.length - a.entries.length || a.label.localeCompare(b.label, 'ar'))
}

/** Build a wa.me deep link from a raw whatsapp value (number or URL). */
export function toWhatsAppLink(value: string): string {
  const digits = value.replace(/[^0-9]/g, '')
  return digits ? `https://wa.me/${digits}` : value
}

/** A value is callable if it contains at least 7 digits. */
export function isCallablePhone(value: string): boolean {
  return value.replace(/[^0-9]/g, '').length >= 7
}
