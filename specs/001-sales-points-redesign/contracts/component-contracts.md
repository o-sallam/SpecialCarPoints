# Component Contracts: Sales Points Directory — UI/UX Redesign

This feature is a frontend redesign of one page; it exposes **no new external/API contracts**. The existing `/api/sales-points*` routes are **unchanged**. Data flows from the server component (`app/(public)/page.tsx`) to `AccordionLocator` via props, then down to children — that prop surface is the "contract" worth pinning so each task is unambiguous.

---

## Unchanged external contract

- **`GET /api/sales-points`** (and `/api/sales-points/[id]`): existing admin/list endpoints. **Not modified** by this feature. The public locator does not call these — it reads via `getPlaces()` server-side.

---

## Component prop contracts (internal, TypeScript)

### `AccordionLocator` (orchestrator — `components/public/AccordionLocator.tsx`)
Unchanged input; internal layout/state changes only.
```ts
interface Props { points: POSEntry[] }
// Internal state after redesign:
//   - REMOVED: query (search), searched (text-filter memo)
//   - KEPT:    category, view ('list'|'map'), userLocation, recenterSignal, selectedId
//   - location button stays in BOTH views (clarification Q1)
```

### `Hero` (NEW — `components/public/Hero.tsx`)
```ts
interface HeroProps {
  totalPoints: number   // live count, e.g. 55
  regionCount: number   // live count, e.g. 21 (groups.length)
  vipCount: number      // live count, e.g. 21
}
// Renders full-bleed (100vw) background image (next/image fill+priority) with gradient
// fallback behind it, scrim, and the existing badge + H1 + description copy (verbatim).
// Stat chips MUST reflect the live props — never hardcoded.
```

### `ViewToggle` → segmented control (refactored, same prop surface)
```ts
interface ViewToggleProps {
  view: 'list' | 'map'
  onChange: (v: 'list' | 'map') => void
}
// Contract preserved (drop-in replacement): role=tablist/tab/aria-selected,
// arrow-key + Enter/Space activation, sliding indicator, ≥44px segments, RTL-correct slide.
```

### `CategoryFilters` (unchanged prop surface)
```ts
interface Props {
  active: CategoryId            // 'all' | 'vip' | 'standard'
  total: number
  vipCount: number
  onChange: (id: CategoryId) => void
}
```

### `MapView` (clustering + theme tiles — same prop surface)
```ts
interface MapViewProps {
  points: MapPoint[]            // { _id, displayName, cityName, neighborhoodName, extraLabel, vip, googleMapUrl, lat, lng }
  selectedId: string | null
  onSelect: (id: string) => void
  userLocation?: { lat: number; lng: number } | null
  recenterSignal?: number
}
// Internally: markers wrapped in <MarkerClusterGroup>; tile layer becomes theme-aware
// (dark CARTO vs light OSM) via useActiveTheme(). Marker click → existing popup/onSelect.
```

### `Footer` (expanded — `components/public/Footer.tsx`)
```ts
// No props (self-contained). Contract: renders
//   - brand/about column (logo + about copy or TODO fallback)
//   - <SocialIcons links={{...placeholders}} />  // reuse existing component, placeholder props + TODO
//   - legal row (© Special Car {year}. جميع الحقوق محفوظة + specialcarsa.com link)
// "Quick links" column is OMITTED (no nav source).
```

### `useActiveTheme()` (NEW hook — `lib/hooks/use-active-theme.ts`)
```ts
function useActiveTheme(): 'light' | 'dark'
// Reads document.documentElement.dataset.theme; subscribes via MutationObserver.
// Used by MapView to swap tiles. (No next-themes — see research.md R4.)
```

---

## Behavioral contracts (must-not-regress)

- **Marker click**: opens the existing Leaflet popup + calls `onSelect(id)` (which selects + switches to map view). Clustering must not change this for individual markers.
- **Cluster click**: fits bounds to the cluster's markers (library default).
- **VIP distinction**: gold left-border + "VIP" text on cards; gold star on VIP map markers. Preserved in all hover/focus/active states — never reduced to color alone.
- **Theme**: every new/changed surface uses `var(--color-*)` tokens so it switches with `data-theme` automatically.
