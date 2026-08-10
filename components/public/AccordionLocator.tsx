'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import CategoryFilters from './CategoryFilters'
import RegionGroup from './RegionGroup'
import EmptyState from './EmptyState'
import Hero from './Hero'
import GeolocationButton from './GeolocationButton'
import { haversineKm } from '@/lib/geo'
import { filterByCategory, groupByCity, type CategoryId, type POSEntry } from '@/lib/points'
import { useIsMobile } from '@/lib/hooks/use-is-mobile'
import { useScrollLock } from '@/lib/hooks/use-scroll-lock'

const MapView = dynamic(() => import('./MapView'), { ssr: false })

interface Props {
  points: POSEntry[]
}

type View = 'list' | 'map'

type MapMode = 'normal' | 'fullscreen'

export default function AccordionLocator({ points }: Props) {
  const [category, setCategory] = useState<CategoryId>('all')
  const [view, setView] = useState<View>('list')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [recenterSignal, setRecenterSignal] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // --- feature 003: map mode (normal | fullscreen) + resize plumbing ---
  // mode is mirrored in a ref so the popstate/back path and idempotent guards
  // always read fresh state without stale closures; capturedScrollY is captured
  // BEFORE the fullscreen class swap and restored verbatim on minimize (C3.1/3.3).
  const [mapMode, setMapMode] = useState<MapMode>('normal')
  const [resizeSignal, setResizeSignal] = useState(0)
  const mapModeRef = useRef<MapMode>('normal')
  const capturedScrollYRef = useRef(0)
  const historyEntryRef = useRef(false) // a `{ scMap: 'expanded' }` entry is live
  const pendingBackRef = useRef(false) // history.back() queued, popstate not yet dispatched
  const isMobile = useIsMobile()
  useScrollLock(mapMode === 'fullscreen') // FR-009: lock background scroll while fullscreen (C3.2)

  const setMode = useCallback((mode: MapMode) => {
    mapModeRef.current = mode
    setMapMode(mode)
  }, [])

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

  // Expand — mobile-only (FR-012/FR-003): captures scroll BEFORE any class
  // change, pushes the single back-entry (FR-011, C3.4), bumps the resize
  // signal so the same mounted map invalidates at fullscreen size (FR-008, C1).
  const handleExpand = useCallback(() => {
    if (mapModeRef.current === 'fullscreen' || !isMobile) return
    capturedScrollYRef.current = window.scrollY // before class swap (C3.1)
    setResizeSignal((n) => n + 1)
    history.pushState({ scMap: 'expanded' }, '') // exactly one entry per expand
    historyEntryRef.current = true
    setMode('fullscreen')
  }, [isMobile, setMode])

  // Single exit path for BOTH minimize exits (C3.6): the actual state change.
  // Never calls closePopup / clears selectedId (C3.8 — the open Leaflet popup,
  // feature 001's detail surface, survives); restores the captured scroll AFTER
  // the class swap, deferred to rAF so the passive body-unlock effect has run
  // (FR-006, C3.3; 'instant', never smooth, never top).
  const exitFullscreen = useCallback(() => {
    if (mapModeRef.current !== 'fullscreen') return // idempotent (C3.5/3.6)
    setResizeSignal((n) => n + 1)
    setMode('normal')
    requestAnimationFrame(() => {
      window.scrollTo({ top: capturedScrollYRef.current, behavior: 'instant' })
    })
  }, [setMode])

  // US6: back button/gesture minimizes only OUR entry (FR-011, C3.5).
  // NOTE on mechanics: PopStateEvent.state holds the state of the entry being
  // traversed TO — a back press away from our pushed entry lands on the base
  // entry whose state is null, so a literal `event.state?.scMap === 'expanded'`
  // gate would never fire (verified empirically in Chrome headless; also Next.js
  // re-decorates pushState state with its `__NA`/internals fields). The plan's
  // cited fancybox-style pattern closes when the landed entry lacks the marker;
  // we gate on historyEntryRef (our entry is live = fullscreen with entry), so
  // any back traversal while fullscreen minimizes, and popstates while normal
  // (incl. forward into our entry, page restores) are left untouched → a second
  // back press performs standard navigation. Listener removed on unmount (FR-015).
  useEffect(() => {
    const onPopstate = () => {
      if (historyEntryRef.current) {
        historyEntryRef.current = false
        pendingBackRef.current = false
        exitFullscreen()
      }
    }
    window.addEventListener('popstate', onPopstate)
    return () => window.removeEventListener('popstate', onPopstate)
  }, [exitFullscreen])

  // Minimize button — pops the pushed entry via history.back() when present so
  // button-minimize and back-minimize converge on the same popstate code path
  // (C3.6); the refs stay set until popstate dispatches so the exit path runs
  // (pendingBackRef prevents a second back() from stranding history). Direct
  // fallback keeps the loop working if no entry exists.
  const handleMinimize = useCallback(() => {
    if (mapModeRef.current !== 'fullscreen') return
    if (historyEntryRef.current) {
      if (!pendingBackRef.current) {
        pendingBackRef.current = true
        history.back()
      }
    } else {
      exitFullscreen()
    }
  }, [exitFullscreen])

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
              className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--color-border)] px-2.5 py-1 font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
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
      <section className="container pt-8 pb-12 md:pt-12">
        {visible.length === 0 ? (
          <EmptyState onReset={handleReset} />
        ) : view === 'map' ? (
          <div
            className={
              mapMode === 'fullscreen'
                ? // NOTE: `isolate` (not .map-isolate) — .map-isolate's position:relative/z-index
                  // (custom utility emitted after Tailwind's .fixed/.z-* in the same layer) would
                  // otherwise override `fixed`/`z-[var(--z-overlay)]` (verified in compiled CSS).
                  'isolate fixed inset-0 z-[var(--z-overlay)] overflow-hidden rounded-none border-0'
                : 'isolate relative z-[var(--z-map)] h-[70vh] overflow-hidden rounded-none border border-[var(--color-border)] shadow-[var(--shadow-md)] sm:h-[75vh] [margin-inline:calc(-1*var(--space-4))] border-x-0 md:rounded-[var(--radius-xl)] md:border-x md:[margin-inline:0]'
            }
          >
            {/* Wrapper class matrix (contract C2): normal-mobile = full-bleed card;
                normal-desktop = shipped card exactly; fullscreen = fixed viewport
                overlay. The mounted MapView is NEVER remounted/ported — size
                changes are followed by invalidateSize via resizeSignal (R1).
                US1 full-bleed (FR-001): below 768px the card breaks out of the
                container padding (`--space-4` = 1rem, logical/RTL-safe negative
                margin-inline) losing corner radius and side borders; at md: the
                shipped desktop card is restored exactly (FR-002, contract C2). */}
            {/* Expand — mobile-only overlay control (FR-003/FR-012); z-[1001]
                clears MapView's internal z-[1000] activation overlay (R9);
                stopPropagation keeps the tap from activating the map (C4.5). */}
            {isMobile && mapMode === 'normal' && (
              <button
                type="button"
                aria-label="تكبير الخريطة"
                onClick={(e) => {
                  e.stopPropagation()
                  handleExpand()
                }}
                className="absolute start-4 top-4 z-[1001] flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-md)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
              >
                <Maximize2 className="h-5 w-5" aria-hidden />
              </button>
            )}

            {/* Minimize — visible at ANY width while fullscreen (FR-005/FR-014,
                rotation dead-end prevention, C4.4). */}
            {mapMode === 'fullscreen' && (
              <button
                type="button"
                aria-label="تصغير الخريطة"
                onClick={(e) => {
                  e.stopPropagation()
                  handleMinimize()
                }}
                className="absolute start-4 top-4 z-[1001] flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-md)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
              >
                <Minimize2 className="h-5 w-5" aria-hidden />
              </button>
            )}

            <MapView
              points={visible}
              selectedId={selectedId}
              onSelect={handleSelect}
              userLocation={userLocation}
              recenterSignal={recenterSignal}
              resizeSignal={resizeSignal}
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
