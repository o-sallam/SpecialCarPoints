'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CategoryFilters from './CategoryFilters'
import RegionGroup from './RegionGroup'
import EmptyState from './EmptyState'
import Hero from './Hero'
import GeolocationButton from './GeolocationButton'
import { haversineKm } from '@/lib/geo'
import { filterByCategory, groupByCity, type CategoryId, type POSEntry } from '@/lib/points'

const MapView = dynamic(() => import('./MapView'), { ssr: false })

interface Props {
  points: POSEntry[]
}

type View = 'list' | 'map'

export default function AccordionLocator({ points }: Props) {
  const [category, setCategory] = useState<CategoryId>('all')
  const [view, setView] = useState<View>('list')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [recenterSignal, setRecenterSignal] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // 1) category filter (VIP tier)
  const visible = useMemo(() => filterByCategory(points, category), [points, category])

  // distances from the user (only when located)
  const distanceOf = useMemo(() => {
    const m = new Map<string, number>()
    if (!userLocation) return m
    for (const p of points) {
      if (p.lat == null || p.lng == null) continue
      m.set(p._id, haversineKm(userLocation, { lat: p.lat, lng: p.lng }))
    }
    return m
  }, [points, userLocation])

  // 3) group by region; when located, sort by nearest region + nearest entry first
  const groups = useMemo(() => {
    const base = groupByCity(visible)
    if (!userLocation) return base
    const minDist = (entries: POSEntry[]) =>
      entries.reduce((min, e) => {
        const d = distanceOf.get(e._id)
        return d == null ? min : Math.min(min, d)
      }, Infinity)
    return base
      .map((r) => ({
        ...r,
        entries: [...r.entries].sort((a, b) => {
          const da = distanceOf.get(a._id)
          const db = distanceOf.get(b._id)
          if (da == null && db == null) return 0
          if (da == null) return 1
          if (db == null) return -1
          return da - db
        }),
      }))
      .sort((a, b) => minDist(a.entries) - minDist(b.entries))
  }, [visible, userLocation, distanceOf])

  const vipCount = useMemo(() => points.filter((p) => p.vip).length, [points])
  const allRegionCount = useMemo(() => groupByCity(points).length, [points])

  function handleReset() {
    setCategory('all')
  }

  // clicking a card (or a map marker) selects it and reveals it on the map
  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id))
    setView('map')
  }, [])

  const handleLocated = useCallback((coords: { lat: number; lng: number }) => {
    setUserLocation(coords)
    setRecenterSignal((n) => n + 1)
  }, [])

  return (
    <div>
      {/* Hero — full-bleed, outside the content container; live stat chips */}
      <Hero totalPoints={points.length} regionCount={allRegionCount} vipCount={vipCount} />

      {/* Controls */}
      <section className="container pt-8 md:pt-12">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-sm)] sm:p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* filters + locate — horizontally scrollable, never wrapping */}
            <div className="flex min-w-0 items-center gap-2 overflow-x-auto no-scrollbar">
              <CategoryFilters
                active={category}
                total={points.length}
                vipCount={vipCount}
                onChange={setCategory}
              />
              <GeolocationButton active={!!userLocation} onLocated={handleLocated} />
            </div>
            {/* view toggle — own row on mobile, end-aligned on desktop */}
            <div className="flex shrink-0 items-center justify-start md:justify-end">
              <ViewToggle view={view} onChange={setView} />
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <span className="tnum">
            <b className="tnum text-[var(--color-text)]">{visible.length}</b> نقطة في{' '}
            <b className="tnum text-[var(--color-text)]">{groups.length}</b> منطقة
            {userLocation && visible.length > 0 ? ' — مرتّبة حسب الأقرب' : ''}
          </span>
          {category !== 'all' && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--color-border)] px-2.5 py-1 font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
              مسح الفلاتر
            </button>
          )}
        </div>
      </section>

      {/* List / Map */}
      <section className="container pb-12 pt-5">
        {visible.length === 0 ? (
          <EmptyState onReset={handleReset} />
        ) : view === 'map' ? (
          <div className="map-isolate h-[70vh] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-md)] sm:h-[75vh]">
            <MapView
              points={visible}
              selectedId={selectedId}
              onSelect={handleSelect}
              userLocation={userLocation}
              recenterSignal={recenterSignal}
            />
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            {groups.map((region) => (
              <RegionGroup
                key={region.id}
                region={region}
                distanceOf={distanceOf}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const items: { id: View; label: string; icon: React.ReactNode }[] = [
    {
      id: 'list',
      label: 'القائمة',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      ),
    },
    {
      id: 'map',
      label: 'الخريطة',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
          <path d="M9 4v14M15 6v14" />
        </svg>
      ),
    },
  ]

  const activeIndex = view === 'list' ? 0 : 1
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  // RTL: index 0 sits on the start side (right); cond one index → shift left.
  const isRtl = typeof document !== 'undefined' ? document.documentElement.dir === 'rtl' : true

  // Keep keyboard focus on the active tab (roving tabindex).
  useEffect(() => {
    tabRefs.current[activeIndex]?.focus()
  }, [activeIndex])

  function onTabKeyDown(e: React.KeyboardEvent, index: number) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
    e.preventDefault()
    let next: number
    if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    else if (e.key === 'ArrowRight') next = isRtl ? index - 1 : index + 1
    else next = isRtl ? index + 1 : index - 1
    if (next < 0) next = items.length - 1
    if (next > items.length - 1) next = 0
    onChange(items[next].id)
  }

  return (
    <div
      role="tablist"
      aria-label="طريقة العرض"
      className="relative grid w-full grid-cols-2 gap-1 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-background)] p-1 md:w-auto"
    >
      {/* sliding active indicator — transform-driven, RTL-aware */}
      <span
        aria-hidden
        className="absolute inset-y-1 start-1 w-[calc(50%-6px)] rounded-[calc(var(--radius-pill)-4px)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-sm)] transition-transform duration-[var(--duration)] ease-[var(--ease)]"
        style={{
          transform:
            activeIndex === 1
              ? `translateX(${isRtl ? 'calc(-100% - 4px)' : 'calc(100% + 4px)'})`
              : 'translateX(0)',
        }}
      />

      {items.map((item, index) => (
        <button
          key={item.id}
          ref={(el) => {
            tabRefs.current[index] = el
          }}
          type="button"
          role="tab"
          aria-selected={view === item.id}
          tabIndex={view === item.id ? 0 : -1}
          onClick={() => onChange(item.id)}
          onKeyDown={(e) => onTabKeyDown(e, index)}
          className={[
            'relative z-10 flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--radius-pill)] px-4 py-2 text-sm font-semibold transition-colors duration-[var(--duration)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]',
            view === item.id
              ? 'text-[var(--color-primary)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]',
          ].join(' ')}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  )
}
