# Feature Specification: Map UI Mobile Improvements (Full-Bleed + Expand/Minimize)

**Feature Branch**: `003-map-mobile-ui`

**Created**: 2026-08-11

**Status**: Draft

**Input**: User description: "Improve the map UI on mobile devices. The map should have no padding or rounded corners on mobile screens, so it fills the full available width of the website or screen. Also add a button to expand the map to the full mobile screen, along with a minimize button to shrink the map again and return to the normal website view."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Full-width map on mobile, unchanged on desktop (Priority: P1)

A mobile visitor switching to the Map View should see the map use every pixel of available width: no side padding and no rounded corners cutting off the map at the screen edges. This maximizes usable map area and removes the "card inside a phone" look on small screens. Desktop and tablet visitors keep the present map styling exactly as it is today.

**Why this priority**: This is the baseline visual correction the user asked for; the expand/minimize controls (stories 2-3) build on top of it, so it lands first and is independently verifiable.

**Independent Test**: Open Map View at a mobile width (e.g. 375px): the map spans edge-to-edge with zero padding and no corner rounding. Open the same page on desktop (e.g. 1440px) and confirm the current padding/rounded-corner styling is untouched. Both checks can be done in isolation.

**Acceptance Scenarios**:

1. **Given** a user opens Map View on a mobile device, **When** the map renders, **Then** it fills the full available screen/page width with no padding and no rounded corners.
2. **Given** a user opens Map View on a desktop or tablet device, **When** the map renders, **Then** it retains its current styling (padding, rounded corners) unchanged.

---

### User Story 2 - Expand the map to fill the entire screen (Priority: P1)

While browsing sales points, a mobile user can tap an Expand button overlaid on the map to grow it to fill the whole screen. Surrounding page content is hidden and the background page cannot be scrolled, turning the map into a distraction-free full-screen browsing surface.

**Why this priority**: Together with story 3 it delivers the headline capability of this feature — a comfortable, focused map exploration mode on small displays.

**Independent Test**: Tap the Expand button and verify the map fills the entire viewport, no page content (header, toolbar, list) remains visible or reachable, and attempts to scroll the page do nothing. This works standalone on the current map.

**Acceptance Scenarios**:

1. **Given** a user is viewing the map in its normal (non-fullscreen) mobile state, **When** the user taps the Expand button, **Then** the map grows to fill the entire screen and surrounding page content is hidden/inaccessible.
2. **Given** the map is in fullscreen state, **When** the user attempts to scroll the page behind the map (touch or keyboard), **Then** no background scrolling occurs.
3. **Given** a screen-reader user, **When** they focus the Expand button, **Then** it announces a meaningful label (e.g. "Expand map"), and the Minimize control announces a distinct label (e.g. "Minimize map") — icon-only controls are never unlabeled.

---

### User Story 3 - Minimize and return exactly where the user left off (Priority: P1)

A user who has expanded the map can tap the Minimize button to shrink it back to its normal in-page size and position. The page is restored to the exact scroll position the user was at before expanding, so no orientation is lost mid-browse.

**Why this priority**: It closes the expand loop; without faithful restore, expanding would be a dead-end trap. It is testable independently of story 2's visual requirements.

**Independent Test**: Scroll to a distinctive position on the page, expand the map, tap Minimize, and confirm the page returns to the same scroll position with the map back at its in-page size.

**Acceptance Scenarios**:

1. **Given** the map is in fullscreen state, **When** the user taps the Minimize button, **Then** the map returns to its normal in-page size and position.
2. **Given** the user scrolled to a specific position before expanding, **When** they minimize, **Then** the page scroll position is restored to that same position (not reset to the top).
3. **Given** the detail bottom sheet is open when the user minimizes (Minimize button or back gesture), **When** the transition completes, **Then** the sheet remains open over the normal-size map with its content intact.

---

### User Story 4 - Keep point details usable while expanded (Priority: P2)

While the map is fullscreen, tapping a sales point marker still opens the point's detail bottom sheet (feature 001), layered on top of the fullscreen map, so the full-screen browsing flow never dead-ends.

**Why this priority**: It preserves existing functionality built in feature 001; a fullscreen map that breaks marker interaction would be a regression.

**Independent Test**: In fullscreen mode, tap any marker and verify the detail sheet opens above the map; dismiss the sheet and confirm the map is still fullscreen.

**Acceptance Scenarios**:

1. **Given** the map is in fullscreen state, **When** the user taps a sales point marker, **Then** the sales point detail bottom sheet opens on top of the fullscreen map without forcing the map to minimize.

---

### User Story 5 - Correct rendering through every transition (Priority: P2)

