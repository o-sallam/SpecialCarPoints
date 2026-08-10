# Tasks: Map UI Mobile Improvements (Full-Bleed + Expand/Minimize)

**Input**: Design documents from `/specs/003-map-mobile-ui/` — [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/component-contracts.md](./contracts/component-contracts.md), [quickstart.md](./quickstart.md).

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅.

**Tests**: None generated. The repo has no automated test infra (consistent with features 001/002) and the spec does not request TDD. Validation is **manual** via [quickstart.md](./quickstart.md) (scenarios Q-01…Q-14 + regressions R-01…R-04). No TDD/test tasks.

**Organization**: Tasks grouped by user story (spec.md P1→P2). Plan delivery increments map onto stories: increment 1 (full-bleed CSS) → US1; increment 2 (expand/minimize state+controls+scroll lock+resize invalidation) → US2/US3 (+US4 verification); increment 3 (back-gesture history) → US6; transition robustness (rotation listener + verification) → US5. **Each story = its own PR/commit.**

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no dependency on an incomplete task).
- **[Story]**: which user story (US1–US6).
- Exact file paths are included in every task.

## Path conventions

Single-project Next.js App Router. Feature surface: `components/public/AccordionLocator.tsx` (page orchestrator — owns the map wrapper classes and the page-level state), `components/public/MapView.tsx` (imperative Leaflet map — minimal resize plumbing only), new hooks in `lib/hooks/`. Tokens in `app/globals.css` (`--space-4`, `--z-overlay`, `--radius-xl`); **no token changes needed**. Zero new dependencies.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the zero-dependency baseline (plan A7 — no package.json changes).

- [X] T001 Verify `package.json` requires no changes (leaflet stack + icons already present) and the app builds cleanly at baseline (`npm run build`); record pre-feature screenshot of the map card at 375px and 1440px for regression comparison (quickstart R-04)

**Checkpoint**: Baseline is green; no dependency risk.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The two new hooks every expand/minimize story needs (contracts C5/C6, plan R4/R7).

- [X] T002 [P] Create `lib/hooks/use-is-mobile.ts`: SSR-safe `useIsMobile(): boolean` via `useSyncExternalStore` subscribed to `matchMedia('(max-width: 767px)')`, server/first-render default `false` (contract C5; spec A2 breakpoint; used for control visibility + expand gating only — never for styling)
- [X] T003 [P] Create `lib/hooks/use-scroll-lock.ts`: `useScrollLock(locked: boolean)` that, while locked, saves `document.body.style.overflow` and `overscrollBehavior` and sets `hidden` / `none`; restores saved values on unlock **and** on unmount; StrictMode-safe (contract C6; FR-009/FR-015)

**Checkpoint**: Hooks ready; US1 (pure CSS) can run in parallel with this phase, US2+ cannot start until done.

---

## Phase 3: User Story 1 — Full-width map on mobile, unchanged on desktop (Priority: P1) 🎯 MVP

**Goal**: On viewports <768px the map card breaks out of the container padding and drops rounded corners/borders to span the full screen width; on ≥768px the card is pixel-identical to today (FR-001/FR-002).

**Independent Test**: Open Map View at 375px → map spans edge-to-edge (computed `margin-inline: -1rem`, `border-radius: 0`, no side borders, no horizontal page scrollbar). Open at 1440px → current padding/rounding/border/shadow unchanged.

- [X] T004 [US1] Apply full-bleed mobile styling to the map card wrapper in `components/public/AccordionLocator.tsx` (the `div` that wraps `<MapView/>` in the `view === 'map'` branch, currently `map-isolate h-[70vh] overflow-hidden rounded-[var(--radius-xl)] border ... shadow-[var(--shadow-md)] sm:h-[75vh]`): at the base (mobile) breakpoint add `margin-inline: calc(-1 * var(--space-4))` (logical — RTL-safe, tracks the `.container` token), `rounded-none`, and `border-x-0`; at `md:` (≥768px) restore the current classes **exactly as shipped** (contract C2, plan R6). Vertical section padding (`pt-8 pb-12`) stays unchanged
- [X] T005 [US1] Verify the full-bleed result in `components/public/AccordionLocator.tsx` at 375px/767px/768px/1440px per contract C2: computed `margin-inline` == `-1rem` below 768px and `0` at 768px+; `border-radius` == 0 below 768px, `var(--radius-xl)` at 768px+; no horizontal page scrollbar introduced; 1440px output matches the T001 baseline screenshot (quickstart Q-01/Q-02, R-04)

