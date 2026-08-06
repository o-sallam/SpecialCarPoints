# Feature Specification: Sales Points Directory — UI/UX Redesign

**Feature Branch**: `001-sales-points-redesign`

**Created**: 2026-08-06

**Status**: Draft

**Input**: User description: "Redesign of the Special Car sales-points directory (نقاط البيع) — Arabic RTL. Remove the toolbar search, redesign the List/Map toggle into an animated segmented control, rework the toolbar into a one-row (desktop) / two-row (mobile) responsive layout, add a full-width hero with live summary stats, add map marker clustering for the 55-points-across-21-regions dataset, expand the footer, and apply general UI/UX polish with accessibility and performance guarantees."

## Source artifacts & references

- **Detailed implementation specification**: the originating SpecKit document (this feature description) is the single source of truth for *how* each task is implemented. It defines the task order (T0 discovery → T7 footer), design tokens, per-feature implementation paths, accessibility/performance/testing requirements, and rollback strategy. It is preserved verbatim in the triggering request and should be consulted during `/speckit.plan` and `/speckit.tasks`.
- **Reference screenshots**: current mobile + desktop renders of the page (header, filter/search toolbar, List/Map toggle, region accordion list with عادي/VIP split, minimal footer).
- **Discovery note** (from the spec author's T0 intent) is reflected in the *Assumptions* section below, having been verified against this repository at spec-writing time.

## Clarifications

### Session 2026-08-06

- Q: Should the "use my location" button stay available in both List and Map views, or be scoped to Map view only? → A: Keep available in BOTH views, grouped with the filter-pills row in both breakpoints. Rationale: it drives list proximity-sorting (a conversion feature that serves the directory's core goal); gating it to Map-only would silently remove a working feature as a side effect of a visual redesign.
- Discovery-confirmed: Footer "Quick links" column is OMITTED — the site has no nav links to source it from (the header nav contains only the theme switcher).
- Discovery-confirmed: Footer social links reuse the existing `components/public/SocialIcons.tsx` component with placeholder props (no brand-level social URLs exist anywhere in the repo), rather than building a new icon set.
- Q: Are theme-aware map tiles (dark basemap in dark mode) in scope for the clustering task (T6), or deferred? → A: In scope for T6. Dark mode renders a CartoDB `dark_all` basemap, light mode keeps the existing OSM tiles, the tile layer switches live with the theme toggle, and correct attribution is preserved in both themes. Needs no new library (a conditional tile URL).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find the nearest point with fewer decisions (Priority: P1)

A prospective customer arrives on the directory wanting to locate a physical Special Car point to visit. They should be able to scan the page, filter by tier (الكل / VIP / عادي), and choose between a list or a map without friction. The current toolbar mixes a text search box with the filters and toggle, adding visual noise and decision load for a dataset that is already grouped by region. Simplifying the controls and tightening the layout lets the visitor reach their nearest point faster.

**Why this priority**: Conversion is the directory's primary business goal. Every removed decision and every clearer control directly increases the chance a visitor commits to visiting/contacting a point.

**Independent Test**: Open the directory on mobile and desktop, switch between الكل/VIP/عادي, and confirm the displayed counts and region groups update correctly and the layout has no visual gaps or leftover search UI. This delivers value even before the hero, clustering, and footer work land.

**Acceptance Scenarios**:

1. **Given** a visitor is on the directory, **When** the page loads, **Then** no search input, search icon, or search placeholder is present anywhere in the toolbar (fully removed, not hidden).
2. **Given** the visitor is filtering, **When** they toggle between الكل, VIP, and عادي, **Then** the point counts in the header summary always match the currently visible points and filtering still works (no orphaned search-text logic breaks it).
3. **Given** a desktop-width viewport, **When** the toolbar renders, **Then** the filter pills and the List/Map toggle sit on one horizontal row with no wrapping.
4. **Given** a mobile-width viewport, **When** the toolbar renders, **Then** the filter pills occupy their own row (horizontally scrollable if needed, not wrapping) and the List/Map toggle occupies a separate row below.

---

### User Story 2 - Switch views with a smooth, accessible control (Priority: P2)

A visitor switches between القائمة (List) and الخريطة (Map) to choose how they explore points. Today the toggle is a static two-segment pill that swaps color instantly. The redesign replaces it with a modern segmented control whose active indicator slides smoothly between segments, and which is fully operable by keyboard and screen reader.

**Why this priority**: The view switch is touched on every visit; a polished, accessible control reinforces brand quality and serves keyboard/assistive-tech users without exception.

**Independent Test**: With the mouse, click each segment and observe a sliding (not snapping) animation. With the keyboard, Tab to the toggle and use arrow keys + Enter/Space to change the view. This can be validated in isolation on the toggle component alone.

**Acceptance Scenarios**:

1. **Given** the toggle is focused via keyboard, **When** the visitor presses arrow keys, **Then** focus/selection moves between the two segments and Enter/Space activates the focused one.
2. **Given** either segment is active, **When** the visitor activates the other, **Then** the active background slides smoothly between segments (animated, not an instant snap) at a fluid frame rate.
3. **Given** an assistive-technology user navigates the toggle, **Then** it is announced as a two-option tab group with the current selection exposed via ARIA.
4. **Given** a touch device, **Then** each segment meets the minimum touch-target size and the slide direction respects the RTL reading direction.

---

### User Story 3 - A premium, informative first impression (Priority: P3)

Because the directory is often a visitor's first deep interaction with the brand, the page should open with a confident, full-width hero (background imagery, the existing eyebrow badge, heading, and description) plus compact summary stats (total points, regions, VIP points) drawn from live data. The page should close with a richer, well-spaced footer (about/brand, social links, legal). This makes the directory feel as premium as the VIP tier it advertises.

**Why this priority**: Trust and brand perception. A decorative-but-empty hero adds no functional value, so the hero earns its place by also surfacing the live summary counts; the footer expansion closes the experience on-brand.

**Independent Test**: Load the page and confirm the hero spans edge-to-edge while the toolbar/list below remain inside the normal content width, and that the stat chips show real numbers (not hardcoded). Scroll to the footer and confirm it has brand, social, and legal content with proper spacing.

**Acceptance Scenarios**:

1. **Given** any viewport width, **When** the page renders, **Then** the hero spans the full viewport width while the toolbar and list below remain constrained inside the existing content width container.
2. **Given** the hero is visible, **Then** it shows the existing eyebrow badge, heading, and description copy verbatim, over a legible scrim, with summary stat chips reflecting the real total/region/VIP counts.
3. **Given** no hero photo asset is supplied, **Then** a graceful gradient/solid fallback renders (never a broken-image icon) and a TODO marks the missing asset.
4. **Given** the footer, **Then** it contains a brand/about column, social links (real URLs where the brand already uses them, otherwise safe placeholders with a TODO), and the existing copyright/legal line, laid out in columns on desktop and stacked with generous spacing on mobile.

---

### User Story 4 - A map that handles 55 points without overwhelming (Priority: P3)

When a visitor switches to الخريطة (Map), dense cities (e.g. Riyadh's 12 points, Jeddah's 9) should not become an unreadable pile of overlapping markers. Markers should cluster at zoomed-out views and progressively decluster into individual markers as the visitor zooms in, down to every single marker at the maximum zoom. Interacting with a cluster zooms to its contents; interacting with a single marker triggers the same point-detail behavior as before.

**Why this priority**: Geographic self-service reduces support load. Clustering is what keeps the map usable at this dataset's scale, but it is isolated to the map view and lower-risk if deferred relative to the core discovery flow.

**Independent Test**: Switch to the map, observe dense areas render as a single count-bearing cluster, then zoom progressively into Riyadh until all 12 points are individual markers. This validates clustering independently of the toolbar/hero work.

**Acceptance Scenarios**:

1. **Given** a zoomed-out map, **When** it renders the full dataset, **Then** points in dense areas collapse into a single cluster marker showing the correct count.
2. **Given** a cluster is visible, **When** the visitor zooms in, **Then** it splits into smaller clusters and eventually individual markers, with every marker individual at the maximum zoom (verified over the densest region).
3. **Given** a cluster, **When** clicked, **Then** the map zooms/fits to that cluster's markers (default library behavior).
4. **Given** an individual marker, **When** clicked, **Then** the same detail interaction as before the change occurs (no regression).
5. **Given** the map switches are toggled rapidly, **Then** no marker-creation/teardown errors appear (mount/unmount cleanup is sound).

---

### User Story 5 - A polished, accessible experience on every device (Priority: P3)

Across the whole directory, interactive elements (cards, pills, buttons, accordion rows) should give clear hover/focus/active feedback with consistent motion, the region accordion should expand/collapse smoothly (not instantly), and everything must be reachable and operable by keyboard with visible focus indicators and adequate color contrast — in both light and dark themes.

**Why this priority**: Quality bar and accessibility compliance. It should land after the structural changes so polish is applied to the final structure, not the old one.

**Independent Test**: Tab through the entire toolbar and the first region row with a keyboard and confirm every interactive element shows a visible focus ring and behaves consistently. Hover cards/pills/buttons to confirm consistent feedback and motion.

**Acceptance Scenarios**:

1. **Given** a keyboard-only session, **When** tabbing through the toolbar and a region row, **Then** every interactive control is reachable in reading order with a visible focus indicator.
2. **Given** a multi-point region, **When** expanded/collapsed, **Then** the height animates smoothly (not an instant show/hide) and the chevron rotates.
3. **Given** any interactive element is hovered or focused, **Then** it shows consistent feedback (e.g. raised surface, subtle border shift, slight lift) using a single shared transition timing/easing.
4. **Given** both light and dark themes, **Then** all new and changed UI renders with adequate contrast and the VIP distinction (gold border + "VIP" text) is preserved (not reduced to color alone).

---

### Edge Cases

- **No hero image asset yet**: hero must fall back to a gradient/solid background and never show a broken image; a TODO is left for the business to supply a photo.
- **No existing social URLs found**: footer social icons render as safe placeholder links (not fabricated handles) with a TODO.
- **Geolocation denied / unavailable**: the "use my location" flow must degrade gracefully (the map/list remain fully usable); existing error messaging is preserved.
- **Empty filter result** (e.g. VIP filter with zero matches): the page's existing empty state continues to apply; no new empty states are added silently.
- **Very dense single city (Riyadh, 12 points)**: clustering must still reach all-individual markers at max zoom — the stress case.
- **Rapid List↔Map toggling**: marker mount/unmount must not throw or leak.
- **Resizing across the 768px breakpoint**: the toolbar must not visibly jump/shift between the one-row and two-row layouts.
- **RTL specifics**: the toggle slide direction and toolbar row alignment must be correct under RTL (the two areas most prone to break).

## Requirements *(mandatory)*

### Functional Requirements

**Simplification & layout**

- **FR-001**: The system MUST remove the toolbar text-search input, its icon, its placeholder, and all search-text-specific state/handlers/logic entirely (no hidden/disabled remnants). Shared filtering utilities used by other features (e.g. nearest-location logic) MUST remain functional.
- **FR-002**: On desktop (≥768px), the toolbar MUST present the tier-filter pills and the List/Map toggle on a single horizontal row without wrapping.
- **FR-003**: On mobile (<768px), the toolbar MUST present the tier-filter pills on their own row (horizontally scrollable if they do not fit, not wrapping) and the List/Map toggle on a separate row.
- **FR-004**: The "use my location" control MUST remain available in BOTH List and Map views and be grouped with the filter-pills row in both breakpoints (it drives list proximity-sorting and map recentering), behaving identically in both themes. It is NOT scoped to the Map view only.

**View toggle**

- **FR-005**: The List/Map control MUST be a two-segment control with an active-state indicator that slides smoothly between segments (animated transition), implemented so it does not re-mount/re-render the whole control on switch.
- **FR-006**: The List/Map control MUST be keyboard-operable (tab to focus, arrow keys to move selection, Enter/Space to activate) and expose the ARIA tab pattern (`tablist`/`tab`/`aria-selected`).
- **FR-007**: Each toggle segment MUST meet the minimum touch-target size on mobile, and the slide direction MUST respect RTL.

**Hero**

- **FR-008**: The hero MUST render full-viewport-width (edge-to-edge) above the toolbar, while the toolbar and everything below remain inside the existing content-width container (which is not widened).
- **FR-009**: The hero MUST reuse the existing eyebrow badge, heading, and description copy verbatim, over a legible scrim, with a bounded height appropriate for a utility/directory page (not a full-screen marketing hero).
- **FR-010**: The hero MUST include summary stat chips (e.g. total points, number of regions, VIP points) computed from live data — never hardcoded.
- **FR-011**: If no hero image asset exists, the hero MUST render a gradient/solid fallback (never a broken-image indicator) and leave a TODO for a real asset; where an image is used it MUST be delivered through the project's existing image convention with eager/above-the-fold loading and reserved layout space.

**Map clustering**

- **FR-012**: The map MUST cluster markers in dense areas at zoomed-out views and progressively decluster into smaller clusters, then individual markers, as the user zooms in — reaching all-individual markers at the maximum zoom.
- **FR-013**: The clustering MUST be implemented using the library matching the project's existing map provider (Leaflet), without introducing a second, competing map library. Within the same T6 change, map tiles MUST be theme-aware: dark mode renders a dark basemap (e.g. CartoDB `dark_all`), light mode keeps the existing OSM tiles, the tile layer switches live with the theme toggle, and correct attribution is preserved in both themes.
- **FR-014**: Clicking a cluster MUST zoom/fit to its markers; clicking an individual marker MUST trigger the pre-existing point-detail interaction (no regression).
- **FR-015**: Cluster markers MUST be styled on-brand (a circular badge in the primary accent with a white count) and MUST expose an accessible label conveying the count.

**Footer**

- **FR-016**: The footer MUST include a brand/about column (reusing the existing logo and any existing brand copy; a neutral fallback with a TODO if none exists), social links, and the existing copyright/legal line. Social links MUST reuse the existing `components/public/SocialIcons.tsx` component rendered with placeholder props (no brand-level social URLs exist in the repo) plus a TODO for real handles — no new icon set is built. The optional "Quick links" column is OMITTED (the site has no nav links to source it from).
- **FR-017**: The footer MUST render as a multi-column grid on desktop and a single stacked column with generous spacing on mobile, separated from the page content by a divider, with increased vertical padding versus the current minimal footer.
- **FR-018**: Real social links MUST open in a new tab safely; no social handles/URLs may be fabricated.

**Polish, accessibility & performance**

- **FR-019**: Cards, filter pills, buttons, and accordion headers MUST provide consistent hover/focus/active feedback and share a single transition timing/easing.
- **FR-020**: The region accordion MUST expand/collapse with a smooth height animation and a rotating chevron, rather than an instant show/hide.
- **FR-021**: All interactive controls MUST be reachable by keyboard in reading order with visible focus indicators (never relying on, nor removing without replacing, the default outline).
- **FR-022**: Color contrast MUST meet WCAG AA (body text ≥4.5:1; large text ≥3:1), including hero text over its scrim at all common widths; the VIP distinction MUST remain non-color-only (gold border + "VIP" text preserved).
- **FR-023**: The hero image MUST be delivered with reserved layout space (to avoid layout shift while loading) and eager/above-the-fold loading priority; the map MUST remain code-split so it is not loaded for visitors who only use the list view.
- **FR-024**: All animations that affect interaction smoothness MUST prefer GPU-friendly properties (transform/opacity) over layout-triggering properties where avoidable.

### Key Entities *(include if feature involves data)*

- **Sales Point (POSEntry)**: a physical sales location. Relevant attributes: identifier, city/region grouping, display name, VIP flag, latitude/longitude (for map + clustering), and contact links. Already sourced from the existing data layer and available client-side.
- **Region Group**: a city/region with its collection of sales points and an entry count — drives the accordion list and the header summary counts.
- **Map Cluster**: a transient, zoom-dependent grouping of nearby sales points shown as a single count-bearing marker; its count and bounds are derived from the points it contains.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can switch tier filters (الكل/VIP/عادي) and switch between List and Map with zero layout jumps and no leftover/broken search UI, on mobile and desktop.
- **SC-002**: Every interactive control on the directory is operable by keyboard alone, with a visible focus indicator on each, passing a keyboard-only walk-through of the toolbar and the first region row.
- **SC-003**: The map shows a single count-bearing cluster for dense areas at a country-level view and reaches 100% individual markers at the maximum zoom over the densest region — confirming usability across the full zoom range.
- **SC-004**: The hero and footer add no perceptible layout shift while loading (layout space is reserved), and the map code does not load for list-only visitors (verified by confirming the map bundle is split out).
- **SC-005**: The directory meets WCAG AA color contrast in both light and dark themes, including hero text over its background at 375px, 768px, and 1440px widths.
- **SC-006**: No new third-party libraries are added beyond the single map-clustering dependency matching the existing Leaflet-based map (no competing map library, no new UI kit, animation library, or icon library unless a genuine gap is documented).
- **SC-007**: The redesign is delivered as independently-revertible increments (one task per PR/commit), with the map-clustering change isolated so it can be rolled back without reverting unrelated UI polish.

## Assumptions

These were verified against this repository at spec-writing time and feed the implementation's T0 discovery task:

- **A1 — Next.js App Router + TypeScript: CONFIRMED.** The app uses the App Router (`app/` directory), Next.js 14, React 18, TypeScript. (Locator is rendered on the home page `app/(public)/page.tsx` → `AccordionLocator`; the `/sales-points` route is a permanent redirect to `/`.)
- **A2 — Tailwind CSS: CONFIRMED.** `tailwind.config.ts` with a token system in `app/globals.css`. Relevant tokens already exist and should be reused rather than re-created: `--color-primary` (blue), `--color-accent` (gold/amber — already serves the VIP/gold role), `--color-surface`/`--color-surface-raised`, `--color-text`/`--color-text-secondary`, `--radius-*` scale, and motion tokens `--duration`/`--ease`/`--ease-out`. (The implementation spec's proposed `--accent-primary`/`--accent-vip` map to these existing tokens.)
- **A3 — Component library: ASSUMPTION CORRECTED — shadcn/ui + Radix ARE present.** The repo has shadcn primitives (`components/ui/*`) and Radix dependencies, including existing `accordion`, `tabs`, `button`, `badge`, and `switch`. Per the fallback rule, the redesign MUST extend these existing primitives rather than create bespoke equivalents, while preserving the spec's visual/behavioral requirements.
- **A4 — Map library: CONFIRMED as Leaflet (Path B).** Dependencies are `leaflet@^1.9.4` and `react-leaflet@^4.2.1`; the map view is `components/public/MapView.tsx`. Clustering MUST use a Leaflet-compatible solution (e.g. `leaflet.markercluster` with a current React wrapper) — NOT Google Maps, and NOT a second competing map library. Current tiles are light OpenStreetMap (`{s}.tile.openstreetmap.org`) rendered in both themes; T6 makes them theme-aware per FR-013.
- **A5 — Theme toggle: CONFIRMED.** `next-themes` with Tailwind `darkMode: 'class'`; the sun-icon toggle is `components/public/ThemeSwitcher.tsx`. BOTH light and dark themes are supported (the directory must be verified in both), driven by the existing class strategy and CSS variables.
- **Data source & fields: CONFIRMED.** Points come from MongoDB via `lib/data/places`; the `POSEntry` shape includes `lat`, `lng`, and `vip`, all available client-side — so clustering has the coordinates it needs with no schema change.
- **Map code-splitting: ALREADY IN PLACE.** `MapView` is already dynamically imported with `ssr: false` in `AccordionLocator`, satisfying the "don't load the map for list-only visitors" performance requirement.
- **Icons: a library is present (`lucide-react`)**, so no new icon library should be added; footer/hero icons should reuse inline SVGs or `lucide-react`.
- **Testing infra: not yet established for this feature surface.** No Jest/Vitest component tests or Playwright/Cypress E2E were found for the public directory; per the spec, no new testing framework is introduced speculatively — manual verification (375px / 768px / 1440px, keyboard, both themes, RTL) is the minimum bar, and adding test infrastructure is a flagged follow-up rather than in-scope.
- **Constitution**: `.specify/memory/constitution.md` is still in its unfilled template form (no project-specific governance constraints), so no additional governance rules apply beyond this spec.

## Suggested follow-ups (explicitly out of scope)

- Persist the selected List/Map view across refresh (localStorage/URL) — do not add speculatively.
- Auto-sort the region list by proximity once location is granted (beyond the current nearest-region reordering).
- Add missing empty/loading/error and geolocation-denied states beyond what exists today.
- Introduce automated component/E2E test infrastructure for this feature.
- Supply a real hero photograph / branded map graphic (business asset dependency).
