/*
 * lib/geo.ts
 * Arabic text normalization + Saudi administrative-region detection,
 * plus haversine distance. Powers the locator's category (region) filter
 * and "nearest to you" sorting. No network calls, fully deterministic.
 */

export interface LatLng {
  lat: number
  lng: number
}

export type RegionId =
  | 'all'
  | 'riyadh'
  | 'makkah'
  | 'madinah'
  | 'qassim'
  | 'eastern'
  | 'asir'
  | 'tabuk'
  | 'hail'
  | 'northern'
  | 'jazan'
  | 'najran'
  | 'bahah'
  | 'jawf'
  | 'other'

export interface RegionMeta {
  /** every concrete region in the catalog (never 'all'/'other') */
  id: Exclude<RegionId, 'all' | 'other'>
  label: string
  /** token-referenced hex used for badges / markers */
  color: string
}

/**
 * Saudi administrative regions, ordered roughly by population.
 * `color` mirrors the accent/primary token hues for visual coherence.
 */
export const REGIONS: RegionMeta[] = [
  { id: 'riyadh', label: 'منطقة الرياض', color: '#2563eb' },
  { id: 'makkah', label: 'منطقة مكة المكرمة', color: '#0ea5e9' },
  { id: 'eastern', label: 'المنطقة الشرقية', color: '#14b8a6' },
  { id: 'madinah', label: 'منطقة المدينة المنورة', color: '#6366f1' },
  { id: 'qassim', label: 'منطقة القصيم', color: '#8b5cf6' },
  { id: 'asir', label: 'منطقة عسير', color: '#22c55e' },
  { id: 'jazan', label: 'منطقة جازان', color: '#eab308' },
  { id: 'tabuk', label: 'منطقة تبوك', color: '#f97316' },
  { id: 'hail', label: 'منطقة حائل', color: '#ec4899' },
  { id: 'northern', label: 'الحدود الشمالية', color: '#ef4444' },
  { id: 'bahah', label: 'منطقة الباحة', color: '#10b981' },
  { id: 'najran', label: 'منطقة نجران', color: '#a855f7' },
  { id: 'jawf', label: 'منطقة الجوف', color: '#0891b2' },
]

export const REGION_BY_ID: Record<Exclude<RegionId, 'all' | 'other'>, RegionMeta> =
  REGIONS.reduce((acc, r) => {
    acc[r.id] = r
    return acc
  }, {} as Record<Exclude<RegionId, 'all' | 'other'>, RegionMeta>)

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

/** region-id → keyword list (already normalized) used to classify a city string. */
const REGION_KEYWORDS: Record<Exclude<RegionId, 'all' | 'other'>, string[]> = {
  riyadh: ['الرياض', 'لرياض', 'الخرج', 'المجمعة', 'الزلفي', 'الدوادمي', 'حوطة', 'الافلاج', 'القويعية', 'وادي الدواسر', 'عفيف'],
  makkah: ['مكة', 'جدة', 'الطائف', 'الليث', 'رابغ', 'القنفذة', 'خليص', 'الجموم', 'بحرة', 'الخرمة', 'rana'],
  madinah: ['المدينة', 'المنورة', 'ينبع', 'العلا', 'بدر', 'خيبر', 'الحناكية'],
  qassim: ['القصيم', 'بريدة', 'الرس', 'عنيزة', 'البدع', 'المذنب', 'الربيعية', 'رياض الخبراء', 'الأسياح'],
  eastern: ['الشرقية', 'الدمام', 'الخبر', 'الظهران', 'الاحساء', 'الاحسا', 'الجبيل', 'القطيف', 'الطرف', 'رأس تنورة', 'صفوى', 'الهفوف', 'المبرز', 'العقير'],
  asir: ['عسير', 'ابها', 'خميس', 'بيشة', 'محايل', 'احد', 'سراة', 'تثليث', 'ظهران الجنوب', 'بالقرن'],
  tabuk: ['تبوك', 'الوجه', 'ضباء', 'البدع', 'تيماء', 'أملج'],
  hail: ['حائل', 'بقعاء', 'الغزالة', 'الشنان', 'موقق'],
  northern: ['الحدود الشمالية', 'عرعر', 'رفحاء', 'طريف', 'العويقيلة', 'القيصومة'],
  jazan: ['جازان', 'جيزان', 'صبيا', 'ابو عريش', 'ابوعريش', 'أبو عريش', 'الدرب', 'فيفا', 'العارضة', 'محايل عسير'],
  najran: ['نجران', 'شرورة', 'حبونا', 'بدر الجنوب'],
  bahah: ['الباحة', 'بلجرشي', 'المندق', 'سبت', 'العلا', 'قلوة', 'المخواة', 'القرى'],
  jawf: ['الجوف', 'سكاكا', 'دومة', 'القريات', 'طبرجل'],
}

export function detectRegion(text: string | null | undefined): Exclude<RegionId, 'all'> {
  const n = normalizeArabic(text)
  if (!n) return 'other'
  for (const key of Object.keys(REGION_KEYWORDS) as (keyof typeof REGION_KEYWORDS)[]) {
    for (const kw of REGION_KEYWORDS[key]) {
      if (n.includes(normalizeArabic(kw))) return key
    }
  }
  return 'other'
}

export function regionLabel(id: Exclude<RegionId, 'all'>): string {
  if (id === 'other') return 'مناطق أخرى'
  return REGION_BY_ID[id]?.label ?? 'مناطق أخرى'
}

export function regionColor(id: Exclude<RegionId, 'all'>): string {
  if (id === 'other') return 'var(--color-text-secondary)'
  return REGION_BY_ID[id]?.color ?? 'var(--color-primary)'
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
