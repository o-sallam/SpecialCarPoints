# Tasks: Sales Point Detail Sheet (Map View)

**Input**: Design documents from `/specs/004-sales-point-map-modal/` — [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/component-contracts.md](./contracts/component-contracts.md), [quickstart.md](./quickstart.md).

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅.

**Tests**: None generated. The repo has no automated test infra (consistent with features 001–003) and the spec does not request TDD. Validation is **manual** via [quickstart.md](./quickstart.md) (scenarios S-01…S-13 + regressions R-01…R-05). No TDD/test tasks.

**Organization**: Tasks grouped by user story (spec.md P1→P2). Plan delivery increments map onto stories: increment 1 (sheet primitive + component) → US1; increment 2 (click separation + origin flag) → US2; increment 3 (destinations) → US3; increment 4 (robustness + cross-feature) → US4/US5. **Each story = its own PR/commit.**

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no dependency on an incomplete task).
- **[Story]**: which user story (US1–US5).
- Exact file paths are included in every task.

## Path conventions

Single-project Next.js App Router. Feature surface: `components/public/AccordionLocator.tsx` (page orchestrator), `components/public/MapView.tsx` (imperative Leaflet map), new `components/public/MapDetailSheet.tsx` (sheet UI), new shadcn primitive `components/ui/sheet.tsx`, new pure util `lib/maps.ts`. Tokens in `app/globals.css` (`--color-*`, `--radius-*`, `--duration`, `--ease`, `--z-overlay`). **Zero new dependencies** — `package.json` must remain untouched (`@radix-ui/react-dialog@^1.1.23` and `tailwindcss-animate` are already installed; the shadcn Sheet primitive is code-only).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the zero-dependency baseline and capture before-images.

- [X] T001 Verify `@radix-ui/react-dialog` and `tailwindcss-animate` are present in `package.json` (needed by the shadcn Sheet primitive — no install required), record baseline screenshots of Map View at 375px and 1440px (including the current popup-on-select behavior) for regression comparison, and confirm `npm run build` is green pre-change

**Checkpoint**: Baseline green; no dependency risk.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shadcn Sheet primitive every story's UI builds on (contract 5, spec FR-002).

