# Feature Specification: Sales Point Detail Modal (Map View)

**Feature Branch**: `004-sales-point-map-modal`

**Created**: 2026-08-11

**Status**: Draft

**Input**: User description: "In the current Next.js application for displaying sales points, each sales point is a concatenation of the neighborhood name and the city name. The page currently supports two display modes: map view and list view. In map view, when a sales point is selected, a modal should appear from the bottom on mobile devices, as the website is designed with a mobile-first approach and primarily targets mobile users. The modal should follow the website's existing style and use shadcn/ui, which is already being used in the current application. It should display the information of the selected sales point from the bottom with a simple animation, including buttons such as Directions or Go to Google Maps."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Bottom sheet with sales point details (Priority: P1)

A mobile visitor taps a sales point marker on the map and sees its details slide up from the bottom of the screen in a sheet styled like the rest of the website. The sheet replaces the current popup as the detail surface for marker taps: it shows the same name, city/neighborhood line, and VIP status rendered exactly as in List View, highlights the tapped marker, and can be dismissed by swiping down, tapping outside, or its close control — which also clears the marker highlight. Tapping a different marker swaps the sheet's content in place, and tapping the same marker toggles it closed.

**Why this priority**: This is the headline interaction the user asked for — a mobile-first, on-brand detail surface — and it delivers value as soon as the sheet can open and close.

**Independent Test**: On a mobile viewport in Map View, tap any non-clustered marker: the sheet slides up with that point's details, the map does not zoom or pan, and the marker is highlighted. Swipe down / tap outside / tap the close control: the sheet closes and the highlight clears. Tap a second marker without closing: the content switches. This is testable without the Directions buttons or the desktop behavior.

**Acceptance Scenarios**:

1. **Given** a user is on the Map View on a mobile device, **When** the user taps a sales point marker, **Then** a bottom sheet animates up from the bottom of the screen displaying that sales point's details.
2. **Given** the bottom sheet is open, **When** the user swipes it down, taps outside it, or taps its close control, **Then** the bottom sheet closes and the associated marker's highlight state is cleared.
3. **Given** the bottom sheet is open for Sales Point A, **When** the user taps a different marker (Sales Point B), **Then** the sheet updates to show Sales Point B's details without requiring a manual close/reopen.
4. **Given** the bottom sheet is open for a sales point, **When** the user taps the same marker again, **Then** the sheet closes (mirroring the existing selection-toggle behavior).
5. **Given** individual (non-clustered) sales point markers are visible, **When** the user taps one, **Then** the bottom sheet opens directly for that sales point, and the map's zoom level and center remain exactly as they were at the moment of the tap (no residual zoom/pan effects from the click event).
6. **Given** the map is in fullscreen mode (feature 003, when landed), **When** the user taps a marker, **Then** the bottom sheet opens on top of the fullscreen map; minimizing the map while the sheet is open keeps the sheet open over the normal-size map.

---

### User Story 2 - Cluster vs. individual marker click separation (Priority: P1)

Tapping an individual marker must produce exactly one outcome — the bottom sheet opening — while cluster markers keep their existing zoom-to-reveal behavior. This isolates the two click handlers and explicitly prevents the cluster group's zoom action from firing in addition to (or instead of) the individual marker's click, which is the root cause of the current defect where selecting a point also triggered an unwanted second zoom operation.

**Why this priority**: It is a correctness fix on the exact interaction surface this feature changes; without it the sheet opening is accompanied by map-level side effects.

**Independent Test**: At a zoom level where clusters exist and at one where all markers are individual (zoom fully into the densest area): tap individual markers repeatedly — every tap opens exactly the sheet and never zooms; tap clusters — every tap zooms to reveal markers and never opens the sheet. No double outcomes.

**Acceptance Scenarios**:

