# Component & Behavior Contracts: Sales Point Detail Sheet (Map View)

**Branch**: `004-sales-point-map-modal` | **Date**: 2026-08-11 | **Spec**: [spec.md](../spec.md) | **Plan**: [plan.md](../plan.md) | **Data model**: [data-model.md](../data-model.md)

This feature exposes **no public API and no backend interface**. The contracts below are UI/component contracts: the `MapView` selection wiring (the only cross-component interface change), the new `MapDetailSheet` and `lib/maps.ts` surfaces, and the page-level behavior `AccordionLocator` must honor.

---

## Contract 1 — Selection origin wiring (`AccordionLocator` + `MapView`)

```ts
type SelectionOrigin = 'map' | 'list'

// AccordionLocator internal state (data-model.md)
selectedId: string | null
selectionOrigin: SelectionOrigin

// MapView props — onSelect signature change (the ONLY interface change to MapView):
interface MapViewProps {
  points: MapPoint[]                    // unchanged
  selectedId: string | null             // unchanged
  onSelect: (id: string, origin: SelectionOrigin) => void   // MODIFIED: second arg added
  selectionOrigin?: SelectionOrigin     // NEW: 'map' → zero map movement (FR-012); 'list'/absent → today's flyTo+popup
  userLocation?: ...                    // unchanged
  recenterSignal?: number               // unchanged
}
```

**Semantics**:
- `MapView` MUST call `onSelect(id, 'map')` from marker clicks (never `'list'`).
- `AccordionLocator` list wiring (`EntryCard`/`RegionGroup` select handlers) MUST call `handleSelect(id, 'list')`.
- **Map-origin selection**: `MapView` MUST NOT call `flyTo`, `openPopup`, `fitBounds`, or any pan/zoom — the map's center and zoom MUST be bit-identical before/after the tap (FR-012, scenario 10, SC-001).
- **List-origin selection**: behavior MUST remain exactly as shipped today (flyTo(14) + openPopup + highlight).
- Marker highlight (`selectedId` → accent pin + `zIndexOffset`) applies in **both** origins.

**Verification**: at any zoom level, `map.getCenter()`/`getZoom()` recorded before and after a map-origin tap are identical (quickstart S-04).

## Contract 2 — Click handler isolation (FR-013/FR-014)

- Individual marker click handler in `MapView.tsx` MUST call `L.DomEvent.stopPropagation(e.originalEvent)` AND markers MUST be created with `bubblingMouseEvents: false`.
- The marker click handler MUST NOT reference cluster-group click/zoom logic, and the cluster group's cluster-click zoom MUST NOT reference marker click logic — two fully separate handlers, one outcome each.
- Cluster rendering, count badge, and zoom-to-bounds MUST remain byte-identical to the shipped clustering (FR-011).
- A single tap on an individual marker produces **exactly one** outcome: `onSelect(id, 'map')`. No zoom, no pan, no re-clustering, no delayed/queued second outcome (mid-animation taps included — FR-014 edge).

**Verification**: ≥20 individual taps across clustered and fully-zoomed states → zero zoom/pan events fired; ≥10 cluster taps → zoom only, never selection change (quickstart S-05, S-12).

## Contract 3 — `MapDetailSheet` component surface (new)

```ts
interface MapDetailSheetProps {
  point: POSEntry | null        // the selected point; null → closed (no render)
  onClose: () => void           // clears selectedId (all dismiss paths converge here)
}
```

