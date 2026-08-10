# Research: Map UI Mobile Improvements (Full-Bleed + Expand/Minimize)

**Phase 0 decisions** — all spec [NEEDS CLARIFICATION] markers were resolved during specification (FR-011 → back minimizes; FR-012 → mobile-only; FR-013 → sheet over fullscreen map; FR-017 → sheet stays open; library → Leaflet, repo-verified). This file records the remaining *design* decisions and their rationale for `/speckit.tasks`.

---

## R1. Fullscreen without remounting the map

- **Decision**: Keep the single mounted `MapView` (imperative Leaflet `mapRef`) and swap the map card wrapper's classes: normal-mobile = full-bleed card (`margin-inline: calc(-1 * var(--space-4))`, `rounded-none`, `border-x-0`), normal-desktop = current classes untouched, fullscreen = `fixed inset-0 z-[var(--z-overlay)]`. Container size changes are followed by `map.invalidateSize()`.
- **Rationale**: FR-016 requires preserving center/zoom and FR-017 requires the popup to survive minimize — both are trivially satisfied only if the Leaflet instance (and open popup) persist across transitions. `invalidateSize()` is Leaflet's documented way to re-measure the container; with the tile layer still mounted, tiles re-render from cache with no blank areas. `fixed inset-0` positions without touching the document flow, so `window.scrollY` never changes as a side effect of expanding.
- **Alternatives considered**:
  - *Portal (`createPortal`) the map into `document.body` while fullscreen* — rejected: requires re-mounting the map (loses center/zoom, popup, and re-triggers `fitBounds`), and duplicates control/layout logic.
  - *Separate fullscreen map component* — rejected: same remount problem plus double tile/cluster initialization cost.
  - *CSS width/height transition animation* — rejected: animating container size forces `invalidateSize` at animation end (or mid-animation flicker); SC-002 (<300 ms, no blank tiles) is safer with an instant swap, which also keeps the diff trivial.

## R2. Triggering the post-resize invalidate

- **Decision**: MapView gains `resizeSignal?: number` (incremented by the parent on expand and minimize) whose effect calls `invalidateSize()` twice — once directly, once inside `requestAnimationFrame` (after layout settles) — plus an internal `window` `resize` listener (rAF-throttled) for rotation and mobile URL-bar height changes (FR-014).
- **Rationale**: A class swap on the wrapper does **not** fire `window.resize`, so an explicit signal is required; rotation **does** fire it, so the listener is required. Double-rAF covers browsers that need a frame for the fixed-position layout to settle. Both fit the existing `recenterSignal` precedent in `MapView`.
- **Alternatives considered**:
  - *`ResizeObserver` on the container* — viable and arguably more precise, but the container is owned by the parent; the signal approach matches existing code conventions and keeps MapView's API delta to one optional prop.
  - *Single immediate `invalidateSize()`* — rejected: on some engines the fixed overlay layout isn't measurable before paint; the rAF retry is the standard mitigation.

## R3. Back button/gesture minimize (FR-011)

- **Decision**: On expand, `history.pushState({ scMap: 'expanded' }, '')`. A `popstate` listener: if `event.state?.scMap === 'expanded'` → run minimize (consuming the entry; the browser stays on the page). Button-minimize also pops the pushed entry (`history.back()`), letting the same popstate path execute minimize — guarded so minimize is idempotent. Second back press finds no entry → standard navigation. State is keyed (`scMap`) so unrelated history entries never trigger minimize.
- **Rationale**: This is the standard, dependency-free pattern for "back closes the overlay" (Android hardware back, iOS swipe-back, browser back all surface as history navigation in modern browsers). It leaves history exactly as before expand (FR-011 scenario 2) and satisfies SC-008.
- **Alternatives considered**:
  - *No history integration* — rejected: back would leave the page while the map was fullscreen (spec explicitly resolved against this).
  - *URL hash state (`#map=full`)* — rejected: pollutes the URL, affects share/copy behavior, and fights with any future routing; `pushState` state objects are invisible.
  - *`beforeunload`-style interception* — rejected: unreliable, non-standard, and cannot distinguish back-from-expand vs. genuine navigation.

## R4. Mobile breakpoint detection (FR-001/FR-012)

- **Decision**: New SSR-safe hook `useIsMobile` — `useSyncExternalStore` over `matchMedia('(max-width: 767px)')`, server default `false`. Full-bleed/fullscreen **styling** is driven by Tailwind/CSS media queries (declarative, no-JS), while the hook drives only the *controls' visibility* and the fullscreen mode decision.
- **Rationale**: `<768px` matches feature 001's breakpoint (spec A2). CSS media queries are the correct tool for pure styling; JS matchMedia is only needed because Expand/Minimize buttons and the expand action are behavior, not decoration. `useSyncExternalStore` gives tear-free, subscription-based updates on rotation (FR-014: a rotated fullscreen map must keep showing Minimize — see R5).
- **Alternatives considered**: *Tailwind `md:` classes only* — adequate for styling but not for state; *a `useMediaQuery` dependency* — not needed (spec A7: no new dependencies); roll our own 30-line hook.

## R5. Control visibility matrix

