# Data Model: Map UI Mobile Improvements (Full-Bleed + Expand/Minimize)

**Branch**: `003-map-mobile-ui` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Overview

This feature introduces **no persisted data, no schema changes, and no API/backend involvement**. Every entity below is transient client-side UI state living in `AccordionLocator` (the page orchestrator) or inside `MapView`'s existing imperative Leaflet refs. The BSON `SalesPoint`/`POSEntry` documents are untouched — the only data consumed is what feature 001 already exposes (`_id`, `lat`, `lng`, `vip`, display fields).

## Entities

### 1. Map View State (transient, per-visit)

Represents the map's display mode and the page position captured at expansion (spec Key Entities).

| Field | Type | Description | Validation / Notes |
|-------|------|-------------|--------------------|
| `mode` | `'normal' \| 'fullscreen'` | Display mode of the map | Transitions: `normal → fullscreen` (Expand button or programmatic), `fullscreen → normal` (Minimize button, back gesture, or page unmount). Idempotent — re-triggering the current mode is a no-op (rapid-tap edge case). |
| `capturedScrollY` | `number` (px) | `window.scrollY` at the moment of expansion | Captured before the fullscreen class swap; used verbatim for restore (SC-003 ±10px). Discarded on minimize. |
| `historyEntry` | `{ scMap: 'expanded' } \| null` | The single `history.pushState` entry created on expand | Exactly one per expand; consumed by the `popstate` handler on minimize; `null` in normal mode. |

**State machine**

```text
                  Expand (mobile <768px, mode=normal)
   ┌──────────┐   + pushState + capture scrollY + body scroll lock   ┌──────────────┐
   │  NORMAL  │ ───────────────────────────────────────────────────▶ │  FULLSCREEN  │
   │          │ ◀─────────────────────────────────────────────────── │              │
   └──────────┘   Minimize (button) / back gesture (popstate)        └──────────────┘
                     + pop history entry + restore scrollY + unlock body
```

**Invariants** (from FRs):
- `mode = 'fullscreen'` ⇒ body scroll locked (FR-009) and exactly one history entry exists (FR-011).
- `mode = 'normal'` ⇒ no history entry from this feature exists; scroll position == position before expand (FR-006).
- Navigation away from the page resets all state (FR-015) — enforced by component unmount and the `useScrollLock` cleanup contract.
- Rotation does **not** reset `mode`; fullscreen persists across orientation changes (FR-014), and Minimize remains visible at any width.
- The Leaflet `mapRef` instance outlives both modes — container size changes, not the map, are what transitions alter (FR-016).

### 2. Expand / Minimize Controls (transient UI)

| Field | Type | Description | Rules |
|-------|------|-------------|-------|
| `Expand` | button | Overlay on the map, normal mode | Rendered iff `useIsMobile() && mode === 'normal'` (FR-012). `aria-label="تكبير الخريطة"`, ≥44×44px, `type="button"` (FR-007). |
| `Minimize` | button | Overlay on the map, fullscreen mode | Rendered iff `mode === 'fullscreen'` at **any** viewport width (rotation safety, FR-005/FR-014). `aria-label="تصغير الخريطة"` (FR-007). |

### 3. Map instance concerns (inside `MapView`, unchanged ownership)

- `mapRef: L.Map` — imperative Leaflet instance; **not** remounted across transitions (plan R1). Receives `invalidateSize()` after container size changes driven by the new `resizeSignal` prop and a rAF-throttled `window.resize` listener (plan R2, FR-008/FR-014).
- Finder state (`markersRef`, `clusterRef`, `tileRef`, `userMarkerRef`) and the open popup (the feature-001 "detail bottom sheet" surface) — untouched by transitions; popup survives minimize (FR-017) because the instance and its markers persist.

## Relationships

- **Map View State → Controls**: mode determines which control renders (invariant table above).
- **Map View State → MapView**: `mode` transitions bump `resizeSignal`, which MapView consumes to invalidate tile bounds (FR-008).
- **Map View State → Popup ("bottom sheet")**: no coupling — the popup is Leaflet-internal and independent of fullscreen mode (FR-010/FR-013/FR-017); `handleSelect` is not modified.

## Non-Changes (explicitly out of scope)

- `SalesPoint` / `POSEntry` documents and Zod validation: **unchanged**.
- `app/globals.css` token scale: **unchanged** (existing `--space-4`, `--radius-*`, `--z-overlay` suffice).
- No localStorage/sessionStorage persistence — fullscreen state is per-visit (FR-015).