Expand, minimize, and device rotation must not leave the map half-rendered: no blank or gray tile areas, markers stay pinned to their real positions, and the current view center/zoom is preserved through the round trip.

**Why this priority**: A map that renders wrong after a transition is worse than no feature; this guards the quality of stories 1-3 and is verified end-to-end.

**Independent Test**: On a mobile device, expand and minimize several times, including a rotation while fullscreen, and confirm tiles and markers render correctly after each transition.

**Acceptance Scenarios**:

1. **Given** the map has just transitioned between normal and fullscreen states, **When** the transition completes, **Then** the map renders correctly with no blank/gray tile areas and markers remain accurately positioned.
2. **Given** the map is in fullscreen state, **When** the user rotates the device (portrait ↔ landscape), **Then** the map re-fits the new viewport and renders completely with no blank/gray areas.
3. **Given** a user has panned/zoomed the map, **When** they expand and later minimize, **Then** the map's center and zoom level are preserved (the map does not jump to a default location).

---

### User Story 6 - Minimize with the device back gesture (Priority: P2)

While the map is expanded, the user can also exit fullscreen with the device's standard back button/gesture (Android back, iOS swipe-back, browser back). The map minimizes exactly as if the Minimize button were tapped, and the user stays on the page — the back press is consumed by the map rather than navigating away.

**Why this priority**: It matches the platform convention for dismissing fullscreen surfaces and prevents users from being unexpectedly thrown off the page; it is a moderate-scope addition on top of stories 2-3.

**Independent Test**: Expand the map and press the device back button/gesture: the map returns to its normal in-page state and the browser does not navigate away. A second back press while the map is already normal-sized behaves as standard navigation.

**Acceptance Scenarios**:

1. **Given** the map is in fullscreen state, **When** the user triggers the device back gesture/button, **Then** the map minimizes and returns to its normal in-page state, equivalent to tapping the Minimize button, without navigating away from the page.
2. **Given** the map is in fullscreen state and the user uses back to minimize, **When** the transition completes, **Then** the page (browser history) is left exactly as it was before expanding — no duplicate history entries beyond the one consumed to minimize.

### Edge Cases

- **Device rotation while fullscreen**: the map must re-fit the new viewport and render without blank/gray areas (covered by story 5).
- **Detail sheet open when the user taps Minimize or triggers the back gesture**: the sheet remains open over the normal-size map with its content intact (FR-017); the user dismisses it as usual.
- **Expand, then navigate away without minimizing**: fullscreen state does not persist across navigation; the next visit to the page opens in the normal state (assumption A3).
- **Second back press while the map is already normal-sized**: must proceed with standard app/browser back navigation as expected — the history entry used to minimize is consumed by the first back press, so it must never require two back presses to leave the page.
- **Rapid repeated expand/minimize taps**: the map never gets stuck; the final state always matches the last tap (both transitions are idempotent).
- **Dense marker clusters after a transition**: clustering behavior (feature 001) is unaffected — clusters and markers render in the correct positions for the current zoom after resize.
- **Theme toggle while fullscreen**: switching light/dark theme with the map expanded re-renders tiles/markers correctly, consistent with feature 001's theme-aware tiles.

## Requirements *(mandatory)*

### Functional Requirements

**Full-bleed styling**

- **FR-001**: On mobile viewports, the map container MUST render with no padding and no rounded corners, filling the full available width of the screen.
- **FR-002**: On desktop/tablet viewports, the map container MUST retain its current padding and rounded-corner styling, unchanged by this feature.

**Expand/minimize**

- **FR-003**: The system MUST provide an Expand control, visible as an overlay on the map in its normal state, that lets the user grow the map to occupy the full screen.
- **FR-004**: When expanded, the map MUST visually and functionally fill the entire mobile viewport, with the underlying page content hidden or inaccessible until minimized.
- **FR-005**: The system MUST provide a Minimize control, visible while the map is in fullscreen state, that returns the map to its normal in-page size.
- **FR-006**: Minimizing the map MUST restore the user's prior page scroll position (the exact position at the moment of expansion) rather than resetting to the top of the page.
- **FR-007**: Both the Expand and Minimize controls MUST be accessible (labeled for screen readers, since they are icon-only controls).
- **FR-008**: The map MUST re-render correctly (no blank/gray tiles, correctly positioned markers, clustering intact) after both the expand and minimize transitions.
- **FR-009**: While the map is in fullscreen state, background page scrolling MUST be disabled/prevented.
- **FR-010**: The sales point detail bottom sheet (feature 001) MUST remain usable while the map is in fullscreen state, appearing above the fullscreen map.
- **FR-011**: The device back button/gesture MUST minimize an expanded map, returning it to its normal in-page state, equivalent to tapping the Minimize control, without navigating the user away from the page. A back press while the map is already in its normal state MUST proceed with standard app/browser back navigation, unchanged by this feature.
- **FR-012**: The expand/minimize capability MUST be available on mobile viewports only (below the mobile/desktop breakpoint, e.g. <768px). On desktop and tablet viewports the Expand/Minimize controls MUST NOT appear, and the map retains its current non-full-bleed styling per FR-002.
- **FR-013**: When a marker is tapped while the map is already in fullscreen state, the sales point detail bottom sheet (feature 001) MUST open on top of the fullscreen map and the map MUST remain expanded (no auto-minimize).

