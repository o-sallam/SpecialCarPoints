/*
 * lib/points.ts
 * Types + grouping + category config for the accordion POS locator.
 *
 * NOTE on categories: the reference design assumed service categories
 * (solar / wind / ev). This project (Special Car) has no service-type field,
 * so the only real categorical dimension is the VIP tier. CATEGORY_META is a
 * single config array — add real categories here later with one edit.
 */

import { REGIONS, type RegionId } from './geo'

/** A single point-of-sale entry, normalized for the UI. */
export interface POSEntry {
  _id: string
  /** reference to the `districts` collection document (hex ObjectId) */
  districtId: string
  /** resolved Arabic district label (denormalized for display) */
  districtName: string
  name: string
  location: string
  neighborhood: string | null
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

export interface Region {
  /** district ObjectId hex string — stable React key */
  id: string
  /** semantic region id, used only for the glyph icon; districts carry no
   * region id, so it is derived from the Arabic label via geo.ts's REGIONS */
  regionId: Exclude<RegionId, 'all'>
  label: string
  entries: POSEntry[]
}

/** Keep only entries matching a category (VIP tier). */
export function filterByCategory(entries: POSEntry[], category: CategoryId): POSEntry[] {
  if (category === 'all') return entries
  if (category === 'vip') return entries.filter((e) => e.vip)
  return entries.filter((e) => !e.vip)
}

/** Reverse lookup label → region id, used for the icon glyph only. */
const REGION_ID_BY_LABEL: Map<string, Exclude<RegionId, 'all'>> = new Map()
for (const r of REGIONS) REGION_ID_BY_LABEL.set(r.label, r.id)
REGION_ID_BY_LABEL.set('مناطق أخرى', 'other')

/**
 * Group entries by their stored district (bucket key = e.districtId, display
 * label = e.districtName), drop empty groups, and sort by entry count (desc)
 * then label — so the busiest district leads. No keyword detection here:
 * detectRegion() (lib/geo.ts) is only used by the migration script now.
 */
export function groupPointsByRegion(entries: POSEntry[]): Region[] {
  const buckets = new Map<string, POSEntry[]>()
  for (const e of entries) {
    const key = e.districtId || 'unknown'
    const arr = buckets.get(key) ?? []
    arr.push(e)
    buckets.set(key, arr)
  }
  return [...buckets.entries()]
    .map(([id, list]) => {
      const label = list[0]?.districtName || 'مناطق أخرى'
      return { id, regionId: REGION_ID_BY_LABEL.get(label) ?? 'other', label, entries: list }
    })
    .sort((a, b) => b.entries.length - a.entries.length || a.label.localeCompare(b.label, 'ar'))
}

/**
 * Arabic label for a region id — the single source of truth for district
 * names. The migration script copies these verbatim (never re-derived) so
 * district labels and region labels cannot drift apart.
 */
export function regionTitle(id: Exclude<RegionId, 'all'>): string {
  if (id === 'other') return 'مناطق أخرى'
  const map: Record<string, string> = {
    riyadh: 'منطقة الرياض',
    makkah: 'منطقة مكة المكرمة',
    madinah: 'منطقة المدينة المنورة',
    qassim: 'منطقة القصيم',
    eastern: 'المنطقة الشرقية',
    asir: 'منطقة عسير',
    tabuk: 'منطقة تبوك',
    hail: 'منطقة حائل',
    northern: 'الحدود الشمالية',
    jazan: 'منطقة جازان',
    najran: 'منطقة نجران',
    bahah: 'منطقة الباحة',
    jawf: 'منطقة الجوف',
  }
  return map[id] ?? 'مناطق أخرى'
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
