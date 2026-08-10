# Implementation Plan: Sales Point Detail Sheet (Map View)

**Branch**: `004-sales-point-map-modal` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-sales-point-map-modal/spec.md`

## Summary

Add a mobile-first sales point **detail bottom sheet** to the Map View, replacing the popup as the detail surface for **map marker taps**: the sheet slides up from the bottom, follows the site's token-based design system, and is built on the **shadcn Sheet primitive** (Radix Dialog — `@radix-ui/react-dialog@1.1.23` already in `package.json`, so **zero new dependencies**). Tapping an individual marker opens the sheet **without any map movement** (fixes the perceived cluster-zoom/unwanted-zoom defect: the old `selectedId` effect force-`flyTo(zoom 14)`/re-centered/re-opened the popup on every tap — a click at zoom ≥14 zoomed *out*; the amendment's handler-separation is implemented as explicit propagation control per FR-013/FR-014). Cluster behavior is untouched (FR-011). The sheet shows the same name/location/VIP rendering as List View (`displayName` + `{cityName} • حي {neighborhoodName}`), offers **Directions** (universal Google Maps `dir` link — Q2-A default) and **Go to Google Maps** (existing `googleMapUrl`, else coords — hidden when neither exists), and is dismissible by swipe-down (custom pointer gesture), backdrop tap, close button, and Escape, with marker highlight cleared on close. Selection gets a **source origin flag** (`'map' | 'list'`): map taps open the sheet with no map movement; List View keeps today's popup+flyTo behavior unchanged (spec A2). The same sheet renders on all viewports (Q1-A default). Fully usable over feature 003's fullscreen map (FR-020, cross-feature contract). Delivered in independently revertible increments; the click-handler separation lands as its own isolated change.

## Technical Context

**Language/Version**: TypeScript 5.4, React 18, Next.js 14.2 (App Router), Node ≥18.

**Primary Dependencies** (all already present — **zero new dependencies**, spec A13/A7 note):
- `leaflet@1.9.4` + `leaflet.markercluster@1.5.3` — `MapView.tsx` (imperative Leaflet; clustering with `zoomToBoundsOnClick` defaults — **unchanged**).
- `@radix-ui/react-dialog@^1.1.23` — already installed (used by `components/ui/dialog.tsx`); the shadcn **Sheet** primitive (standard shadcn code, Radix Dialog-based) is added as `components/ui/sheet.tsx` — satisfies the user's explicit "use shadcn/ui" requirement with no new package.
- `tailwindcss-animate` (`animate-in/out` classes used by shadcn) — already present (Dialog overlay uses them).
- `lucide-react` (icons: `X`, `Navigation`, `MapPin`, `ExternalLink`) — reuse.
- Tokens in `app/globals.css`: `--color-*` (text/surface/primary/accent/border), `--radius-*`, `--duration`/`--ease` (sheet animation), z-scale `--z-dropdown: 50 | --z-overlay: 1000 | --z-toast: 1100`.

**Storage**: None. `POSEntry` (server data, already client-side via `lib/points.ts`/`lib/types.ts`) provides `displayName`, `cityName`, `neighborhoodName`, `extraLabel`, `vip`, `googleMapUrl`, `lat`, `lng`. No schema, API, or validation changes.

**Testing**: No automated test runner in the repo (consistent with features 001–003 — **do not introduce one**). Manual verification is the bar per [quickstart.md](./quickstart.md).

**Target Platform**: Web, modern evergreen browsers; Arabic `dir="rtl"`; mobile-first (375px primary, desktop/tablet secondary). Real-device testing for swipe gesture and external-app links.

**Project Type**: Web application (Next.js App Router, single repo; `MapView` already code-split via `next/dynamic({ ssr: false })`).

**Performance Goals**: Sheet opens in **<300 ms** (transform-based slide, `--duration`/`--ease` tokens — SC-001); marker taps cause **zero map movement** (no flyTo/pan/zoom on the map-origin path — SC-001/SC-003); swipe-down drag stays on the compositor (transform only); Radix focus management without jank.

**Constraints**:
- **shadcn/ui only**: the sheet is the shadcn `Sheet` primitive (+ `SheetContent side="bottom"`), themed exclusively with existing `var(--color-*)`/`var(--radius-*)` tokens and `cn()` — no bespoke modal, no new UI kit (spec FR-002, A7).
- **Click separation (FR-013/FR-014)**: individual-marker click handler sets `L.DomEvent.stopPropagation(e.originalEvent)` and markers are created with `bubblingMouseEvents: false`; the cluster plugin's zoom-on-click remains cluster-only; the map-origin path never calls `flyTo`/`openPopup`/`fitBounds` (FR-012, scenario 10). The old `selectedId` effect's flyTo+popup is retained **only** for list-origin selections (spec A2) via a new `selectionOrigin` state.
- **Origin flag**: `handleSelect(id, origin)` — `'map'` from `MapView` marker clicks (sheet, no movement), `'list'` from cards (current popup+flyTo behavior, no sheet). The sheet opens only for `origin === 'map'` selections.
- **Destinations (FR-015/FR-016/FR-017)**: "Go to Google Maps" = existing `googleMapUrl` when present, else coords-based link; "Directions" = universal `https://www.google.com/maps/dir/?api=1&destination=lat,lng` (Q2-A default); both hidden when neither `googleMapUrl` nor `lat/lng` exists; `target="_blank" rel="noopener"`.
- **Same sheet on all viewports (FR-019, Q1-A default)**: no viewport branching for the sheet itself.
- **Z-order (FR-018/FR-020)**: sheet overlay sits above the fullscreen map (`--z-overlay` 1000) and below toasts (`--z-toast` 1100) — target `z-[(--z-overlay+1)=1001]` via an inline token-safe value; the sheet is rendered by `AccordionLocator` **outside** the `.map-isolate` stacking context.
- **Dismiss (FR-007)**: swipe-down (custom pointerdown/move/up drag with threshold + friction + spring-back; close control always available as fallback), backdrop tap (Radix `onOpenChange`), Escape (Radix built-in), close button (`aria-label="إغلاق"`).
- **List View unchanged (A2)**: `EntryCard`/`RegionGroup` select paths untouched; `flyTo`+popup retained for list-originated selections.
- **Clustering untouched (FR-011)**: only click-handling separation changes; cluster rendering, count badge, and zoom-to-bounds stay as shipped.
- **RTL**: sheet positioning (`side="bottom"` is direction-agnostic), text alignment, and icons honor `dir="rtl"`.
- **Theme**: tokens only — no theme work; `useActiveTheme` already handles map tiles.