**Checkpoint**: US1 fully functional and independently testable — the mobile map is now full-bleed with zero risk to desktop.

---

## Phase 4: User Story 2 — Expand the map to fill the entire screen (Priority: P1)

**Goal**: A mobile user taps an Expand control and the map grows to a fixed full-viewport overlay; surrounding page content is hidden and background scrolling is locked (FR-003/FR-004/FR-009/FR-012).

**Independent Test**: At 375px in Map view, tap Expand → map fills the entire viewport (`fixed inset-0`), header/toolbar/list invisible, touch/wheel/keyboard attempts cannot scroll the page. Expand control never appears at ≥768px.

- [X] T006 [US2] Add the fullscreen state to `components/public/AccordionLocator.tsx` per data-model state machine: `mode: 'normal' | 'fullscreen'`, `capturedScrollY`, and `handleExpand()` that (1) captures `window.scrollY` **before** any class change (contract 3.1), (2) sets mode `fullscreen`, (3) bumps the `resizeSignal` counter; apply the fullscreen class set to the same map wrapper (contract C2 row 3: `fixed inset-0 z-[var(--z-overlay)] rounded-none border-0`, drop shadow/borders/height classes) so the mounted `MapView` instance is re-sized in place — **never remounted, never portaled** (plan R1, FR-004/FR-016)
- [X] T007 [US2] Render the Expand button overlay inside the map wrapper in `components/public/AccordionLocator.tsx`: `type="button"`, `aria-label="تكبير الخريطة"` (FR-007), lucide `Maximize2` icon with `aria-hidden`, ≥44×44px, token-based focus-visible ring (mirror the locate-button pattern in `components/public/MapView.tsx`), logical-corner placement (RTL-safe), `z-index` above MapView's subtree including its internal `z-[1000]` activation overlay (plan R9), `stopPropagation` so taps don't trigger map activation (contract C4); visibility matrix: rendered iff `useIsMobile() && mode === 'normal'` (FR-012 — contract C4.4; use `useIsMobile` from T002)
- [X] T008 [US2] Lock background scrolling while fullscreen in `components/public/AccordionLocator.tsx`: activate `useScrollLock(mode === 'fullscreen')` from T003 (FR-009, contract 3.2); confirm map pan/zoom and the MapView activation overlay still work inside the overlay
- [X] T009 [US2] Add resize plumbing to `components/public/MapView.tsx`: new optional prop `resizeSignal?: number` (default 0, contract C1 — the **only** prop change); effect that, on signal change, calls `mapRef.current?.invalidateSize()` immediately **and** once inside `requestAnimationFrame` (guard for mounted map; plan R2); bump the signal from T006's expand path in `components/public/AccordionLocator.tsx` so the map re-renders at fullscreen size with no blank/gray tiles (FR-008-for-expand)
- [X] T010 [US2] Verify expand end-to-end in `components/public/AccordionLocator.tsx` / `components/public/MapView.tsx`: quickstart Q-03 (fills viewport, page content hidden, Expand→Minimize swap) and Q-04 (scroll locked via touch/wheel/keys while map pan still works); sanity-check the map renders tiles correctly at fullscreen size (fully re-verified in US5)

**Checkpoint**: US2 delivers and is testable — however FR-008's "both transitions" clause completes in US5; US3 must follow US2 (same file, shared state).

---

## Phase 5: User Story 3 — Minimize and return exactly where the user left off (Priority: P1)

**Goal**: Tapping Minimize returns the map to its normal in-page size/position and restores the exact pre-expand scroll position; an open detail popup survives the transition (FR-005/FR-006/FR-017).

