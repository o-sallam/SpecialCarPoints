# Tasks: Sales Points Directory — UI/UX Redesign

**Input**: Design documents from `/specs/001-sales-points-redesign/` — [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/component-contracts.md](./contracts/component-contracts.md), [quickstart.md](./quickstart.md).

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅.

**Tests**: None generated. The project has no automated test infra for the public surface and the spec explicitly defers adding one. Validation is **manual** via [quickstart.md](./quickstart.md). No TDD/test tasks.

**Organization**: Tasks grouped by user story (spec.md P1→P3). The implementation spec's task IDs (T1–T7) map onto these stories: T1+T3→US1, T2→US2, T4+T7→US3, T6→US4, T5→US5. **Each story = its own PR/commit**; US4 (clustering) lands as an **isolated PR** (spec §10).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no dependency on an incomplete task).
- **[Story]**: which user story (US1–US5).
- Exact file paths are included in every task.

## Path conventions

Single-project Next.js App Router. Components in `components/public/`, primitives in `components/ui/`, libs in `lib/`, tokens in `app/globals.css`. The locator lives on the home page (`app/(public)/page.tsx` → `AccordionLocator`); `/sales-points` redirects to `/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the single new dependency this feature requires.

- [X] T001 Add Leaflet marker-clustering dependencies to `package.json` (`leaflet.markercluster`, `react-leaflet-cluster`, `@types/leaflet.markercluster`) and run install — confirm `react-leaflet-cluster` resolves against `react-leaflet@4.2.1` (else fall back to direct `leaflet.markercluster` per [research.md](./research.md) R1)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared tokens/utilities referenced by multiple user stories.

- [X] T002 [P] Verify/extend shared design tokens in `app/globals.css` per plan §2 — confirm `--radius-sm/md/lg/xl`, `--duration`, `--ease`, and a distinct `--color-surface-raised` exist for both `:root` and `[data-theme='dark']`; add only what is missing (no new palette, no hex in components)
- [X] T003 [P] Add `useActiveTheme()` reactive hook in `lib/hooks/use-active-theme.ts` (reads `document.documentElement.dataset.theme`, subscribes via `MutationObserver`) for runtime theme-dependent rendering — no `next-themes` (see [research.md](./research.md) R4)

**Checkpoint**: tokens confirmed + theme hook ready; user-story work can begin.

---

## Phase 3: User Story 1 — Simplify & responsive toolbar (Priority: P1) 🎯 MVP

**Goal**: Remove the text search entirely and re-layout the toolbar to one row on desktop / two rows on mobile, with "use my location" kept in the filter row in both views.

**Independent Test**: On mobile (375px) and desktop (≥768px), no search UI remains; filters (الكل/VIP/عادي) update counts correctly; desktop shows filters+toggle on one row; mobile shows filters row + toggle row; "use my location" is grouped with the filters and works in both List and Map views.

- [X] T004 [US1] Remove the search input, its icon, the clear button, the `query` state, and the `searched` text-filter memo from `components/public/AccordionLocator.tsx`; keep `filterByCategory`/`groupByCity` and the nearest-location proximity-sort logic; re-derive `vipCount`/total from `points` instead of `searched`
- [X] T005 [US1] Refactor the toolbar layout in `components/public/AccordionLocator.tsx`: desktop (`md+`) one row — filters + "use my location" on the start side, view toggle on the end side via logical `justify-between`; mobile (`<md`) row 1 = filters + "use my location" (horizontally scrollable, `flex-nowrap`, hidden scrollbar, no wrap), row 2 = the view toggle
- [X] T006 [US1] Remove any orphaned search-placeholder copy/i18n strings left by the removal — grep `app/`, `components/`, `lib/` for `ابحث عن مدينة` and delete matches; verify `EmptyState` (which received `query`) is updated to no longer reference search
- [X] T007 [US1] Verify filter counts (الكل/VIP/عادي) match visible points and the header summary after search removal in `components/public/AccordionLocator.tsx`; confirm no console errors or unused-import warnings

**Checkpoint**: US1 fully functional and testable independently (Scenario A in quickstart.md).

---

## Phase 4: User Story 2 — Animated accessible view toggle (Priority: P2)

**Goal**: Replace the List/Map toggle with a segmented control whose active indicator slides smoothly, fully keyboard-operable and RTL-correct (drop-in replacement; same prop surface).

**Independent Test**: Click and arrow-key toggle the view and the indicator slides (not snaps); ARIA tablist exposes the 2-option group with selection; each segment ≥44×44px; slide direction correct under `dir=rtl`; works in both themes.

- [X] T008 [US2] Redesign the `ViewToggle` in `components/public/AccordionLocator.tsx` into a segmented control with an absolutely-positioned sliding indicator (animated via `transform: translateX()`, RTL-aware/logical positioning), preserving `role=tablist`/`role=tab`/`aria-selected` and adding arrow-key + Enter/Space activation; segments ≥44×44px; do not re-mount the control on switch
- [X] T009 [US2] Verify the redesigned toggle integrates into the US1 toolbar layout at both breakpoints and the slide direction is correct under RTL in `components/public/AccordionLocator.tsx`; confirm both themes render correctly

**Checkpoint**: US1 (laid-out toolbar) AND US2 (animated toggle) work together.

---

## Phase 5: User Story 3 — Full-width hero + expanded footer (Priority: P3)

**Goal**: Add a premium, full-bleed hero with live stat chips above the toolbar, and expand the footer into a well-spaced brand/social/legal layout.

**Independent Test**: Hero spans 100vw while the toolbar/list stay inside the existing container; stat chips show live counts (not hardcoded); footer has about + social + legal in a multi-column (desktop) / stacked (mobile) layout; no broken image and no layout shift.

- [X] T010 [P] [US3] Create `components/public/Hero.tsx`: full-bleed (`w-screen`) `next/image` with `fill`+`priority` over a gradient-fallback `div` (no broken-image, reserved `min-h-[320px] md:min-h-[420px]`), a legible scrim, the existing eyebrow badge + H1 + description copy **verbatim**, and 3 stat chips from live props (`totalPoints`, `regionCount`, `vipCount`); leave `// TODO: replace with real hero image` and stage asset at `public/images/hero/sales-points-hero.jpg`
- [X] T011 [P] [US3] Expand `components/public/Footer.tsx`: brand/about column (reuse logo from `public/special-car-logo.avif`/`darkmode-special-car-logo.png` + neutral About fallback with `// TODO: insert approved About copy`), social links via the existing `components/public/SocialIcons.tsx` rendered with placeholder props + `// TODO: add real social URLs`, and the existing © Special Car {year} + `specialcarsa.com` legal row; `border-t` divider, `py-12 md:py-16`, multi-column grid on desktop / `space-y-8` stacked on mobile; **omit** the "Quick links" column
- [X] T012 [US3] Mount `<Hero/>` above the toolbar **outside** the `container` wrapper, and keep toolbar/list inside the existing `max-w-*` container, in `components/public/AccordionLocator.tsx` (and pass live `totalPoints`/`regionCount`/`vipCount` from `app/(public)/page.tsx` or compute in the locator)
- [X] T013 [US3] Contrast-check hero text over the scrim at 375/768/1440px in both themes (WCAG AA) for `components/public/Hero.tsx`; confirm the gradient fallback shows (no broken image) and reserved height prevents CLS