1. **Given** multiple sales points are close together at a low zoom level, **When** the map renders them, **Then** they display as a single cluster marker showing the count of sales points it contains (existing behavior, unchanged).
2. **Given** a cluster marker is visible, **When** the user taps the cluster, **Then** the map zooms in to reveal the individual markers within that cluster (existing behavior, unchanged), and no bottom sheet opens.
3. **Given** an individual marker is tapped (whether clustered-area or free-standing), **When** the click is processed, **Then** exactly one outcome occurs — the bottom sheet opens — with no additional zoom, pan, re-clustering, or cluster-group click firing.
4. **Given** the user taps an individual marker at the exact moment the map is mid-animation from a prior cluster zoom, **When** the tap is processed, **Then** a single sheet opens for that point with no queued or delayed second outcome.

---

### User Story 3 - Directions and Google Maps actions (Priority: P1)

The bottom sheet carries two actions: "Directions", which launches a directions flow to the sales point, and "Go to Google Maps", which opens the point's location in Google Maps (external app or new tab). Both use the destination data the application already trusts: the stored Google Maps link when present, otherwise coordinates. When a point has neither, the buttons are hidden rather than dead. These links work identically whether the point was tapped in the normal map or over the fullscreen map (feature 003).

**Why this priority**: Getting a user to a physical point is the directory's conversion goal; the actions are the sheet's transactional payload.

**Independent Test**: Open the sheet for points with and without stored map links/coordinates: the buttons open the expected destinations in a new tab/app, and are absent for data-less points.

**Acceptance Scenarios**:

1. **Given** the bottom sheet is open, **When** the user taps the "Directions" button, **Then** a directions flow to that sales point opens (external maps app or new browser tab).
2. **Given** the bottom sheet is open, **When** the user taps "Open in Google Maps", **Then** Google Maps opens (external app or new tab) centered on that sales point.
3. **Given** the selected sales point has no coordinate data and no stored map link, **When** the sheet renders, **Then** neither action button is shown (no disabled or dead controls).

---

### User Story 4 - Desktop/tablet behavior (Priority: P2)

The same selection interaction on a desktop or tablet viewport uses the same bottom sheet (default chosen in the clarification round, Q1-A — pending user confirmation): one detail surface across all viewports.

**Why this priority**: The feature is mobile-first and mobile-targeted; desktop behavior reuses the same component and is verified second.

**Independent Test**: On a desktop viewport, select a sales point — the sheet opens with the same content/animation and all dismiss paths work.

**Acceptance Scenarios**:

1. **Given** a user is on a non-mobile (desktop/tablet) viewport, **When** the user selects a sales point, **Then** the same bottom sheet opens with the point's details, consistent with the mobile experience.

---

### User Story 5 - Robustness on small screens (Priority: P2)

The sheet behaves sensibly under stress: device rotation while open, content taller than the viewport, and points with missing display data never produce broken layouts.

**Why this priority**: Mobile-first means small screens and mid-session orientation changes are the norm; this story guards the sheet's quality bar.

**Independent Test**: With the sheet open, rotate the device (portrait ↔ landscape) and re-open on a short viewport with a long-name point: the sheet stays usable, never exceeds the viewport, and scrolls internally.

**Acceptance Scenarios**:

1. **Given** the bottom sheet is open, **When** the user rotates the device (portrait ↔ landscape), **Then** the sheet remains open and repositions correctly for the new viewport dimensions.
2. **Given** a sales point whose detail content exceeds the available sheet height on a small device, **When** the sheet opens, **Then** the content scrolls within the sheet and the sheet never extends beyond the viewport.

### Edge Cases

