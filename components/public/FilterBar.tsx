'use client'

import { useMemo } from 'react'
import type { RegionId } from '@/lib/geo'
import { detectRegion } from '@/lib/geo'
import RegionIcon from './RegionIcon'

export interface PointLike {
  location?: string | null
  name?: string | null
}

interface Props {
  points: PointLike[]
  active: RegionId
  onChange: (region: RegionId) => void
}

export default function FilterBar({ points, active, onChange }: Props) {
  // Only show regions that actually appear in the data, ordered by count desc.
  const tabs = useMemo(() => {
    const counts = new Map<Exclude<RegionId, 'all'>, number>()
    for (const p of points) {
      const r = detectRegion(p.location ?? p.name ?? '')
      counts.set(r, (counts.get(r) ?? 0) + 1)
    }
    const total = points.length
    return [
      { id: 'all' as const, label: 'الكل', count: total },
      ...[...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id, count]) => ({ id, label: regionShort(id), count })),
    ]
  }, [points])

  return (
    <div
      role="tablist"
      aria-label="تصفية حسب المنطقة"
      className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 py-1"
    >
      {tabs.map((tab) => {
        const selected = active === tab.id
        const isAll = tab.id === 'all'
        const region = isAll ? null : (tab.id as Exclude<RegionId, 'all'>)
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={[
              'group flex shrink-0 items-center gap-2 rounded-[var(--radius-pill)] border px-4 py-2 text-sm font-medium transition-all duration-[var(--duration)]',
              selected
                ? 'border-transparent bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]',
            ].join(' ')}
          >
            {region && (
              <RegionIcon
                region={region}
                className={[
                  'h-4 w-4 transition-colors',
                  selected ? 'text-white' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]',
                ].join(' ')}
              />
            )}
            <span className="whitespace-nowrap">{tab.label}</span>
            <span
              className={[
                'tnum rounded-[var(--radius-pill)] px-1.5 py-0.5 text-xs leading-none',
                selected ? 'bg-white/20 text-white' : 'bg-[var(--color-background)] text-[var(--color-text-muted)]',
              ].join(' ')}
            >
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Shorter label for the pill (drop the "منطقة " prefix). */
function regionShort(id: Exclude<RegionId, 'all'>): string {
  const map: Record<Exclude<RegionId, 'all'>, string> = {
    riyadh: 'الرياض',
    makkah: 'مكة المكرمة',
    madinah: 'المدينة المنورة',
    qassim: 'القصيم',
    eastern: 'الشرقية',
    asir: 'عسير',
    tabuk: 'تبوك',
    hail: 'حائل',
    northern: 'الحدود الشمالية',
    jazan: 'جازان',
    najran: 'نجران',
    bahah: 'الباحة',
    jawf: 'الجوف',
    other: 'أخرى',
  }
  return map[id] ?? 'أخرى'
}
