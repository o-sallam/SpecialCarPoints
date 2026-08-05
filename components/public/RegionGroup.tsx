'use client'

import { useEffect, useState } from 'react'
import EntryCard from './EntryCard'
import type { Region } from '@/lib/points'

interface Props {
  region: Region
  /** when true (e.g. while searching) the group opens automatically */
  defaultOpen?: boolean
  /** distance map (id → km) when geolocation is active */
  distanceOf?: Map<string, number>
  selectedId?: string | null
  onSelect?: (id: string) => void
}

export default function RegionGroup({ region, defaultOpen = false, distanceOf, selectedId, onSelect }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  // Follow parent expand-intent (e.g. while searching) without locking the toggle.
  useEffect(() => {
    setOpen(defaultOpen)
  }, [defaultOpen])

  // Auto-expand when one of this region's entries becomes selected (e.g. via map).
  useEffect(() => {
    if (selectedId && region.entries.some((e) => e._id === selectedId)) setOpen(true)
  }, [selectedId, region.entries])

  const isOpen = open

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 px-4 py-4 text-start transition-colors hover:bg-[var(--color-background)] sm:px-5"
      >
        <span
          className={[
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border transition-colors',
            isOpen
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
              : 'border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-secondary)]',
          ].join(' ')}
        >
          {/* generic location pin — regions/districts were removed; groups are by city */}
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 21s-7-7.58-7-12a7 7 0 1 1 14 0c0 4.42-7 12-7 12Z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-extrabold text-[var(--color-text)] sm:text-base">
            {region.label}
          </span>
          <span className="tnum text-xs text-[var(--color-text-secondary)]">
            {region.entries.length} نقطة بيع
          </span>
        </span>

        <span className="tnum flex h-7 min-w-7 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-background)] px-2 text-xs font-bold text-[var(--color-text-secondary)]">
          {region.entries.length}
        </span>

        <svg
          className={[
            'h-5 w-5 shrink-0 text-[var(--color-text-muted)] transition-transform duration-[var(--duration)]',
            isOpen ? 'rotate-180' : '',
          ].join(' ')}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-[var(--duration)] ease-[var(--ease)]"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <ul className="grid grid-cols-1 gap-3 border-t border-[var(--color-border)] p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3">
            {region.entries.map((entry) => (
              <li key={entry._id} className="min-w-0">
                <EntryCard
                  entry={entry}
                  distanceKm={distanceOf?.get(entry._id)}
                  isSelected={selectedId === entry._id}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