- **Missing coordinate data / stored map link** (also in US3): action buttons are hidden, never disabled or dead.
- **Rotation while the sheet is open**: sheet stays open and repositions (covered by US5).
- **Content exceeding sheet height on small devices**: internal scroll, sheet bounded to viewport (covered by US5).
- **Single-point cluster at the edge of the clustering radius**: clustering is library-driven and unchanged — only groups of 2+ close points cluster; a lone marker always renders individually and opens the sheet on tap (no special handling).
- **Rapid double-tap during a cluster zoom animation**: each tap yields exactly one outcome with no queued/delayed second action; final state matches the last tap (covered by US2 scenario 4).
- **Cluster click and individual marker click firing for the same tap (event bubbling)**: explicitly prevented — this is the root cause of the current defect (FR-017/FR-018); must never be merely visually masked.
- **Sheet open when the user taps a cluster**: cluster tap zooms (unchanged) and does not change the selection — the sheet stays open showing the previously selected point.
- **List View selection**: unchanged — selecting a card from the list keeps today's reveal behavior (fly-to, popup, highlight). Only map-marker taps use the sheet (assumption A2).
- **Sheet over fullscreen map (feature 003)**: sheet renders above the fullscreen map and is usable there (US1 scenario 6, FR-020).

## Requirements *(mandatory)*

### Functional Requirements

**Bottom sheet**

- **FR-001**: The system MUST display sales point details in a bottom sheet that animates up from the bottom edge of the screen when a marker is selected in Map View on mobile devices.
- **FR-002**: The bottom sheet MUST visually match the website's existing design system (colors, typography, spacing, border-radius — the existing `var(--color-*)`/`var(--radius-*)` tokens) and MUST be built using the shadcn/ui component library already used in the application (the `components/ui/*` primitives; adding the shadcn `Sheet` primitive built on the already-present Dialog base is in-keeping).
- **FR-003**: The bottom sheet MUST display the selected sales point's name rendered exactly as List View renders it: the existing `displayName` field as the title, with the secondary line `{cityName} • حي {neighborhoodName}` (or the existing `• {extraLabel}` fallback when no neighborhood exists) — reusing the same data and formatting as `EntryCard` (resolved by repo inspection; no new separator format is invented).
- **FR-004**: The bottom sheet MUST display the sales point's supporting details consistent with what List View shows for the same point (name line, city/neighborhood line, VIP status). The sheet may additionally show a short location summary, but must not contradict List View content.
- **FR-005**: The bottom sheet MUST include a "Directions" action that opens a directions flow to the sales point's location (external maps app or new tab).
- **FR-006**: The bottom sheet MUST include a "Go to Google Maps" action that opens the sales point's location directly in Google Maps (external app or new tab).
- **FR-007**: The bottom sheet MUST be dismissible via swipe-down gesture, tap outside the sheet, and an explicit close control; closing MUST clear the selected/highlighted state of the associated marker.
- **FR-008**: Selecting a new marker while the sheet is already open MUST update the sheet's content to the newly selected sales point without requiring close/reopen; tapping the currently-selected marker again MUST close the sheet (selection-toggle semantics, unchanged from today).
- **FR-009**: The opening/closing transition MUST be a simple, non-distracting slide-up/slide-down animation consistent with native bottom-sheet behavior (duration based on the existing `--duration`/`--ease` tokens; GPU-friendly transform animation).
- **FR-010**: The bottom sheet MUST be keyboard-accessible: open moves focus appropriately, Escape closes it, and the close control and actions are reachable with focus-visible indicators (shadcn primitives provide the focus-trap/aria baseline).

**Cluster vs. individual click separation**

- **FR-011**: Existing cluster behavior MUST remain unchanged: close points at low zoom levels render as a single cluster marker with a count; tapping a cluster zooms to reveal its individual markers — never altered by this fix.
- **FR-012**: Tapping an individual (non-clustered) marker MUST open the bottom sheet directly and MUST NOT trigger any zoom, pan, re-clustering, or other map-level view change (no residual side effects from the click event; the previous fly-to/popup behavior on marker taps is replaced by the sheet).
- **FR-013**: The individual marker click handler and the cluster click handler MUST be fully separate, non-overlapping handlers; neither MAY invoke or trigger the other's behavior under any circumstance.
- **FR-014**: The system MUST prevent map-level click events and cluster-group click/zoom events from overriding, intercepting, or firing in addition to an individual marker's own click event (explicit event propagation control), so a single tap on an individual marker produces exactly one outcome: the bottom sheet opening.

