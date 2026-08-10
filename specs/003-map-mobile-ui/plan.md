# Implementation Plan: Map UI Mobile Improvements (Full-Bleed + Expand/Minimize)

**Branch**: `003-map-mobile-ui` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-map-mobile-ui/spec.md`

## Summary

Make the Map View (`AccordionLocator` → `MapView`, home page) mobile-first: on viewports <768px the map card breaks out of the container padding and drops its rounded corners/borders to span the full screen width (FR-001/FR-002), and a pair of icon-only overlay controls lets the user **expand** the map to a fixed full-viewport overlay (FR-003/FR-004, background scroll locked, FR-009) and **minimize** it back with prior scroll position restored (FR-005/FR-006). The device back button/gesture minimizes via a single `history.pushState` entry consumed on `popstate` (FR-011); a second back press navigates normally. The map instance is never remounted (Leaflet `mapRef` lives on) — transitions trigger `map.invalidateSize()` so tiles/markers/popups re-render in place (FR-008/FR-014/FR-016, clustering intact). The existing marker detail interaction (feature 001's Leaflet popup + `selectedId` state — **the repo's "detail bottom sheet" surface**) keeps working above the fullscreen map (FR-010/FR-013) and stays open across minimize (FR-017). All behavior is delivered in independently revertible CSS/state/history increments — **zero new dependencies**.

## Technical Context

**Language/Version**: TypeScript 5.4, React 18, Next.js 14.2 (App Router), Node ≥18.

**Primary Dependencies** (all already present — none added):
- `leaflet@1.9.4` + `leaflet.markercluster@1.5.3` — `MapView.tsx` uses **imperative Leaflet** (`L.map` on a ref; react-leaflet exists but is not used by the public map). Resize correctness hinges on `map.invalidateSize()`.
- Tailwind CSS 3.4 + design tokens in `app/globals.css`: spacing `--space-4: 1rem` (container padding below 768px, `--space-6` above), radius `--radius-xl`, z-scale `--z-map: 0 | --z-sticky: 30 | --z-header: 40 | --z-dropdown: 50 | --z-overlay: 1000 | --z-toast: 1100`.
- `lucide-react` (icons) — reuse; no new icon library.
- No new runtime or dev dependencies (spec A7).

**Storage**: None. This feature is pure client-side presentation/state — no data-model, API, or schema changes (`data-model.md` documents only transient UI state).

**Testing**: No automated test runner in the repo (no Jest/Vitest/Playwright; consistent with features 001/002 — **do not introduce one**). Manual verification is the bar; see [quickstart.md](./quickstart.md).

**Target Platform**: Web, modern evergreen browsers (Chrome/Android for hardware back, iOS Safari for swipe-back, desktop devtools for breakpoints). Arabic `dir="rtl"` layout.

**Project Type**: Web application (Next.js App Router, single repo, `(public)` route group; `MapView` already code-split via `next/dynamic({ ssr: false })`).

**Performance Goals**: Expand/minimize transitions complete in **<300 ms** with no blank/gray tile areas (SC-002/SC-008) — the container swap is instant (no CSS width/height animation, which would force invalidate-at-animation-end); `invalidateSize()` runs post-layout (double `requestAnimationFrame`) so tiles re-render from Leaflet's in-DOM cache; scroll restore is instant (`behavior: 'instant'`), never smooth.

**Constraints**:
- **Mobile-only controls**: Expand renders only when `<768px` AND map is normal; Minimize renders in fullscreen at **any** width (a fullscreen map rotated to landscape ≥768px must never dead-end without an exit control).
- **No remount**: the fullscreen map is the *same* `MapView` instance re-sized via CSS class swap (`fixed inset-0 z-[var(--z-overlay)]`) — remounting would lose center/zoom (FR-016), popup state (FR-017), and re-trigger `fitBounds`.
- **Scroll lock with cleanup**: body `overflow: hidden` while fullscreen (FR-009), restored on minimize/unmount/navigation (FR-015) — never left locked.
- **History discipline**: exactly **one** pushed entry per expand (`{ scMap: 'expanded' }`), consumed by the popstate handler on minimize — button-minimize and back-minimize must converge to the same pre-expand history state (FR-011 scenario 2; second back press = normal navigation).
- **Leaflet pane z-indexes stay contained** by `.map-isolate` (`isolation: isolate`); the fullscreen wrapper uses `--z-overlay` (1000) which covers page content incl. sticky header (40) but stays under toasts (`--z-toast` 1100).
- **RTL-safe**: full-bleed via `margin-inline: calc(-1 * var(--space-4))` (logical, not `-mx-4`); control corners use logical placement.
- **WCAG AA**: both controls get Arabic `aria-label`s ("تكبير الخريطة" / "تصغير الخريطة"), ≥44px touch targets, visible focus rings (existing tokens/styles), and must stay above MapView's own "اضغط للتفاعل" activation overlay (`z-[1000]` inside the map subtree).
- **Theme**: MapView's tiles are already theme-aware via `useActiveTheme()` — no theme work in this feature; tile re-render after invalidate uses the existing live-swap effect.
- **Spec surface note (DISCOVERY)**: the spec's "sales point detail bottom sheet (feature 001)" is delivered in-repo as the **Leaflet marker popup + `selectedId` highlight** (no sheet component exists). FR-010/FR-013/FR-017 are planned against that existing surface; `handleSelect` is untouched, so marker→popup behavior is identical in normal and fullscreen modes.

**Scale/Scope**: One page (home locator). Modified: `AccordionLocator.tsx`, `MapView.tsx`. New: two small hooks (`use-is-mobile.ts`, `use-scroll-lock.ts`) + inline expand/minimize controls. ~55-point dataset unchanged; clustering untouched.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is in **unfilled template form** (all placeholders: `[PRINCIPLE_1_NAME]`, `[PROJECT_NAME]`, etc.). There are **no project-specific governance principles or gates** to enforce. Sensible defaults apply — **simplicity / least-architectural-change / reuse existing conventions** (the same reading used by features 001 and 002).

**Gate result: PASS** — no constitution gates to violate; no Complexity Tracking entries required. (Re-checked post-design: **still PASS** — the design modifies two existing components, adds two tiny owned hooks, reuses every existing token/pattern, and introduces **zero** new dependencies.)

## Project Structure

### Documentation (this feature)

```text
specs/003-map-mobile-ui/
├── plan.md                            # This file
├── research.md                        # Phase 0 decisions (fullscreen approach, resize, back gesture, breakpoint, RTL full-bleed)
├── data-model.md                      # Transient Map View State (no persistence, no schema changes)
├── contracts/
│   └── component-contracts.md         # MapView prop changes + page-level fullscreen/back-gesture contracts
├── quickstart.md                      # Manual validation runbook (FR-by-FR)
├── checklists/
│   └── requirements.md                # Spec quality checklist (all passing)
└── tasks.md                           # /speckit.tasks output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── globals.css                        # tokens only — NO changes needed (spacing/radius/z-scale suffice)
└── (public)/
    └── page.tsx                       # server component → <AccordionLocator/> — unchanged