**Transition robustness**

- **FR-014**: If the device is rotated while the map is in fullscreen state, the map MUST re-fit the new viewport and render completely, with no blank/gray tile areas and markers in correct positions.
- **FR-015**: Fullscreen state MUST NOT persist across page navigation; returning to the page always starts in the normal in-page state.
- **FR-016**: The map's current center and zoom level MUST be preserved across expand and minimize transitions.
- **FR-017**: When the map minimizes (via the Minimize control or the back gesture) while the sales point detail bottom sheet is open, the sheet MUST remain open over the normal-size map, with its content intact; the user dismisses it as usual.

### Key Entities *(include if feature involves data)*

- **Map View State**: Represents the map's display mode — "normal" (in-page, full-width) or "fullscreen" (full-viewport). It also tracks the page scroll position captured at the moment of expansion, for restoration on minimize, and is per-visit (not persisted). Derived from and dependent on feature 001's map view and sales point detail bottom sheet.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At mobile widths (<768px) the map renders edge-to-edge with zero horizontal padding and no corner radius; at desktop width the previous card styling is preserved — verified at 375px/768px/1440px.
- **SC-002**: A user can expand and minimize in a single tap each, with each transition completing in under 300 ms and showing no blank/gray tile areas across all manual test cycles (including rapid repeated taps).
- **SC-003**: After minimizing, the page scroll position is restored to within ±10px of the position before expanding (verified over a range of scroll depths).
- **SC-004**: A screen-reader audit confirms both icon-only controls announce meaningful, distinct labels.
- **SC-005**: While expanded, background page scrolling is impossible via touch and keyboard (verified manually, no scroll events reach the page).
- **SC-006**: Markers for the full dataset (55 points) remain accurately positioned after expand, minimize, and rotation transitions, with clustering behavior unchanged.
- **SC-007**: Expanding, minimizing, and rotating produce zero console/UI errors and no dead-end states (the user can always exit fullscreen).
- **SC-008**: While expanded, a single device back press returns the user to the normal map view on the same page; a second back press (map already normal) performs standard navigation. Verified on Android back button, iOS swipe-back, and browser back.

## Assumptions

- **A1 — Map library (was an open clarification): RESOLVED by repo inspection.** The project integrates Leaflet (`leaflet@^1.9.4`, `react-leaflet@^4.2.1`, `leaflet.markercluster@^1.5.3` — confirmed in `package.json`; map view is `components/public/MapView.tsx`). Planning must account for the map's container-resize/invalidation needs when the container size changes (expand/minimize/rotation) so tiles and markers re-render correctly per FR-008/FR-014.
- **A2 — Mobile breakpoint**: "<768px" is used as the mobile definition, matching feature 001's breakpoint, so full-bleed and expand/minimize apply on phones and small tablets.
- **A3 — Navigation resets state**: fullscreen state is a per-visit, in-page state; navigating away and back returns to the normal state (basis for FR-015).
- **A4 — Sheet survives minimize**: if the detail bottom sheet is open when the map minimizes (Minimize button or back gesture), the sheet remains open over the restored map; its content is not discarded (basis for FR-017).
- **A5 — Dependency on feature 001**: this feature builds on feature 001's Map View and sales point detail bottom sheet; FR-010/FR-013 require those surfaces, and verification depends on them existing.
- **A6 — Viewport preservation**: the map's center/zoom are carried through transitions rather than reset (basis for FR-016).
- **A7 — No new dependencies**: the feature is deliverable with the existing mapping stack; expand/minimize is a layout/state concern on top of it.
- **A8 — Constitution**: `.specify/memory/constitution.md` remains an unfilled template (no project-specific governance constraints), so no additional rules apply beyond this spec.
- **A9 — Back-minimize mechanism (planning note, per FR-011)**: expanding pushes a single browser history entry; the back navigation event on that entry triggers minimize; the entry is consumed so a second back press navigates normally. This is an implementation note for `/speckit.plan`, not a requirement on technology choice.