**Independent Test**: Scroll to a distinctive position → expand → Minimize → page returns to the same position (within ±10px, never top) with the map at normal size; with a popup open, Minimize keeps the popup visible over the normal-size map.

- [X] T011 [US3] Implement `handleMinimize()` in `components/public/AccordionLocator.tsx` per contract 3.3/3.6: idempotent guard (`if mode !== 'fullscreen' return`), set mode `normal`, restore scroll via `window.scrollTo({ top: capturedScrollY, behavior: 'instant' })` **after** the class swap (FR-006, SC-003 ±10px — never smooth, never top); pop the pushed history entry via `history.back()` only when this feature's entry exists (delegates the actual state change to the popstate path from US6 — see T019/T020; until US6 lands, fall back to direct state change so US3 ships standalone)
- [X] T012 [US3] Render the Minimize button overlay in `components/public/AccordionLocator.tsx` (Pair with T007): `type="button"`, `aria-label="تصغير الخريطة"` (FR-007), lucide `Minimize2` icon `aria-hidden`, same 44px/focus/placement/`stopPropagation` rules; visibility: rendered iff `mode === 'fullscreen'` at **any** viewport width (rotation dead-end prevention — contract C4.4, FR-005/FR-014)
- [X] T013 [US3] Guarantee popup survival: confirm minimize in `components/public/AccordionLocator.tsx` never calls `closePopup`-equivalent behavior or clears `selectedId` (contract 3.8, FR-017 — the Leaflet popup is the feature-001 "detail bottom sheet" surface, research R8); verify a popup opened before minimize stays open and correctly anchored over the normal-size map (quickstart Q-08)
- [X] T014 [US3] Verify scroll restore at three distinct scroll depths (shallow/mid/deep) in `components/public/AccordionLocator.tsx`: each within ±10px of pre-expand (SC-003, quickstart Q-06); confirm rapid minimize taps never strand the mode (final state == last tap)

**Checkpoint**: US2 + US3 form the complete expand/minimize loop — the headline feature works end-to-end.

---

## Phase 6: User Story 4 — Keep point details usable while expanded (Priority: P2)

**Goal**: Tapping a marker while fullscreen opens the detail popup above the fullscreen map; the map stays expanded (FR-010/FR-013).

**Independent Test**: Fullscreen → tap any marker → popup opens above the map; dismiss it → map is still fullscreen.

- [X] T015 [US4] Verify FR-010/FR-013 with **no code changes**: in `components/public/AccordionLocator.tsx` confirm `handleSelect` still just toggles `selectedId` + switches to map view (no fullscreen coupling), and in `components/public/MapView.tsx` confirm marker `onSelect`/popup wiring is untouched; then run quickstart Q-07 (popup above fullscreen map, no auto-minimize, popup content correct including در cluster-adjacent single markers). If any code *does* need touching to keep the popup above the fullscreen overlay, it must be limited to z-index containment inside the wrapper — with a comment referencing research R8

**Checkpoint**: Fullscreen browsing never dead-ends at marker level.

---

## Phase 7: User Story 5 — Correct rendering through every transition (Priority: P2)

**Goal**: Expand, minimize, and rotation leave no blank/gray tiles; markers stay accurately positioned; center/zoom is preserved (FR-008/FR-014/FR-016).

**Independent Test**: On a mobile viewport, expand/minimize several times and rotate while fullscreen: no gray areas at any point; markers/clusters correct; the panned/zoomed view is preserved through the round trip.

