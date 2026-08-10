# Data Model: Sales Point Detail Sheet (Map View)

**Branch**: `004-sales-point-map-modal` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Overview

**No persisted data, no schema changes, no API/backend involvement.** All entities are transient client-side state in `AccordionLocator` (selection) or derived data in `MapDetailSheet`/`lib/maps.ts`. The `POSEntry` document (already exposed client-side to the map as `MapPoint`) is consumed read-only.

## Entities

### 1. Selection State (transient, per-visit)

| Field | Type | Description | Rules |
|-------|------|-------------|-------|
| `selectedId` | `string \| null` | The currently selected sales point `_id` | Toggles on re-tap of the same id (existing semantics, FR-008). Cleared by all dismissal paths (FR-007) and when the point leaves the filtered set (research R9). |
| `selectionOrigin` | `'map' \| 'list'` | How the selection was made | `'map'` → bottom sheet opens, NO map movement, no popup (FR-012). `'list'` → today's flyTo + popup + highlight, no sheet (spec A2). |
| `sheetOpen` (derived) | `boolean` | `selectedId != null && selectionOrigin === 'map'` | Never stored; derived each render. |

**State machine**

```text
  map marker tap ──────────▶ selectedId=id, origin='map' ──▶ SHEET OPEN (no map movement)
  list card tap ───────────▶ selectedId=id, origin='list' ─▶ POPUP + flyTo (unchanged, no sheet)

  SHEET OPEN:
    tap same marker ───────▶ selectedId=null (toggle close, highlight cleared — FR-008)
    tap different marker ──▶ selectedId=B, origin='map' (content swaps in place — FR-009)
    swipe down / backdrop / close / Esc ──▶ selectedId=null (FR-007)
    cluster tap ───────────▶ zoom occurs; selection unchanged (FR-023)
    filter change hides point ──▶ selectedId=null (research R9)
    page navigation ───────▶ state resets (per-visit)
```

**Invariants**:
- `origin === 'map'` ⇒ map center/zoom unchanged by the selection (FR-012, scenario 10).
- `origin === 'list'` ⇒ popup/flyTo behave exactly as shipped (no regression).
- Sheet open ⇒ exactly one sales point highlighted; close ⇒ highlight cleared (FR-007/FR-008).
- Rapid taps: exactly one outcome per tap; final state == last tap's outcome (no queued effects).

### 2. Sheet Content (derived from the selected POSEntry)

| Field | Source | Rendering contract |
|-------|--------|--------------------|
| Title | `displayName` | Same as `EntryCard` title (bold, token colors) — FR-003 |
| VIP badge | `vip` | Same pill/badge as `EntryCard` (`--color-accent-soft`) — FR-004 |
| Location line | `cityName` + `neighborhoodName` \| `extraLabel` | `{cityName} • حي {neighborhoodName}` or `• {extraLabel}` fallback — byte-identical to `EntryCard` (FR-003/FR-004) |

### 3. Destination Links (derived, nullable — `lib/maps.ts`)

| Link | Derivation | Null when |
|------|-----------|-----------|
| `googleMapsLink` | `googleMapUrl` if non-empty, else `https://www.google.com/maps?q=${lat},${lng}` | `lat`/`lng` null AND `googleMapUrl` empty → both buttons hidden (FR-017) |
| `directionsLink` | `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` (Q2-A default) | same null condition |

Both links open `target="_blank" rel="noopener"` (FR-018). No Place ID exists in the data model (spec A3).

## Relationships

- **Selection State → MapView**: `selectedId` drives marker highlight (accent pin, z-offset) in all origins; `selectionOrigin === 'map'` suppresses the flyTo/popup effect (research R2).
- **Selection State → MapDetailSheet**: sheet renders iff derived `sheetOpen`; content derives from the selected `POSEntry`.
- **MapDetailSheet → Destination Links**: buttons render iff the corresponding link is non-null (FR-017).
- **Selection State → Cluster layer**: no coupling — cluster clicks never touch selection (FR-023); individual marker clicks are propagation-isolated from the cluster group (FR-013/FR-014).

## Non-Changes (explicitly out of scope)

- `POSEntry`/`SalesPoint` documents, Zod validation, API routes: **unchanged**.
- `leaflet.markercluster` configuration (rendering, counts, zoom-to-bounds): **unchanged** (FR-011).
- List View (`EntryCard`, `RegionGroup`) and its popup/flyTo behavior: **unchanged** (A2).
- No localStorage/sessionStorage — selection is per-visit and never persisted.