Behavior contract (FR-001…FR-010 + FR-015…FR-023):
| # | Rule |
|---|------|
| 3.1 | Built on shadcn `Sheet`/`SheetContent side="bottom"` (`components/ui/sheet.tsx`), token-theme only, `cn()` — no bespoke modal, no new colors (FR-002). |
| 3.2 | Content: `displayName` title + VIP badge + `{cityName} • حي {neighborhoodName}` (or `• {extraLabel}`) location line — byte-identical to `EntryCard` rendering (FR-003/FR-004). |
| 3.3 | Actions: "Directions" and "Go to Google Maps" buttons from `lib/maps.ts` builders; both hidden when the selected point has neither `googleMapUrl` nor `lat/lng` (FR-015/FR-016/FR-017); `target="_blank" rel="noopener"` (FR-018). |
| 3.4 | Dismiss paths — swipe-down (pointer drag ≥96px or fast flick → close; else spring back), backdrop tap (Radix `onOpenChange`), close button (`aria-label="إغلاق"`), Escape (Radix) — all converge on `onClose` (FR-007). |
| 3.5 | Close ⇒ `selectedId` cleared ⇒ marker highlight cleared (FR-008). |
| 3.6 | Content swaps in place when `point` changes without closing (FR-009); animation = shadcn `data-[state]` slide/fade with `--duration`/`--ease` tokens, transform-only, <300 ms (FR-009/FR-010, SC-001). |
| 3.7 | Keyboard: focus moves into the sheet on open; Escape closes; close + actions reachable with focus-visible rings; Radix focus-trap + `aria-modal` semantics (FR-010). |
| 3.8 | Viewport: renders identically on all viewports (Q1-A default, FR-019); never taller than viewport — content scrolls internally (`overflow-y-auto`, `max-h` bounded) (FR-022); rotation keeps it open and repositioned (FR-021); cluster taps never alter it (FR-023). |
| 3.9 | RTL: text alignment, icons, and drag direction honor `dir="rtl"` (swipe-down is direction-agnostic). |
| 3.10 | Z-order: sheet `z-index` 1001 = `var(--z-overlay)` + 1 — above page content (40) and feature 003's fullscreen map (1000), below toasts (1100) (FR-018/FR-020). |

## Contract 4 — `lib/maps.ts` link builders (new, pure)

```ts
googleMapsLink(p: { googleMapUrl: string; lat: number | null; lng: number | null }): string | null
directionsLink(p: { lat: number | null; lng: number | null }): string | null
```

- `googleMapsLink`: non-empty `googleMapUrl` → return it verbatim; else `lat`/`lng` present → `https://www.google.com/maps?q=${lat},${lng}`; else `null`.
- `directionsLink`: `lat`/`lng` present → `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` (Q2-A default); else `null`.
- No UA sniffing, no platform branching (Q2-A; Apple Maps explicitly out of scope unless the A14 default is overridden).
- No URI-encoding shortcuts: coordinates are plain decimals; `googleMapUrl` is used verbatim (it already contains any encoding).

**Verification**: a point with `googleMapUrl` + coords → Google button uses the stored URL; a point with coords only → both links are coordinate-based; a point with neither → both builders return `null` (quickstart S-07).

## Contract 5 — Shadcn Sheet primitive (`components/ui/sheet.tsx`, new)

- Standard shadcn `Sheet` implementation (Radix Dialog-based) with `SheetContent` supporting `side="bottom"`; no customization beyond the repo's token classes; matches the structure/style of the existing `components/ui/dialog.tsx`.
- Export set used: `Sheet`, `SheetTrigger` (unused in this feature), `SheetClose`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter` — with `aria-describedby={undefined}` on `SheetContent` when no description is shown (shadcn a11y convention).

## Contract 6 — Z-order & stacking (FR-018/FR-020)

- Sheet overlay/content: `z-index: 1001` (a single token-derived value: `calc(var(--z-overlay) + 1)` via arbitrary Tailwind value or inline token) — above sticky header (40), above 003's fullscreen map (1000), below sonner toasts (1100).
- Render position: `MapDetailSheet` is a sibling of the map wrapper inside `AccordionLocator`, **outside** `.map-isolate`; Radix portals to `body` by default.

## Cross-checks

- FR-005/FR-006 (buttons) → Contract 3.3 + Contract 4; FR-012 (no movement) → Contract 1; FR-013/FR-014 (handler isolation) → Contract 2; FR-017 (hide rule) → Contract 3.3/4; FR-020 (003 integration) → Contract 3.10; SC-003 (one outcome per tap) → Contract 2 verification row.
- Quickstart scenarios S-01…S-12 map 1:1 to these contracts.