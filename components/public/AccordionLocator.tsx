'use client'

import dynamic from 'next/dynamic'
import { useCallback, useMemo, useState } from 'react'
import CategoryFilters from './CategoryFilters'
import RegionGroup from './RegionGroup'
import EmptyState from './EmptyState'
import GeolocationButton from './GeolocationButton'
import { haversineKm } from '@/lib/geo'
import { filterByCategory, groupPointsByRegion, type CategoryId, type POSEntry } from '@/lib/points'

const MapView = dynamic(() => import('./MapView'), { ssr: false })

interface Props {
  points: POSEntry[]
}

type View = 'list' | 'map'

export default function AccordionLocator({ points }: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId>('all')
  const [view, setView] = useState<View>('list')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [recenterSignal, setRecenterSignal] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const searching = query.trim() !== ''

  // 1) text search
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return points
    return points.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        (p.neighborhood ? p.neighborhood.toLowerCase().includes(q) : false),
    )
  }, [points, query])

  // 2) category filter (VIP tier)
  const visible = useMemo(() => filterByCategory(searched, category), [searched, category])

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
    const base = groupPointsByRegion(visible)
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

  const vipCount = useMemo(() => searched.filter((p) => p.vip).length, [searched])

  function handleReset() {
    setQuery('')
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
      {/* Heading */}
      <section className="container pt-8">
        <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
          دليل نقاط البيع
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] md:text-4xl">
          تصفّح نقاط البيع حسب المنطقة
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)] md:text-base">
          استعرض نقاط بيع Special Car مجمّعة حسب المناطق الإدارية في المملكة. بدّل بين العرض
          كقائمة أو خريطة، وفلتر حسب النوع، وحدّد موقعك لترتيب الأقرب إليك.
        </p>
      </section>

      {/* Controls */}
      <section className="container pt-6">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-sm)] sm:p-4">
          <CategoryFilters
            active={category}
            total={searched.length}
            vipCount={vipCount}
            onChange={setCategory}
          />

          <div className="relative mt-3">
            <svg
              className="pointer-events-none absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 text-[var(--color-text-muted)]"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن مدينة أو حي أو اسم…"
              className="w-full rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-background)] py-3 pe-4 ps-12 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="مسح البحث"
                className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-background)] hover:text-[var(--color-text)]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* View toggle + locate */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <ViewToggle view={view} onChange={setView} />
            <GeolocationButton active={!!userLocation} onLocated={handleLocated} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <span className="tnum">
            <b className="tnum text-[var(--color-text)]">{visible.length}</b> نقطة في{' '}
            <b className="tnum text-[var(--color-text)]">{groups.length}</b> منطقة
            {userLocation && visible.length > 0 ? ' — مرتّبة حسب الأقرب' : ''}
          </span>
          {(searching || category !== 'all') && (
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
          <EmptyState query={query} onReset={handleReset} />
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
                defaultOpen={searching}
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
  return (
    <div
      role="tablist"
      aria-label="طريقة العرض"
      className="grid grid-cols-2 gap-1 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-background)] p-1"
    >
      {items.map((it) => (
        <button
          key={it.id}
          role="tab"
          aria-selected={view === it.id}
          onClick={() => onChange(it.id)}
          className={[
            'flex items-center justify-center gap-2 rounded-[var(--radius-pill)] py-2 text-sm font-semibold transition-all',
            view === it.id
              ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--shadow-sm)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]',
          ].join(' ')}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
    </div>
  )
}
