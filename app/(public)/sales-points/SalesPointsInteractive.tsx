'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import SalesPointCard from '@/components/public/SalesPointCard'
import FilterBar from '@/components/public/FilterBar'
import GeolocationButton from '@/components/public/GeolocationButton'
import EmptyState from '@/components/public/EmptyState'
import TrustCallout from '@/components/public/TrustCallout'
import FaqAccordion from '@/components/public/FaqAccordion'
import type { RegionId } from '@/lib/geo'
import { detectRegion, haversineKm } from '@/lib/geo'

const MapView = dynamic(() => import('@/components/public/MapView'), { ssr: false })

interface Point {
  _id: string
  name: string
  location: string
  neighborhood: string | null
  vip: boolean
  googleMapUrl: string
  lat: number | null
  lng: number | null
}

type Region = Exclude<RegionId, 'all'>

export default function SalesPointsInteractive({ points }: { points: Point[] }) {
  const [query, setQuery] = useState('')
  const [activeRegion, setActiveRegion] = useState<RegionId>('all')
  const [vipOnly, setVipOnly] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [recenterSignal, setRecenterSignal] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')

  const listRef = useRef<HTMLDivElement>(null)

  // Pre-compute the region of every point once.
  const regionOf = useMemo(() => {
    const map = new Map<string, Region>()
    for (const p of points) map.set(p._id, detectRegion(p.location || p.name || ''))
    return map
  }, [points])

  // Distances from the user, keyed by point id (only when located).
  const distanceOf = useMemo(() => {
    const map = new Map<string, number>()
    if (!userLocation) return map
    for (const p of points) {
      if (p.lat == null || p.lng == null) continue
      map.set(p._id, haversineKm(userLocation, { lat: p.lat, lng: p.lng }))
    }
    return map
  }, [points, userLocation])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const result = points.filter((p) => {
      if (vipOnly && !p.vip) return false
      if (activeRegion !== 'all' && regionOf.get(p._id) !== activeRegion) return false
      if (q) {
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.location.toLowerCase().includes(q) &&
          !(p.neighborhood && p.neighborhood.toLowerCase().includes(q))
        )
          return false
      }
      return true
    })

    if (userLocation) {
      result.sort((a, b) => {
        const da = distanceOf.get(a._id)
        const db = distanceOf.get(b._id)
        if (da == null && db == null) return 0
        if (da == null) return 1
        if (db == null) return -1
        return da - db
      })
    }
    return result
  }, [points, query, vipOnly, activeRegion, regionOf, userLocation, distanceOf])

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId((prev) => (prev === id ? null : id))
      if (window.innerWidth < 1024) {
        setMobileView('map')
      }
      const el = document.getElementById(`card-${id}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    },
    [],
  )

  const handleLocated = useCallback((coords: { lat: number; lng: number }) => {
    setUserLocation(coords)
    setRecenterSignal((n) => n + 1)
  }, [])

  const handleRecenter = useCallback(() => {
    if (userLocation) setRecenterSignal((n) => n + 1)
  }, [userLocation])

  const handleReset = useCallback(() => {
    setQuery('')
    setActiveRegion('all')
    setVipOnly(false)
  }, [])

  const hasFilters = query.trim() !== '' || activeRegion !== 'all' || vipOnly
  const filteredHasCoords = filtered.some((p) => p.lat != null && p.lng != null)

  // Clear selection if it leaves the filtered set.
  useEffect(() => {
    if (selectedId && !filtered.some((p) => p._id === selectedId)) {
      setSelectedId(null)
    }
  }, [filtered, selectedId])

  return (
    <div>
      {/* Heading */}
      <section className="container pt-8">
        <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
          دليل نقاط البيع
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] md:text-4xl">
          اعثر على أقرب نقطة بيع Special Car
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)] md:text-base">
          تصفّح نقاط البيع المعتمدة في جميع أنحاء المملكة العربية السعودية، وفلتر حسب المنطقة،
          واستخدم موقعك لترتيب الأقرب إليك.
        </p>
      </section>

      {/* Sticky region filter bar */}
      <div className="sticky top-16 z-30 mt-6 border-y border-[var(--color-border)] bg-[var(--color-background)]/90 backdrop-blur">
        <div className="container py-3">
          <FilterBar points={points} active={activeRegion} onChange={setActiveRegion} />
        </div>
      </div>

      {/* Toolbar: search + vip + locate */}
      <section className="container pt-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
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
              className="w-full rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pe-4 ps-12 text-sm text-[var(--color-text)] shadow-[var(--shadow-xs)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
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

          <VipToggle vipOnly={vipOnly} onToggle={() => setVipOnly((v) => !v)} />
          <GeolocationButton active={!!userLocation} onLocated={handleLocated} />
        </div>

        {/* Result count + active filters */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <span className="tnum">
            عرض <b className="tnum text-[var(--color-text)]">{filtered.length}</b> من {points.length}
            {userLocation && filtered.length > 0 ? ' — مرتّبة حسب الأقرب' : ''}
          </span>
          {hasFilters && (
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

      {/* Mobile list/map toggle */}
      <section className="container lg:hidden">
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-background)] p-1">
          {(['list', 'map'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setMobileView(v)}
              className={[
                'flex items-center justify-center gap-2 rounded-[var(--radius-pill)] py-2 text-sm font-semibold transition-all',
                mobileView === v
                  ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--shadow-sm)]'
                  : 'text-[var(--color-text-secondary)]',
              ].join(' ')}
            >
              {v === 'list' ? (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                  </svg>
                  القائمة
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
                    <path d="M9 4v14M15 6v14" />
                  </svg>
                  الخريطة
                </>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* List + Map */}
      <section className="container pb-4 pt-4">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* List panel (primary, 7/12) */}
          <div
            ref={listRef}
            className={mobileView === 'map' ? 'hidden lg:block lg:col-span-7' : 'lg:col-span-7'}
          >
            <div className="flex flex-col gap-3">
              {filtered.length === 0 ? (
                <EmptyState query={query} onReset={handleReset} />
              ) : (
                filtered.map((p, i) => (
                  <SalesPointCard
                    key={p._id}
                    point={p}
                    region={regionOf.get(p._id) ?? 'other'}
                    distanceKm={userLocation ? distanceOf.get(p._id) ?? null : null}
                    rank={userLocation ? i + 1 : undefined}
                    isSelected={selectedId === p._id}
                    onSelect={handleSelect}
                  />
                ))
              )}
            </div>
          </div>

          {/* Map panel (secondary, sticky, 5/12) */}
          <div
            className={
              mobileView === 'list'
                ? 'hidden lg:block lg:col-span-5'
                : 'lg:col-span-5'
            }
          >
            <div className="h-[70vh] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-md)] lg:sticky lg:top-32 lg:h-[calc(100vh-9rem)]">
              <MapView
                points={filtered}
                selectedId={selectedId}
                onSelect={handleSelect}
                userLocation={userLocation}
                recenterSignal={recenterSignal}
              />
            </div>
            {!filteredHasCoords && filtered.length > 0 && (
              <p className="mt-2 text-center text-xs text-[var(--color-text-muted)]">
                لا تتوفّر إحداثيات للنقاط الظاهرة على الخريطة حالياً.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Optional pattern sections */}
      <TrustCallout />
      <FaqAccordion />
    </div>
  )
}

function VipToggle({ vipOnly, onToggle }: { vipOnly: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={vipOnly}
      onClick={onToggle}
      className={[
        'inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-pill)] border px-4 py-3 text-sm font-semibold transition-all md:py-3',
        vipOnly
          ? 'border-transparent bg-[var(--color-accent-soft)] text-[var(--color-accent-hover)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]',
      ].join(' ')}
    >
      <svg
        className={[
          'h-4 w-4 transition-colors',
          vipOnly ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]',
        ].join(' ')}
        fill="currentColor" viewBox="0 0 20 20" aria-hidden
      >
        <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 0 0 .95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 0 0-.37 1.12l1.07 3.29c.3.92-.76 1.69-1.54 1.12l-2.8-2.03a1 1 0 0 0-1.18 0l-2.8 2.03c-.78.57-1.83-.2-1.54-1.12l1.07-3.29a1 1 0 0 0-.36-1.12L2.98 8.72c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 0 0 .95-.69z" />
      </svg>
      VIP فقط
    </button>
  )
}