**Scale/Scope**: One page (home locator). Modified: `components/public/AccordionLocator.tsx` (origin state, sheet mount, handleSelect), `components/public/MapView.tsx` (click propagation, selectedId effect split, onSelect signature). New: `components/ui/sheet.tsx` (shadcn Sheet), `components/public/MapDetailSheet.tsx` (sheet UI: content, swipe, buttons), `lib/maps.ts` (link builders: directions/googleMaps URLs). ~55-point dataset unchanged.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is in **unfilled template form** (all placeholders) — no project-specific governance principles or gates exist to enforce. Sensible defaults apply — **simplicity / least-architectural-change / reuse existing conventions** (same reading as features 001–003).

**Gate result: PASS** — no constitution gates to violate; no Complexity Tracking entries required. (Re-checked post-design: **still PASS** — the design adds one standard shadcn primitive file, one new presentational component, one small pure util module, and modifies two existing components — **zero new dependencies**.)

## Project Structure

### Documentation (this feature)

```text
specs/004-sales-point-map-modal/
├── plan.md                            # This file
├── research.md                        # Phase 0 decisions (sheet primitive, click separation, origin flag, destinations, z-order, swipe)
├── data-model.md                      # Transient selection state (no persistence, no schema changes)
├── contracts/
│   └── component-contracts.md         # MapView onSelect change, MapDetailSheet props, link builders, z-order
├── quickstart.md                      # Manual validation runbook (FR-by-FR)
├── checklists/
│   └── requirements.md                # Spec quality checklist (failing only on 2 defaulted clarifications — now resolved)
└── tasks.md                           # /speckit.tasks output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
components/
├── ui/
│   └── sheet.tsx                      # NEW: standard shadcn Sheet primitive (Radix Dialog-based; side="bottom" used)
└── public/
    ├── AccordionLocator.tsx           # MODIFIED:
    │                                  #   - selectionOrigin state ('map' | 'list') + handleSelect(id, origin)
    │                                  #   - derive selected point from `visible`; clear selection if it leaves the filter set
    │                                  #   - render <MapDetailSheet/> when map-origin selection is active
    │                                  #   - pass origin through to MapView's onSelect wiring
    ├── MapView.tsx                    # MODIFIED (click-behavior only, no renderer changes):
    │                                  #   - marker click: L.DomEvent.stopPropagation + onSelect(id, 'map');
    │                                  #     markers created with bubblingMouseEvents: false
    │                                  #   - selectedId effect split: list-origin → flyTo+openPopup (today);
    │                                  #     map-origin → NO map movement, no popup
    │                                  #   - cluster group untouched (rendering + zoom-to-bounds)
    ├── MapDetailSheet.tsx             # NEW: shadcn Sheet (side="bottom") with:
    │                                  #   - name line (displayName) + VIP badge, location line (city • حي neighborhood /
    │                                  #     extraLabel fallback) — matches EntryCard rendering
    │                                  #   - Directions + Go to Google Maps buttons (hidden when no destination data)
    │                                  #   - swipe-down dismiss gesture; close button; open/closed animation
    └── EntryCard.tsx / RegionGroup.tsx  # unchanged (list-origin select paths)
lib/
├── maps.ts                            # NEW: pure link builders — googleMapsLink(point) | directionsLink(point) | null
└── hooks/                             # reuse: use-active-theme (map), use-scroll-lock (003 — not needed here; Radix locks scroll)
```

**Structure Decision**: Single project (existing Next.js app). No routes, no API, no new packages. The sheet is a presentational component owned by the locator; URL-building is a pure util (unit-testable later if a runner ever lands); MapView's change surface is confined to click handling.

**Suggested delivery increments** (for `/speckit.tasks`, each an isolated PR/commit):
1. **Sheet primitive + component** — `components/ui/sheet.tsx` + `MapDetailSheet.tsx` + static content driven by `selectedId` (opens for any existing selection; FR-001…FR-010 surface, sans origin split).
2. **Click separation + origin flag** — `MapView.tsx` handler isolation + `selectionOrigin` (FR-011…FR-014; the defect fix — highest-risk, isolated).
3. **Destinations** — `lib/maps.ts` builders + buttons wiring + hide rule (FR-015…FR-018).
4. **Robustness & cross-feature** — rotation/overflow checks, fullscreen-map overlay (003) verification, keyboard pass (FR-019…FR-023).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

None — no constitution violations. `lib/maps.ts` and the two new components are standard single-purpose additions, not architectural constructs.