**Destinations**

- **FR-015**: The "Go to Google Maps" action MUST resolve to the sales point's stored Google Maps link (`googleMapUrl`, the same field the current map popup and List View use) when present; otherwise it MUST fall back to a Google Maps link constructed from the point's coordinates.
- **FR-016**: The "Directions" action MUST open a universal Google Maps directions link (`google.com/maps/dir` style, resolved with coordinates) in a new tab or the device's Google Maps app — default chosen in the clarification round (Q2-A, pending user confirmation); platform-aware deep linking (Apple Maps on iOS) is explicitly NOT in scope unless the default is overridden.
- **FR-017**: When a sales point has neither coordinates nor a stored map link, the system MUST hide both action buttons (no disabled or dead controls).
- **FR-018**: Both action buttons MUST open external destinations safely (`target="_blank"` with `rel="noopener"`) or via the platform's intended app-opening mechanism, and MUST remain usable when the sheet is open over the fullscreen map (feature 003).

**Behavior across viewports & modes**

- **FR-019**: The sheet behavior on non-mobile viewports MUST match the mobile experience — the same bottom sheet opens on all viewports (default chosen in the clarification round, Q1-A, pending user confirmation); no separate desktop pattern is introduced.
- **FR-020**: When feature 003's fullscreen map mode is active (once landed), the bottom sheet MUST open above the fullscreen map, remain interactive there, and stay open if the map is minimized with the sheet open (the sheet was the "detail bottom sheet" surface referenced by feature 003's FR-010/FR-013/FR-017).
- **FR-021**: Rotating the device while the sheet is open MUST keep the sheet open and correctly positioned for the new viewport.
- **FR-022**: The sheet MUST never exceed the viewport height; content longer than the sheet MUST scroll inside the sheet.
- **FR-023**: Tapping a cluster while the sheet is open MUST zoom per existing behavior and MUST NOT change the sheet's selection (the sheet stays open showing the previously selected point).

### Key Entities *(include if feature involves data)*

- **Sales Point (POSEntry)**: a physical sales location. Attributes relevant here: `displayName` (composed title), `cityName` + `neighborhoodName`/`extraLabel` (secondary location line), `vip` (badge), `googleMapUrl` (stored Google Maps link), `lat`/`lng` (coordinates, nullable). Drives the sheet's content and destinations. Already available client-side to the map (`MapPoint` in `MapView.tsx`) — no schema change.
- **Marker Cluster**: a library-managed grouping of 2+ nearby markers rendered as a single count-bearing element at low zoom. Distinct from an individual marker: its click behavior is zoom-to-reveal and must never trigger the individual marker's sheet-opening behavior, and vice versa.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A marker tap opens the sheet with a slide-up animation completing in under 300 ms, and the map's zoom level and center are unchanged by the tap (verified by reading zoom/center before and after across ≥5 markers, including the densest city).
- **SC-002**: For a sampled set of points (including VIP, no-neighborhood, and multi-word names), the sheet's name and location line match List View's rendering exactly for the same points.
- **SC-003**: 100% of individual-marker taps across all zoom levels (clustered and fully zoomed-in) produce exactly one outcome — the sheet opens; 100% of cluster taps zoom to reveal, never opening the sheet (regression-counted over ≥10 clusters and ≥20 individual taps).
- **SC-004**: All three dismissal paths (swipe-down, tap-outside, close control) close the sheet and clear the marker highlight, with zero console/UI errors.
- **SC-005**: Switching selection between markers updates the sheet in place without close/reopen; tapping the selected marker again closes it.
- **SC-006**: The action buttons open correct destinations on both real devices and emulated viewports; points lacking destination data render no buttons.
- **SC-007**: The sheet stays usable and correctly laid out through rotation, on short viewports with long content, and over feature 003's fullscreen map (sheet opens above it and survives minimize).
- **SC-008**: Desktop/tablet behavior matches the clarified pattern (Q1) with no regressions to the pre-existing non-mobile experience.