- [X] T016 [US5] Add a rAF-throttled `window` `resize` listener in `components/public/MapView.tsx` that calls `mapRef.current?.invalidateSize()` (rotation and mobile URL-bar height changes — FR-014; plan R2); ensure the listener is added on mount and removed on unmount, and does **not** alter center/zoom or re-trigger `fitBounds`
- [X] T017 [US5] Rotation + preservation pass in `components/public/AccordionLocator.tsx` / `components/public/MapView.tsx`: while fullscreen, rotate 375px→landscape(≥768px) → map re-fits completely (no gray areas) and **Minimize stays visible** (T012 covers this — verify), fullscreen mode persists; confirm center/zoom and any open popup survive expand/minimize round trips (FR-016; quickstart Q-11 R-02); rapid 5× expand/minimize taps → no stuck state, no console errors (quickstart Q-05)
- [X] T018 [US5] Full transition rendering pass in `components/public/MapView.tsx` (+ wrapper in `components/public/AccordionLocator.tsx`): expand/minimize/rotate at 375px and 1440px with zero blank/gray tile areas, markers + clusters in correct positions (55-point dataset, densest city), theme toggle (light/dark) while fullscreen still swaps tiles live (FR-008/FR-014; quickstart Q-05/Q-11, regression R-02); confirm SC-002's <300 ms per transition and SC-006/SC-007

**Checkpoint**: Transition robustness proven — the feature meets SC-002/SC-006/SC-007.

---

## Phase 8: User Story 6 — Minimize with the device back gesture (Priority: P2)

**Goal**: Android back / iOS swipe-back / browser back minimizes an expanded map without navigating away; a second back press navigates normally; history is left exactly as before expanding (FR-011, SC-008).

**Independent Test**: Fullscreen → back → map minimizes, page does not navigate. Back again → standard navigation occurs (never two back presses to leave).

- [X] T019 [US6] Integrate the back-gesture pattern in `components/public/AccordionLocator.tsx` per contract 3.4–3.6 (plan R3): on expand, `history.pushState({ scMap: 'expanded' }, '')`; a `popstate` listener that calls the idempotent minimize only when `event.state?.scMap === 'expanded'` (no other states may trigger it); button-minimize (T011) pops the entry via `history.back()` when present so both exits converge on the same popstate code path; ensure the `useEffect` cleans up the listener on unmount (FR-015)
- [X] T020 [US6] Verify back-gesture behavior in `components/public/AccordionLocator.tsx`: real Android back (or emulated) and iOS swipe-back (or Safari) + browser back: back while fullscreen → minimizes, page stays; `history.length` after minimize == before expand (FR-011 scenario 2); second back while normal → standard navigation (quickstart Q-09/Q-10, SC-008); no popstate leaks when navigating away while fullscreen

**Checkpoint**: All six stories complete — expand/minimize loop is fully platform-idiomatic.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility audit, regression sweep, and end-to-end validation across all stories.

- [X] T021 [P] Accessibility audit across `components/public/AccordionLocator.tsx` (FR-007, SC-004): screen reader announces distinct "تكبير الخريطة" / "تصغير الخريطة" labels; icons `aria-hidden`; both controls keyboard-reachable (tab order respects RTL reading order) with visible token-based focus rings; ≥44×44px touch targets; controls never overlap the locate button or "اضغط للتفاعل" chip; contrast unchanged (no new colors) (quickstart Q-12)
- [X] T022 [P] Regression sweep across `components/public/*`: List↔Map toggle, marker clustering across the full zoom range (Riyadh stress test), activation overlay, locate/recenter button in `components/public/MapView.tsx`, theme tile swap, `fitBounds` initial view, desktop map card pixel-identity (quickstart R-01…R-04)
- [X] T023 [P] Run the complete [quickstart.md](./quickstart.md) (Q-01…Q-14) on ≥375px mobile + 1440px desktop, with back-gesture scenarios on at least one Android surface; verify FR-015 (navigation resets state — no fullscreen residue, body unlocked, no leftover history entry) and SC-001/SC-005; final cleanup: no dead code/unused imports, `package.json` confirmed unchanged, spec checklist updated; prepare PR description with follow-ups (re-verify FR-010/FR-013/FR-017 if a true bottom-sheet component ever replaces the popup — research R8 note; optional polish: animated transitions if SC-002 target ever demands them)

**Checkpoint**: Feature complete and validated end-to-end.

---

## Dependencies & Execution Order

