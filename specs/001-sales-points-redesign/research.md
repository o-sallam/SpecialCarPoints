# Research: Sales Points Directory — UI/UX Redesign

**Phase 0 output.** Resolves every technical decision and SPEC-DEVIATION surfaced during discovery. Each item: Decision → Rationale → Alternatives considered.

---

## R1. Map clustering library (Leaflet / react-leaflet v4)

**Decision**: Add `leaflet.markercluster` + `react-leaflet-cluster` and wrap the existing marker list in `<MarkerClusterGroup>`. Verify the wrapper installs cleanly against `react-leaflet@4.2.1`; if it does not, fall back to a thin custom hook (~50 LOC) calling `leaflet.markercluster` directly.

**Rationale**: The project already uses Leaflet + react-leaflet (`MapView.tsx`). react-leaflet **v4** is a breaking-change major (removed `MapContainer` children-as-render-props quirks, changed context model), so older wrappers like `react-leaflet-markercluster` (react-leaflet v3 era) often break. `react-leaflet-cluster` declares react-leaflet v4 peer compatibility. The underlying `leaflet.markercluster` is the canonical, stable engine in both cases.

**Alternatives considered**:
- `@googlemaps/markerclusterer` / Google Maps — rejected: would introduce a **second, competing** map provider (spec A4 / FR-013 forbid this).
- MapLibre built-in clustering — rejected: project is Leaflet, not MapLibre (migration is out of scope and high-risk).
- Hand-rolled clustering math — rejected: spec §3.5 explicitly forbids it ("do not hand-roll clustering math").

**Cluster styling**: circular badge in `var(--color-primary)` with white count (visual parity with the list count pills). Attach `title`/`aria-label` like "12 نقطة بيع في هذه المنطقة" for a11y (FR-015). Keep default SuperCluster-style zoom-based declustering; only tune `maxZoom`/`radius` if Riyadh (12 pts) looks broken at street level. **Try/catch** the clusterer init with a fallback to rendering plain markers (rollback safety, spec §10/T6).

---

## R2. Theme-aware map tiles (dark mode)