**Checkpoint**: Hero + footer deliver the premium first/last impression independently of the toolbar/map work.

---

## Phase 6: User Story 4 — Map clustering + theme-aware tiles (Priority: P3)

**Goal**: Cluster dense markers and decluster on zoom (brand-styled, accessible), and switch to dark tiles in dark mode — all inside the existing Leaflet map view. **Land as an isolated PR** (spec §10).

**Independent Test**: Riyadh's ~12 points cluster when zoomed out and reach all-individual markers at max zoom; cluster click fits bounds; individual marker click triggers the existing popup/selection; dark mode shows dark (CARTO) tiles, light mode shows OSM tiles, switching live.

- [X] T014 [US4] Wrap the markers in `<MarkerClusterGroup>` (`react-leaflet-cluster` over `leaflet.markercluster`) in `components/public/MapView.tsx`; brand-style the cluster icon (circular `var(--color-primary)` badge, white count) with an `aria-label`/`title` like "N نقطة بيع في هذه المنطقة"; keep default progressive declustering; preserve the existing marker popup + `onSelect` behavior for individual markers; wrap clusterer init in try/catch with a fallback to plain markers
- [X] T015 [US4] Make the tile layer theme-aware in `components/public/MapView.tsx` using `useActiveTheme()` from `lib/hooks/use-active-theme.ts`: dark mode → CARTO `dark_all` tiles (attribution `&copy; OpenStreetMap &copy; CARTO`); light mode → existing OSM tiles; swap the layer live on theme toggle
- [X] T016 [US4] Verify clustering across the full zoom range over the densest region (Riyadh) and a 1-point region in `components/public/MapView.tsx`; verify no marker create/teardown console errors on rapid List↔Map switching; verify dark tiles in dark mode and light tiles in light mode with attribution intact

**Checkpoint**: Map is usable at the 55-points/21-regions scale and visually coherent in both themes.

---

## Phase 7: User Story 5 — Polish & accessibility (Priority: P3)

**Goal**: Consistent hover/focus/motion and visible focus rings across the whole directory, with the VIP distinction preserved. Applies to the **final** structure (do after US1–US4).

**Independent Test**: Tab through the toolbar + first region row → visible focus on every control; accordion animates; cards/pills/buttons share one motion timing; VIP gold border + "VIP" text intact in all states; both themes pass WCAG AA.

