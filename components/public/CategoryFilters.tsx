'use client'

import { CATEGORY_META, type CategoryId } from '@/lib/points'

interface Props {
  active: CategoryId
  /** total entries, used to compute per-category counts */
  total: number
  vipCount: number
  onChange: (id: CategoryId) => void
}

export default function CategoryFilters({ active, total, vipCount, onChange }: Props) {
  const counts: Record<CategoryId, number> = {
    all: total,
    vip: vipCount,
    standard: total - vipCount,
  }

  return (
    <div
      role="tablist"
      aria-label="تصفية حسب النوع"
      className="flex items-center gap-2 overflow-x-auto no-scrollbar"
    >
      {CATEGORY_META.map((cat) => {
        const selected = active === cat.id
        const count = counts[cat.id]
        return (
          <button
            key={cat.id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(cat.id)}
            className={[
              'group flex shrink-0 items-center gap-2 rounded-[var(--radius-pill)] border px-4 py-2 text-sm font-semibold transition-all duration-[var(--duration)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]',
              selected
                ? 'border-transparent bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]',
            ].join(' ')}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: selected ? '#fff' : cat.color }}
              aria-hidden
            />
            <span className="whitespace-nowrap">{cat.label}</span>
            <span
              className={[
                'tnum rounded-[var(--radius-pill)] px-1.5 py-0.5 text-xs leading-none',
                selected ? 'bg-white/20 text-white' : 'bg-[var(--color-background)] text-[var(--color-text-muted)]',
              ].join(' ')}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