- **Decision**: `Expand` visible iff `useIsMobile && mode === 'normal'`. `Minimize` visible iff `mode === 'fullscreen'` **regardless of current breakpoint** — a phone rotated to ≥768px while fullscreen must never trap the user without an exit control.
- **Rationale**: FR-012 forbids controls on desktop/tablet in the normal state, but FR-005 requires Minimize *while fullscreen* — and rotation (FR-014) means "mobile device" and "<768px" can diverge mid-session. Fullscreen mode persists across rotation; only its entry is mobile-gated.
- **Alternatives considered**: *Hide Minimize above 768px* — rejected outright: creates an unrecoverable dead-end state (violates SC-007).

## R6. Full-bleed technique (FR-001)

- **Decision**: On the map card wrapper, apply `margin-inline: calc(-1 * var(--space-4))` (compensates the `.container`'s `padding-inline: var(--space-4)`), `rounded-none`, `border-x-0` at <768px; restore the current classes at ≥768px. Vertical section padding (`pt-8 pb-12`) stays.
- **Rationale**: The spec's wording is width-focused ("fills the full available width"); the `--space-4` token is the single source of the container's horizontal inset, so a negative logical margin achieves pixel-perfect breakout without touching the `.container` utility or moving DOM. `margin-inline` is RTL-safe. Border removal at the edges avoids 1px cut lines on the viewport edges; corner radius and horizontal borders return on desktop via the media query.
- **Alternatives considered**: *Moving the map section out of `.container`* — changes document flow and scroll anchoring; *editing `.container`/global CSS* — affects the whole page (list view, toolbar, hero boundaries); both rejected as higher blast radius.

## R7. Scroll lock & restore (FR-006/FR-009)

- **Decision**: New `useScrollLock` hook: while active, save current `document.body.style.overflow`/`overscrollBehavior`, set `overflow: hidden` + `overscroll-behavior: none` (mobile bounce suppression); restore both on deactivate and on unmount (covers FR-015 navigation-away cleanup). Scroll restore on minimize: `window.scrollTo({ top: capturedScrollY, behavior: 'instant' })`.
- **Rationale**: `overflow: hidden` on body prevents touch/wheel/keyboard document scrolling (FR-009) and is the least invasive standard lock; `overscroll-behavior` additionally stops iOS rubber-band/pull-to-refresh chaining over the fixed overlay. Capturing `window.scrollY` at expand time and restoring it exactly (SC-003 ±10px) is direct and stateless; `'instant'` avoids smooth-scroll drift and matches "return exactly where the user left off".
- **Alternatives considered**: *`touch-action: none` on the overlay* — would also kill Leaflet's own pan gestures (wrong); *CSS `position: fixed` body lock* — overkill and causes layout reflow; *`scrollTo` with smooth behavior* — violates the ±10px restore criterion perception.

## R8. "Detail bottom sheet (feature 001)" reconciliation

- **Decision**: Treat the existing **Leaflet marker popup + `selectedId` marker highlight** (via `handleSelect`) as the "sales point detail bottom sheet" surface referenced by FR-010/FR-013/FR-017 — repo inspection shows no separate sheet component exists. Marker click behavior (`onSelect` → `handleSelect`) is **not modified**; because the map instance persists in fullscreen, popups open above the fullscreen map (FR-010/FR-013) and remain open across minimize (FR-017) for free, once `invalidateSize()` keeps the marker anchors correct.
- **Rationale**: Least-change wins; the popup is the shipped "detail interaction" from feature 001 (its spec: "clicking an individual marker MUST trigger the pre-existing point-detail interaction (no regression)"). Any future real bottom-sheet lands on the same contracts.
- **Alternatives considered**: *Building a new bottom-sheet component* — explicitly out of scope (this feature adds nothing to feature 001's surface; would balloon scope and violate A7/least-change).
- **Follow-up note** (for tasks): if a true bottom sheet is later introduced, the three FRs must be re-verified against it; the component contracts record this coupling.

## R9. Z-order and stacking

- **Decision**: Fullscreen wrapper uses `z-index: var(--z-overlay)` (1000) — above page content and sticky header (40), below toasts (1100). The Expand/Minimize buttons are siblings of `MapView` inside the `.map-isolate` wrapper (which keeps Leaflet's internal 400–700 pane z-indexes contained); buttons mount at `z-[1001]`… wait — contained: buttons as siblings in the wrapper's stacking context just need to exceed the *wrapper's* map subtree contribution; since MapView sits at `z-0` inside, buttons at `z-[1]`+ suffice, but `z-[1001]` is used anyway so they also clear MapView's own internal `z-[1000]` activation overlay.
- **Rationale**: Reuses the existing token scale and the established `.map-isolate` containment idiom; no global z-index changes. Toasts must remain usable above the fullscreen map (session feedback).
- **Alternatives considered**: *Portal buttons to body* — unnecessary; siblings within the wrapper compose correctly and keep RTL placement logic local.

## R10. Accessibility of controls (FR-007)

- **Decision**: Two `<button>`s with Arabic `aria-label`s — `aria-label="تكبير الخريطة"` (Expand) / `aria-label="تصغير الخريطة"` (Minimize) — icon-only via lucide-react (`Maximize2`/`Minimize2`), ≥44×44px, focus-visible ring using the existing token-based style (same pattern as the locate button), `type="button"`, `aria-hidden` icons.
- **Rationale**: SC-004 requires distinct meaningful announcements; the repo's locate button establishes the exact styling/token pattern to mirror. Keyboard: Expand/Minimize are reachable in DOM order; focus stays on the overlay (which contains all reachable content — page is `overflow: hidden`).
- **Alternatives considered**: *`<span role="button">`* — rejected (native button gives keyboard + AT semantics for free); *English labels* — rejected (site is Arabic RTL).