- [X] T017 [US5] Add card hover/focus states (surface→`--color-surface-raised`, subtle `--color-primary` border shift, ~`-2px` lift via `transform`) to `components/public/EntryCard.tsx` and `components/public/RegionGroup.tsx` using the shared `--duration`/`--ease` tokens; **preserve** the VIP gold left-border and "VIP" badge unchanged
- [X] T018 [US5] Ensure visible focus rings on all interactive controls — add `focus-visible:ring` (primary ring + offset) to the accordion header in `components/public/RegionGroup.tsx`, the toggle and pills in `components/public/AccordionLocator.tsx` and `components/public/CategoryFilters.tsx`, and `components/public/GeolocationButton.tsx`; confirm filter-pill hover states already present in `CategoryFilters.tsx`
- [X] T019 [US5] Standardize the vertical spacing rhythm between sections (e.g. `py-8 md:py-12`) in `components/public/AccordionLocator.tsx`; confirm the accordion height animation + chevron rotation in `components/public/RegionGroup.tsx` already use the shared `--duration`/`--ease` tokens (the grid-rows animation already exists — do not rebuild it)
- [X] T020 [US5] Accessibility pass across `components/public/AccordionLocator.tsx`, `CategoryFilters.tsx`, `RegionGroup.tsx`, `EntryCard.tsx`, and `GeolocationButton.tsx`: verify keyboard tab-order follows RTL reading order, every interactive control has a visible focus indicator, color contrast meets WCAG AA in both themes, and VIP is non-color-only (gold border + "VIP" text); confirm no unrelated VIP/icon elements were altered

**Checkpoint**: Whole directory is polished and accessibility-verified.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation and cleanup spanning all stories.

- [X] T021 [P] Run the full [quickstart.md](./quickstart.md) validation (Scenarios A–E + cross-cutting checks at 375/768/1440px, keyboard-only, both themes, RTL, and clustering zoom over Riyadh)
- [X] T022 [P] Final cleanup: confirm no dead code/unused imports remain from the search removal, confirm `package.json` added only the single clustering dependency (no new UI/animation/icon library), and prepare the PR description listing follow-ups — view persistence, missing empty/loading/geolocation-denied states, quantified perf targets, hero image asset TODO, and real social URLs TODO

---

## Dependencies & Execution Order

### Phase dependencies
- **Setup (Phase 1)**: T001 blocks US4 only (clustering dep). T002/T003 (Foundational) are independent and can run now.
- **Foundational (Phase 2)**: T002 used by US1/US3/US5 (tokens); T003 used by US4 (map tiles).
- **User Stories (Phase 3–7)**: US1 (MVP) first; US2 drop-in integrates into US1's toolbar; US3 (hero/footer) is independent of US1/US2; US4 (map) is independent (separate file `MapView.tsx`) but should **merge as its own isolated PR**; US5 **must follow** US1–US4 (polish applies to the final structure).
- **Polish (Phase 8)**: after all stories.

### Within / across stories (file-conflict notes)
- `components/public/AccordionLocator.tsx` is edited by **T004, T005, T008, T012, T019** — these are **sequential** (same file), in the order listed. They are intentionally **not** marked `[P]`.
- `components/public/MapView.tsx` is edited by T014 + T015 (sequential within US4).
- T010 (new `Hero.tsx`) and T011 (`Footer.tsx`) touch **different files** → parallel.

### Independent test criteria per story
- **US1**: no search UI; correct filter counts; one-row desktop / two-row mobile toolbar; location button in filter row, both views.
- **US2**: sliding (not snapping) toggle; keyboard-operable ARIA tablist; ≥44px; RTL-correct; both themes.
- **US3**: 100vw hero with live stat chips + container-bounded content below; expanded footer (about/social/legal); no broken image / no CLS.
- **US4**: clustering across full zoom (Riyadh stress test) → all-individual at max zoom; cluster fit-bounds; marker-click regression-free; dark tiles in dark mode.
- **US5**: keyboard focus rings everywhere; shared motion; WCAG AA both themes; VIP distinction preserved.

### Parallel opportunities
- Phase 2: T002 ∥ T003.
- US3: T010 ∥ T011 (different files).
- Phase 8: T021 ∥ T022.
- US4 (T014/T015) can proceed in parallel with US3 (T010/T011) since they touch different files — but US4 ships as its own isolated PR.

---

## Implementation Strategy

### MVP first (US1 only)
1. Phase 1 Setup (T001) + Phase 2 Foundational (T002, T003).
2. Phase 3 US1 (T004–T007).
3. **STOP & VALIDATE** via quickstart Scenario A — the directory already delivers its core value (simpler, faster discovery) without hero/clustering/footer.

### Incremental delivery (one PR per concern)
1. US1 (T001–T007) → simpler toolbar, **MVP**.
2. US2 (T008–T009) → animated toggle.
3. US3 (T010–T013) → hero + footer.
4. US4 (T014–T016) → **isolated PR** (clustering + dark tiles) — revertible independently.
5. US5 (T017–T020) → polish + a11y.
6. Phase 8 (T021–T022) → validate + cleanup.

Each increment is independently revertible (spec §10); only US4 is medium-high risk and must stay isolated.

---

## Notes
- [P] = different files, no dependency on an incomplete task.
- [Story] label maps a task to its user story for traceability.
- No test tasks: validation is manual via quickstart.md (no test infra; adding one is a flagged follow-up, not in scope).
- Commit after each task; each user story is its own PR (US4 isolated).