### Phase dependencies
- **Setup (T001)**: baseline gate for all phases.
- **Foundational (T002, T003)**: T002 blocks US2/US3/US6 (control visibility, expand gating); T003 blocks US2 (scroll lock). US1 needs neither and can run alongside.
- **User Stories**: US1 (MVP) first; US2 after US1 (same wrapper classes evolve) + T002/T003; US3 after US2 (shares fullscreen state); US4 after US2 (needs fullscreen) — can run in parallel with US3/US5 (read-only verification); US5 after US2+US3 (needs both transitions); US6 after US2+US3 (back calls the minimize path).
- **Polish (Phase 9)**: after all stories.

### Within / across stories (file-conflict notes)
- `components/public/AccordionLocator.tsx` is edited by **T004 (US1), T006, T007, T008 (US2), T011, T012, T013, T014 (US3), T019 (US6)** — sequential, same file; intentionally **not** `[P]`.
- `components/public/MapView.tsx` is edited by **T009 (US2)** then **T016 (US5)** — sequential.
- `lib/hooks/use-is-mobile.ts` (T002) and `lib/hooks/use-scroll-lock.ts` (T003) are both new, independent files → parallel.
- T015 (US4) verifies `AccordionLocator.tsx`/`MapView.tsx` but modifies nothing (unless a z-index fix is needed — see task text).

### Independent test criteria per story
- **US1**: full-bleed at <768px (zero padding/radius/borders), pixel-identical at ≥768px; no horizontal scrollbar.
- **US2**: expand fills viewport, page content hidden; background scroll impossible; Expand absent ≥768px.
- **US3**: minimize restores size/position + scroll within ±10px; popup survives minimize.
- **US4**: marker popup opens above fullscreen map; no auto-minimize.
- **US5**: no blank/gray tiles across expand/minimize/rotate; markers correct; center/zoom preserved.
- **US6**: back minimizes in-page; single-entry history; second back navigates normally.

### Parallel opportunities
- Phase 2: T002 ∥ T003.
- US1 (T004/T005) can run in parallel with Phase 2 (different files).
- US4 (T015) can run in parallel with US3/US5/US6 (read-only verification after US2).
- Phase 9: T021 ∥ T022 ∥ T023.

---

## Parallel Example: Foundational hooks + US1

```bash
# Launch together (all different files):
Task: "Create lib/hooks/use-is-mobile.ts"                  # T002
Task: "Create lib/hooks/use-scroll-lock.ts"                # T003
Task: "Full-bleed classes in components/public/AccordionLocator.tsx + verification"  # T004/T005 (US1)
```

---

## Implementation Strategy

### MVP first (US1 only)
1. Phase 1 (T001) + Phase 3 US1 (T004–T005) — full-bleed mobile map is the spec's baseline ask; pure CSS, zero risk.
2. **STOP & VALIDATE** via quickstart Q-01/Q-02 — deploy/demo-able independently.

### Incremental delivery (one PR per concern — plan "Suggested delivery increments")
1. US1 (T004–T005) → full-bleed mobile map, **MVP**.
2. US2 (T006–T010) → expand + fullscreen overlay (with resize invalidation).
3. US3 (T011–T014) → minimize + scroll restore + popup survival.
4. US4 (T015) → verification-only (rides with US2's PR if the z-index fix is needed, else standalone).
5. US5 (T016–T018) → rotation listener + transition robustness verification.
6. US6 (T019–T020) → back-gesture minimize (sits on top of US3's minimize path).
7. Phase 9 (T021–T023) → a11y + regression + full quickstart pass.

Each increment is independently revertible (plan §Suggested delivery increments); highest-risk review areas are US6 (history integration) and the MapView resize plumbing (T009/T016) — keep those diffs minimal and isolated.

---

## Notes
- [P] = different files, no dependency on an incomplete task.
- [Story] label maps a task to its user story for traceability.
- No test tasks: validation is manual via quickstart.md (no test infra; adding one is a flagged follow-up, not in scope).
- Zero new dependencies — `package.json` must remain untouched.
- Commit after each task or logical group; each user story is its own PR.