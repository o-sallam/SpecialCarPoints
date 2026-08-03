/*
 * lib/points.ts
 * Types + grouping + category config for the accordion POS locator.
 *
 * NOTE on categories: the reference design assumed service categories
 * (solar / wind / ev). This project (Special Car) has no service-type field,
 * so the only real categorical dimension is the VIP tier. CATEGORY_META is a
 * single config array — add real categories here later with one edit.
 */

import { detectRegion, type RegionId } from './geo'

/** A single point-of-sale entry, normalized for the UI. */
export interface POSEntry {
  _id: string
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
  id: Exclude<RegionId, 'all'>
  label: string
  entries: POSEntry[]
}

/** Keep only entries matching a category (VIP tier). */
export function filterByCategory(entries: POSEntry[], category: CategoryId): POSEntry[] {
  if (category === 'all') return entries
  if (category === 'vip') return entries.filter((e) => e.vip)
  return entries.filter((e) => !e.vip)
}

/**
 * Group entries by their derived Saudi region, drop empty regions, and sort
 * regions by entry count (desc) then label — so the busiest region leads.
 */
export function groupPointsByRegion(entries: POSEntry[]): Region[] {
  const buckets = new Map<Exclude<RegionId, 'all'>, POSEntry[]>()
  for (const e of entries) {
    const id = detectRegion(e.location || e.name || '')
    const arr = buckets.get(id) ?? []
    arr.push(e)
    buckets.set(id, arr)
  }
  return [...buckets.entries()]
    .map(([id, list]) => ({ id, label: regionTitle(id), entries: list }))
    .sort((a, b) => b.entries.length - a.entries.length || a.label.localeCompare(b.label, 'ar'))
}

function regionTitle(id: Exclude<RegionId, 'all'>): string {
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