**Decision**: Make the tile layer theme-aware inside the same T6 change. Dark mode → CARTO dark basemap (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`, attribution `&copy; OpenStreetMap &copy; CARTO`); light mode → keep existing OSM tiles. Swap the tile layer live when the theme changes.

**Rationale**: Current `MapView` renders **light OSM tiles in both themes** — the single largest bright surface in an otherwise-dark redesign, which undercuts the whole effort. Switching is a config change (conditional tile URL + attribution) needing **no new library**. CARTO dark basemaps are free under OSM/CARTO attribution and pair visually with the dark `--color-*` tokens.

**Theme reactivity**: Because there is no `next-themes` context (see R4), add a small `useActiveTheme()` hook (`lib/hooks/use-active-theme.ts`) that reads `document.documentElement.dataset.theme` and observes it via `MutationObserver`; `MapView` re-creates/swaps the tile layer when it flips. (Alternatively subscribe to a custom event emitted by `ThemeSwitcher`, but MutationObserver is more robust to future toggle changes.)

**Alternatives considered**:
- CSS `filter: invert(1) hue-rotate(180°)` on the tile pane — rejected: distorts marker colors/popups and harms attribution legibility.
- Keep light tiles, defer theming — rejected by clarification Q2 (theme-aware tiles are in scope for T6).

---

## R3. List/Map toggle → animated segmented control

**Decision**: Enhance the **existing custom** `ViewToggle` (inside `AccordionLocator.tsx`, already `role=tablist`/`tab`/`aria-selected`) with an absolutely-positioned sliding indicator `div` animated via `transform: translateX()` within a relatively-positioned track. Do **not** migrate to shadcn/Radix `Tabs`.

**Rationale**: Radix `Tabs` (available in `components/ui/tabs.tsx`) has no built-in sliding indicator; wiring one in fights its layout model. The current custom toggle already has correct ARIA + semantics, so the lowest-risk change is to add the indicator. Use `transform` (GPU-friendly) and logical/RTL-aware positioning: with `dir=rtl`, index 0 (القائمة) sits on the right — compute the indicator offset from the active index and flip the sign for RTL, or use `inset-inline-start` percentages. Each segment ≥44×44px. Do not re-mount the control on switch (no layout thrash).

**Alternatives considered**:
- shadcn `Tabs` + custom indicator overlay — rejected (fights Radix layout, more code).
- Re-mounting per active state — rejected (flash/layout thrash; spec §3.2 forbids).

---

## R4. Theme mechanism — SPEC-DEVIATION from assumption A5

**Decision**: Do **not** introduce or rely on `next-themes`. Use the existing manual mechanism: a `useActiveTheme()` hook reading `html[data-theme]` for the rare JS-reactive needs (map tiles); otherwise rely purely on CSS `var(--color-*)` tokens which already switch under `[data-theme='dark']`. Leave `// SPEC-DEVIATION:` comments wherever code/the spec assumed `next-themes`.

**Rationale (discovery)**:
- `next-themes` is in `package.json` but **imported nowhere** (grep finds no `ThemeProvider`).
- `app/layout.tsx` injects an inline `<script>` that reads `localStorage["theme"]` (defaulting to `prefers-color-scheme: dark`) and sets **both** `documentElement.classList` (`dark`) **and** `documentElement.setAttribute('data-theme', …)`.
- `components/public/ThemeSwitcher.tsx` writes the same: `localStorage.setItem('theme', …)` + `classList.toggle('dark', next)` + `setAttribute('data-theme', …)`.
- `app/globals.css`: custom `--color-*` tokens switch under `[data-theme='dark']`; shadcn bare tokens (`--background`, `--primary`, …) switch under `.dark`; Tailwind `dark:` variant uses `darkMode: 'class'`. All three flip together because the inline script sets both attributes.

**Implication**: New components styled with `var(--color-*)` automatically support both themes — **do not hardcode hex** and **do not depend on `dark:` utility classes for custom component colors** (those target shadcn tokens). `ThemeSwitcher` and the toggle behavior are untouched.

---

## R5. Hero image handling

**Decision**: Use `next/image` with `fill` + `priority` for the hero (LCP-relevant; `next.config.js` already permits remote patterns). Render a gradient/solid fallback `div` **behind** the image so a missing/slow asset never shows a broken-image icon and never causes CLS. Reserve layout space with `min-h-[320px] md:min-h-[420px]`. Source the asset from `public/images/hero/sales-points-hero.jpg`; since **no asset exists yet**, ship the gradient fallback first and leave `// TODO: replace with real hero image`.

**Rationale**: Project supports `next/image` (config + Toaster imply modern Next usage); the logo currently uses raw `<img>` but that is not a reason to avoid `next/image` for the LCP hero. A reserved-height, fallback-backed hero satisfies FR-008–FR-011 and the §8 LCP/CLS requirements.

**Alternatives considered**:
- Raw `<img>` — rejected (worse LCP/optimization; `next/image` is available and better for above-the-fold).
- CSS `background-image` — acceptable but loses Next image optimization; prefer `next/image fill`.

---

## R6. Accordion behavior after search removal (and "already animated" finding)

**Decision**: The region accordion (`RegionGroup.tsx`) **already** animates height smoothly via the CSS grid-rows trick (`grid-template-rows: 0fr → 1fr` + `transition-[grid-template-rows]`) and the chevron already rotates 180° — so T5's accordion-animation requirement is largely **already satisfied**. T5 only needs to (a) confirm the shared `--duration`/`--ease` tokens are used (they are) and (b) add a visible focus ring to the header button.

After search removal, `defaultOpen={searching}` becomes always-`false` → **no region auto-opens** (current non-search behavior). **Keep all regions collapsed by default.** (Auto-opening the busiest region for discoverability is a possible follow-up; default = collapsed, matching today.)

**Rationale**: Avoids redundant reimplementation; respects the spec's "don't redesign a thing that isn't broken." Recording the default-open change prevents a silent UX shift.

---

## R7. shadcn primitives vs. custom components

**Decision**: Extend existing components/custom styling; reach for shadcn primitives only where one already matches a need (e.g., `Badge` could back a stat chip, `Separator` for footer divider). Do **not** force shadcn where the page's bespoke styling is the convention (cards, pills, toggle are custom and should stay custom).

**Rationale**: Assumption A3 was corrected — shadcn/Radix are present, so the fallback rule is "extend, don't duplicate." But the directory's components are intentionally bespoke; wholesale migration is out of scope and risky.

---

## R8. Data source & fields (confirms no backend work)

**Decision**: No data-model or API changes. `POSEntry` (`lib/points.ts`) already carries `lat`, `lng`, `vip` (all client-available via server-component props). Clustering consumes the same `points` array already passed to `MapView`.

**Rationale**: Discovery in `app/(public)/page.tsx` + `lib/points.ts` + `lib/data/places.ts` confirms the shape. The `/api/sales-points` route is unchanged by this feature.