components/
└── public/
    ├── AccordionLocator.tsx           # MODIFIED (orchestration of this feature):
    │                                  #   - fullscreen state + captured scrollY + expand/minimize handlers
    │                                  #   - history pushState/popstate back-minimize integration
    │                                  #   - body scroll lock while fullscreen (via use-scroll-lock)
    │                                  #   - Expand/Minimize overlay buttons (mobile-only, accessible)
    │                                  #   - map wrapper class matrix: normal-mobile (full-bleed,
    │                                  #     rounded-none) / normal-desktop (unchanged) / fullscreen
    │                                  #     (fixed inset-0 z-[var(--z-overlay)]), + resizeSignal bump
    ├── MapView.tsx                    # MODIFIED (minimal, presentational):
    │                                  #   - new prop resizeSignal?: number → double-rAF map.invalidateSize()
    │                                  #   - window 'resize' listener (rAF-throttled) → invalidateSize
    │                                  #     (rotation / URL-bar height changes, FR-014)
    │                                  #   - everything else (markers, clusters, tiles, popup, activation
    │                                  #     overlay, locate button) UNCHANGED
    └── [all other public components]  # unchanged

lib/
└── hooks/
    ├── use-is-mobile.ts               # NEW: SSR-safe matchMedia('(max-width: 767px)') via useSyncExternalStore
    └── use-scroll-lock.ts             # NEW: lock body overflow while active; restores prior value on cleanup
```

**Structure Decision**: Single project (existing Next.js app). No new route groups, no portal, no new files beyond the two hooks. The map card wrapper in `AccordionLocator` is the single element whose classes change between the three visual states (normal-mobile / normal-desktop / fullscreen), keeping the diff small and the increments independently revertible.

**Suggested delivery increments** (for `/speckit.tasks`, each an isolated PR/commit):
1. **Full-bleed mobile styling** — wrapper class changes only (FR-001/FR-002; pure CSS, zero risk).
2. **Expand/minimize** — state, buttons, scroll lock, fullscreen class swap, `resizeSignal` invalidation (FR-003…FR-010, FR-012…FR-017).
3. **Back-gesture minimize** — history entry + popstate integration (FR-011) on top of increment 2.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

None — no constitution violations. The two new hooks are single-purpose utilities (breakpoint detection, scroll lock), not architectural additions.