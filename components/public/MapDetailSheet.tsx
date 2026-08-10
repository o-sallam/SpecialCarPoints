'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { directionsLink, googleMapsLink } from '@/lib/maps'
import type { POSEntry } from '@/lib/points'

/*
 * MapDetailSheet — the sales-point detail bottom sheet (feature 004, US1).
 *
 * Built on the shadcn Sheet primitive (side="bottom", contract 5), tokens-only
 * styling. Content is byte-identical to the List View EntryCard rendering
 * (FR-003/FR-004): displayName title + VIP pill + `{cityName} • حي
 * {neighborhoodName}` (or `• {extraLabel}`) line.
 *
 * Dismissal (FR-007):
 *  - swipe-down: custom pointer-drag on the header/grabber region; release
 *    past ~96px or a fast flick closes, otherwise springs back (T004)
 *  - backdrop tap / Escape: Radix onOpenChange (contract 3.4)
 *  - close control: SheetClose (aria-label إغلاق)
 * Every path converges on onClose(), which clears selectedId in the parent
 * (contract 3.5 → highlight cleared).
 *
 * The internal `open` state stays true while the sheet is "live", so switching
 * selection swaps the content in place without a close/reopen (FR-008); all
 * dismiss paths animate out first, then call onClose() after the exit
 * transition so the slide-down animation actually plays (FR-009).
 */

interface MapDetailSheetProps {
  point: POSEntry | null
  onClose: () => void
}

const SWIPE_CLOSE_THRESHOLD = 96 // px of downward drag
const FLICK_VELOCITY = 0.6 // px/ms
const DRAG_FRICTION = 0.55 // dampen finger distance → sheet distance
const CLOSE_SETTLE_MS = 320 // ≈ closed-state animation (duration * 1.5) + buffer

export default function MapDetailSheet({ point, onClose }: MapDetailSheetProps) {
  const [open, setOpen] = useState(!!point)
  const [visiblePoint, setVisiblePoint] = useState<POSEntry | null>(point)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const closeTimerRef = useRef<number | null>(null)
  const dragRef = useRef({ startY: 0, offset: 0, active: false })

  // Open + in-place content swap when the selection changes (FR-008).
  useEffect(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    if (point) {
      setVisiblePoint(point)
      setOpen(true)
    }
  }, [point])

  useEffect(
    () => () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
    },
    [],
  )

  // Single exit path: animate out via Radix, then clear the selection
  // (contract 3.4/3.5). Safe against rapid re-taps: a new point cancels the
  // pending onClose (effect above) so a fresh selection is never wiped.
  function dismiss() {
    setOpen(false)
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null
      onClose()
    }, CLOSE_SETTLE_MS)
  }

  // --- swipe-down gesture (T004) — transform-only, compositor-friendly,
  // degrades to the always-available close/backdrop/Escape paths. ---
  function onDragStart(e: React.PointerEvent) {
    if (e.button !== 0) return
    // Never hijack drags that start on interactive elements (action buttons).
    if ((e.target as HTMLElement).closest('a,button,[role="button"]')) return
    const el = contentRef.current
    if (!el) return
    const d = dragRef.current
    d.active = true
    d.startY = e.clientY
    d.offset = 0
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    el.style.transition = 'none'
    el.style.willChange = 'transform'
  }

  function onDragMove(e: React.PointerEvent) {
    const d = dragRef.current
    const el = contentRef.current
    if (!d.active || !el) return
    const dy = e.clientY - d.startY
    d.offset = dy > 0 ? dy * DRAG_FRICTION : dy * 0.15 // mild resistance pulling up
    el.style.transform = `translate3d(0, ${d.offset}px, 0)`
  }

  function onDragEnd(e: React.PointerEvent) {
    const d = dragRef.current
    const el = contentRef.current
    if (!d.active || !el) return
    d.active = false
    el.style.willChange = ''
    const dy = e.clientY - d.startY
    const flick = dy > 0 && Math.abs(dy / Math.max(1, e.timeStamp)) > FLICK_VELOCITY
    if (dy >= SWIPE_CLOSE_THRESHOLD || flick) {
      el.style.transform = ''
      el.style.transition = ''
      dismiss()
    } else {
      // spring back to rest on the --duration/--ease tokens (contract 3.6)
      el.style.transition = `transform var(--duration) var(--ease)`
      el.style.transform = ''
      window.setTimeout(() => {
        if (el) el.style.transition = ''
      }, 400)
    }
  }

  // Destinations (FR-015/016/017, contract 4) — resolved from the stored
  // googleMapUrl first, else coordinates; hidden when neither exists.
  const gLink = visiblePoint ? googleMapsLink(visiblePoint) : null
  const dLink = visiblePoint ? directionsLink(visiblePoint) : null

  return (
    <Sheet open={open} onOpenChange={(o) => !o && dismiss()}>
      <SheetContent
        ref={contentRef}
        side="bottom"
        aria-describedby={undefined}
        className="max-h-[85dvh] overflow-hidden px-5 pb-[calc(var(--space-5)+env(safe-area-inset-bottom))] pt-3"
      >
        {/* Drag surface: grabber + header (touch-action none — the body below
            keeps native pan-y scroll, T016). */}
        <div
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          style={{ touchAction: 'none' }}
          className="select-none"
        >
          <div
            aria-hidden
            className="mx-auto h-1.5 w-12 rounded-[var(--radius-pill)] bg-[var(--color-border-strong)]"
          />
          <SheetHeader className="px-0 pb-2 pt-3">
            <SheetTitle className="flex flex-wrap items-center gap-2 text-start leading-snug">
              <span className="min-w-0">{visiblePoint?.displayName}</span>
              {visiblePoint?.vip && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-pill)] bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[var(--color-accent-hover)]">
                  VIP
                </span>
              )}
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* Body — location line, then actions (US3). Scans internally. */}
        <div className="overflow-y-auto pb-1">
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--color-text-secondary)]">
            <span className="truncate">
              {visiblePoint?.cityName}
              {visiblePoint?.neighborhoodName ? (
                <span className="text-[var(--color-text-muted)]">
                  {' '}
                  • حي {visiblePoint.neighborhoodName}
                </span>
              ) : visiblePoint?.extraLabel ? (
                <span className="text-[var(--color-text-muted)]">
                  {' '}
                  • {visiblePoint.extraLabel}
                </span>
              ) : null}
            </span>
          </div>

          {/* Actions (FR-005/006/017, contract 3.3): each button renders only
              when its destination resolves; both hidden when the point has
              neither googleMapUrl nor lat/lng — never disabled/dead. External
              links open safely (FR-018: target=_blank rel=noopener). */}
          {(dLink || gLink) && (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {dLink && (
                <Button asChild variant="outline">
                  <a
                    href={dLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-text)]"
                  >
                    <Navigation aria-hidden />
                    الاتجاهات
                  </a>
                </Button>
              )}
              {gLink && (
                <Button asChild>
                  <a href={gLink} target="_blank" rel="noopener noreferrer">
                    <MapPin aria-hidden />
                    فتح في خرائط Google
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}