- [X] T002 Create `components/ui/sheet.tsx` — the standard shadcn `Sheet` component set (Radix Dialog-based: `Sheet`, `SheetTrigger`, `SheetClose`, `SheetContent` with `side` support, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter`) styled exclusively with the repo's existing `var(--color-*)`/`var(--radius-*)` tokens via `cn()` and `tailwindcss-animate` transitions, structurally consistent with the existing `components/ui/dialog.tsx`; export the full set (this feature uses `Sheet`, `SheetContent side="bottom"`, `SheetHeader`, `SheetTitle`, `SheetClose`)

**Checkpoint**: Primitive ready; US1 can begin.

---

## Phase 3: User Story 1 — Bottom sheet with sales point details (Priority: P1) 🎯 MVP

**Goal**: A sheet slides up from the bottom on marker selection showing the point's details in the List View format, dismissible by swipe-down, backdrop tap, close control, and Escape — with marker highlight cleared on close and in-place content switching (FR-001…FR-004, FR-007…FR-010).

**Independent Test**: In Map View on mobile, tap a marker: the sheet slides up with the same name/location/VIP rendering as List View. Dismiss via swipe, backdrop, close, and Escape — each closes it and clears the highlight. Tap another marker: content swaps in place; tap the same marker again: it closes. (Interim note: until US2 lands, the sheet also opens for list-originated selections — acceptable temporary state, corrected in US2.)

- [X] T003 [US1] Create `components/public/MapDetailSheet.tsx` on `Sheet`/`SheetContent side="bottom"` (from T002): `SheetHeader` with `SheetTitle` = `displayName` + VIP badge (exact `EntryCard` rendering: `--color-accent-soft` pill), body = location line `{cityName} • حي {neighborhoodName}` (or `• {extraLabel}` fallback — byte-identical to `EntryCard`), `SheetClose` button with `aria-label="إغلاق"`, `z-index` 1001 (above page/`--z-overlay`, below toasts — contract 3.10), slide/fade animation via `data-[state=open/closed]` classes + `--duration`/`--ease` tokens (FR-002/003/004/009/010)
- [X] T004 [US1] Implement the swipe-down dismiss in `components/public/MapDetailSheet.tsx`: pointerdown/move/up drag translating the sheet via `transform: translateY()` with friction; on release, drag ≥96px or fast flick → animate closed via `onClose()`; otherwise spring back to 0 with `--duration`/`--ease`; close button, backdrop tap (Radix `onOpenChange`), and Escape must remain available regardless of pointer support (contract 3.4, FR-007)
- [X] T005 [US1] Integrate the sheet in `components/public/AccordionLocator.tsx`: derive `selectedPoint = visible.find(p => p._id === selectedId)`; render `<MapDetailSheet point={selectedPoint} onClose={() => setSelectedId(null)} />` when `view === 'map' && selectedId && selectedPoint`; clear the selection when the point leaves the filtered set (research R9); closing must clear the marker highlight (FR-008 — driven by `selectedId`); `stopPropagation` on sheet content clicks so taps inside never reach map handlers (contract 6)
- [X] T006 [US1] Verify the story end-to-end in `components/public/MapDetailSheet.tsx` / `components/public/AccordionLocator.tsx`: quickstart S-01 (sheet opens, <300 ms, token-styled), S-02 (content byte-matches List View for ≥5 points incl. VIP / no-neighborhood / multi-word names), S-03 (all four dismiss paths + highlight cleared, zero console errors), S-08 (swap in place + same-marker toggle), S-09 (Escape, close button focus-visible, focus moves into sheet)

**Checkpoint**: US1 delivers the sheet interaction, fully testable independently — the MVP.

---

## Phase 4: User Story 2 — Cluster vs. individual marker click separation (Priority: P1)

**Goal**: Individual marker taps open the sheet with **no map movement** and exactly one outcome; cluster zoom behavior stays untouched; List View keeps its popup+flyTo (FR-011…FR-014, spec A2). This is the defect fix — **isolated high-risk PR** (plan increment 2).

**Independent Test**: Record `getZoom()`/`getCenter()` before a marker tap: identical after (no flyTo/pan/popup) at any zoom incl. >14. Cluster taps zoom only. List card taps keep popup + flyTo and never open the sheet.

- [X] T007 [US2] Isolate the handlers in `components/public/MapView.tsx`: change `onSelect` to `(id: string, origin: 'map' | 'list')`; marker click handler calls `L.DomEvent.stopPropagation(e.originalEvent)` then `onSelect(p._id, 'map')`; create markers with `bubblingMouseEvents: false`; leave the cluster group, its count badge, and zoom-to-bounds **byte-identical** (contract 2, FR-013/FR-014)
- [X] T008 [US2] Split the `selectedId` effect in `components/public/MapView.tsx`: add prop `selectionOrigin?: 'map' | 'list'` (extend contract 1's prop list in `contracts/component-contracts.md` with one line); when `'list'` → keep today's `flyTo(marker.getLatLng(), 14)` + `openPopup()`; when `'map'` → no `flyTo`, no `openPopup`, no `fitBounds` — zero view change (research R2, FR-012, scenario 10); marker highlight (accent pin + z-offset) still applies for both origins
- [X] T009 [US2] Add the origin flag in `components/public/AccordionLocator.tsx`: `selectionOrigin: 'map' | 'list'` state; `handleSelect(id, origin)` records it; the `EntryCard`/`RegionGroup` select wiring passes `'list'`; pass `selectionOrigin` to `MapView`; render `MapDetailSheet` only when `selectionOrigin === 'map'` (spec A2 — list selects show popup+flyTo, no sheet)
- [X] T010 [US2] Verify the fix in `components/public/MapView.tsx` / `components/public/AccordionLocator.tsx`: quickstart S-04 (zero movement on ≥5 marker taps incl. points beyond zoom 14 — the historical defect case), S-05 (≥10 cluster taps: zoom only, never a sheet), S-06 (≥20 individual taps incl. right after a cluster zoom animation: exactly one outcome each, no delayed second action), S-13 (list select: flyTo + popup + highlight, no sheet)

**Checkpoint**: US1 + US2 = the correct interaction model — sheet for map taps, popup for list, clusters untouched.

---

## Phase 5: User Story 3 — Directions and Google Maps actions (Priority: P1)

**Goal**: The sheet carries "الاتجاهات" (Directions) and "فتح في خرائط Google" actions resolving from the point's stored link or coordinates, hidden when neither exists (FR-015…FR-018).

**Independent Test**: For a point with a stored `googleMapUrl`, a point with coordinates only, and a point with neither: the buttons use the right destinations (or are absent), and open safely in a new tab/app.

- [X] T011 [P] [US3] Create `lib/maps.ts` — pure builders per contract 4: `googleMapsLink({ googleMapUrl, lat, lng })` → non-empty `googleMapUrl` verbatim, else `https://www.google.com/maps?q=${lat},${lng}`, else `null`; `directionsLink({ lat, lng })` → `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` (Q2-A default — no UA sniffing, no Apple Maps), else `null` (FR-015/016/017)
- [X] T012 [US3] Add the actions row to `components/public/MapDetailSheet.tsx`: two buttons (use `components/ui/button.tsx` with existing token classes) rendered only when the corresponding builder from T011 returns non-null — "الاتجاهات" (directionsLink) and "فتح في خرائط Google" (googleMapsLink — the existing popup copy, reused verbatim); `target="_blank" rel="noopener"` (FR-018); responsive (stack on narrow widths, side-by-side on wider)
- [X] T013 [US3] Verify destinations in `lib/maps.ts` / `components/public/MapDetailSheet.tsx`: quickstart S-07 — (a) point with `googleMapUrl` → Google button uses the stored URL; (b) coords-only point → both links coordinate-based; (c) data-less point → no buttons; confirm external links open in a new tab (and/or the maps app on a real device) and the sheet remains usable after return

**Checkpoint**: The sheet is now the full transactional detail surface.

---

## Phase 6: User Story 4 — Desktop/tablet behavior (Priority: P2)

**Goal**: The same bottom sheet renders and behaves identically on desktop/tablet (Q1-A default, FR-019), with no separate pattern.

**Independent Test**: At 1440px, select a sales point → the sheet opens with the same content/animation/dismiss paths as mobile.

- [X] T014 [US4] Desktop pass on `components/public/MapDetailSheet.tsx`: confirm the sheet opens/animates/dismisses identically at 1440px (FR-019); if a full-width bottom drawer reads visually stretched on wide viewports, constrain the **content width only** (e.g. `max-w-md mx-auto` on the content surface) — pattern-preserving, no behavioral branching
- [X] T015 [US4] Verify quickstart S-10 desktop row in `components/public/MapDetailSheet.tsx` / `components/public/AccordionLocator.tsx` at 768px and 1440px: open, content, all four dismiss paths, marker highlight clearing; confirm SC-008 (no regression to the pre-existing non-mobile experience)

**Checkpoint**: One detail surface across all viewports.

---

## Phase 7: User Story 5 — Robustness on small screens (Priority: P2)

**Goal**: The sheet stays correct through rotation, long content, and interplay with clusters and feature 003's fullscreen map (FR-020…FR-023).

**Independent Test**: Rotate with the sheet open; open a long-name point on a short viewport; tap a cluster while the sheet is open — in every case the sheet stays usable and well-positioned.

- [X] T016 [US5] Bound the sheet to the viewport in `components/public/MapDetailSheet.tsx`: `max-h` cap (e.g. `max-h-[85dvh]`) with `overflow-y-auto` on the body so long content scrolls internally and the sheet never exceeds the viewport (FR-022, research R10); verify on a 375px/667px viewport with the longest available name/location data
- [X] T017 [US5] Rotation + cluster-interplay verification in `components/public/MapDetailSheet.tsx` / `components/public/AccordionLocator.tsx`: rotate 375px→landscape and back with the sheet open — sheet stays open, correctly positioned, no layout breakage (FR-021, quickstart S-10 rotation row); tap a cluster while the sheet is open — cluster zooms, selection unchanged, sheet stays open (FR-023); confirm the sheet remains fully interactive throughout
- [X] T018 [US5] Cross-feature coordination for the fullscreen map: append the reserved S-11 row reference ("detail sheet over fullscreen map, survives minimize") to `specs/003-map-mobile-ui/quickstart.md` so joint verification runs when feature 003 lands (plan R8, FR-020 — no code change now; the sheet's z-1001 already sits above 003's fullscreen overlay by construction)

**Checkpoint**: Robustness proven; the sheet is production-solid.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation, accessibility, cleanup, and documentation alignment.

- [X] T019 [P] Run the complete [quickstart.md](./quickstart.md) (S-01…S-13 + R-01…R-05) at 375px and 1440px, plus swipe/external-link scenarios on at least one real device; confirm SC-001…SC-008 outcomes and zero console errors on every path
- [X] T020 [P] Accessibility + RTL audit across `components/public/MapDetailSheet.tsx`: focus-visible rings on the close button and both action buttons, `aria-label`s ("إغلاق", "الاتجاهات", "فتح في خرائط Google"), Radix focus-trap/Escape sanity, sheet title announced, RTL alignment of content and actions, contrast via tokens only (quickstart S-09)
- [X] T021 [P] Final cleanup and docs: no dead code/unused imports; `package.json` confirmed unchanged (zero new deps); `contracts/component-contracts.md` contract 1 confirmed to include the `selectionOrigin` prop (T008); prepare the PR description with follow-ups — automated tests if a runner is ever introduced (pure `lib/maps.ts` is the prime unit-test candidate), Q1/Q2 defaults flagged for confirmation (spec A14), and the feature-003 joint verification row (S-11)

**Checkpoint**: Feature complete and validated end-to-end.

---

## Dependencies & Execution Order

### Phase dependencies
- **Setup (T001)**: baseline gate for all phases.
- **Foundational (T002)**: Sheet primitive — blocks US1, US3, US4, US5 (all render the sheet).
- **User Stories**: US1 first (sheet + integration); US2 after US1 (the origin split refines US1's temporary any-selection behavior); US3 after US1 (buttons live in the sheet); US4 after US1 (sheet must exist); US5 after US3 (T016 edits the same file US3 edits).
- **Polish (Phase 8)**: after all stories.

### Within / across stories (file-conflict notes)
- `components/public/MapDetailSheet.tsx` is edited by **T003, T004 (US1), T012 (US3), T014 (US4), T016 (US5)** — sequential within and across stories; only one story edits it at a time.
- `components/public/AccordionLocator.tsx` is edited by **T005 (US1)** and **T009 (US2)** — sequential.
- `components/public/MapView.tsx` is edited by **T007, T008 (US2)** — sequential within US2.
- `lib/maps.ts` (T011) is a **new independent file** — flagged `[P]`, can be built in parallel with US1/US2 work.

### Independent test criteria per story
- **US1**: sheet opens on marker tap with List View-identical content; all four dismiss paths work and clear the highlight; in-place content switching; same-marker toggle.
- **US2**: zoom/center identical before/after marker taps (incl. >zoom 14); one outcome per tap; cluster zoom unchanged; list select keeps popup+flyTo and opens no sheet.
- **US3**: destinations resolve from `googleMapUrl` → coords → hidden; links open safely; no dead buttons.
- **US4**: identical sheet behavior at 768px/1440px; no desktop regression.
- **US5**: rotation keeps the sheet usable; content scrolls within the viewport bound; cluster taps never alter selection; S-11 reserved for 003.

### Parallel opportunities
- T011 ([P], `lib/maps.ts`) — any time before US3's UI wiring.
- Phase 8: T019 ∥ T020 ∥ T021.

---

## Parallel Example: US1 + map util

```bash
# Launch together (different files, no dependencies):
Task: "Create components/public/MapDetailSheet.tsx"        # T003/T004 (US1)
Task: "Create lib/maps.ts link builders"                   # T011 (US3) — [P]
```

---

## Implementation Strategy

### MVP first (US1 only)
1. Phase 1 (T001) + Phase 2 (T002) + Phase 3 US1 (T003–T006).
2. **STOP & VALIDATE** via quickstart S-01…S-03, S-08, S-09 — the core sheet interaction is demoable alone.
3. Note for the MVP demo: until US2 lands, list selects temporarily open the sheet too (flagged interim behavior; corrected in US2 per spec A2).

### Incremental delivery (one PR per concern — plan "Suggested delivery increments")
1. US1 (T003–T006) → sheet UI + dismiss + integration, **MVP**.
2. US2 (T007–T010) → **isolated high-risk PR** (click separation + origin flag + no-movement fix).
3. US3 (T011–T013) → destinations (T011 can land/parallel anytime).
4. US4 (T014–T015) → desktop consistency.
5. US5 (T016–T018) → robustness + 003 coordination.
6. Phase 8 (T019–T021) → full validation, a11y, cleanup.

Each increment is independently revertible; the US2 PR is the highest-risk review area (Leaflet event wiring) and must stay isolated.

---

## Notes
- [P] = different files, no dependency on an incomplete task.
- [Story] label maps a task to its user story for traceability.
- No test tasks: validation is manual via quickstart.md (no test infra; adding one is a flagged follow-up, not in scope).
- Zero new dependencies — `package.json` must remain untouched.
- Commit after each task or logical group; each user story is its own PR (US2 isolated).