## Assumptions

- **A1 — Name format: RESOLVED by repo inspection** (`components/public/EntryCard.tsx`, `lib/points.ts`). The "concatenation of neighborhood + city" from the user description already exists as two rendered forms: the composed `displayName` title and the `{cityName} • حي {neighborhoodName}` secondary line. FR-004's "consistent with List View" pins the sheet to the same rendering — no new separator invented (the draft's separator question is thus resolved).
- **A2 — List View unchanged**: selecting a card in List View keeps today's behavior (fly-to reveal, popup, highlight). Only map-marker taps switch to the sheet; the marker-tap path's previous fly-to/popup behavior is replaced per FR-012. If a unified popup-free behavior across views is preferred, that is a scope decision beyond this draft.
- **A3 — Destination source: RESOLVED by repo inspection**. The popup and List View already link via `googleMapUrl`; the sheet reuses it, falling back to coordinates (FR-015). No Place ID is in the current data model.
- **A4 — Missing data**: points without coordinates/links get hidden action buttons (FR-017), not an address-based query (would add geocoding scope).
- **A5 — Same-marker toggle**: tapping the selected marker closes the sheet (matches today's `selectedId` toggle semantics).
- **A6 — Cluster + open sheet**: cluster taps never alter the sheet's selection (FR-023).
- **A7 — shadcn/ui sheet**: the repo has `components/ui/dialog.tsx` (Radix-based) but no `sheet.tsx` yet; adding the standard shadcn `Sheet` primitive (Dialog-based) satisfies the user's "use shadcn/ui" requirement without new design work or dependencies.
- **A8 — Dependency on feature 003 (`003-map-mobile-ui`, draft)**: feature 003's spec (FR-010/FR-013/FR-017 and research R8) already anticipated this sheet as the "detail bottom sheet" surface; FR-020 must be honored once 003 lands. 003 is currently draft — combined verification is scheduled when both land.
- **A9 — Clustering**: `leaflet.markercluster` defaults (zoom-to-bounds on cluster click) remain untouched; the fix is handler separation only (FR-013/FR-014), never clustering reconfiguration.
- **A10 — Edge-case defaults**: rotation keeps the sheet open (FR-021); overflow scrolls internally (FR-022); rapid taps yield single outcomes with no queued actions.
- **A11 — Testing**: no automated test runner in the repo (consistent with features 001–003); manual verification via the quickstart runbook is the bar; no new test framework is introduced.
- **A12 — Constitution**: `.specify/memory/constitution.md` remains an unfilled template (no project-specific governance constraints).
- **A13 — No new dependencies**: the feature is deliverable with the existing stack (leaflet stack, shadcn primitives incl. the Dialog base) — no new map provider, UI kit, or animation library.
- **A14 — Clarification defaults (PENDING USER CONFIRMATION)**: the two open questions from the clarify round were defaulted to Option A to unblock planning — Q1: same bottom sheet on all viewports (FR-019); Q2: universal Google Maps directions link (FR-016). Both are one-line spec changes if the user overrides; the plan is written so an override (e.g., mobile-only sheet, or Apple Maps on iOS) affects only FR-016/FR-019 and their verification scenarios.

## Amendment Log

- **2026-08-11 — Cluster/individual marker click separation added (FR-011–FR-014, US2 scenarios).** Root cause: individual marker click events were bubbling/triggering the cluster group's zoom handler, causing a second, unwanted zoom instead of (or in addition to) the detail surface. This amendment does not change clustering itself (FR-011) — it isolates the two click handlers so each produces exactly one outcome. Implementation must audit the current event binding in `components/public/MapView.tsx` (`marker.on('click', ...)` with no propagation control) and separate it from the cluster group's zoom-on-click.