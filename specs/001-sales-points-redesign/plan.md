# Implementation Plan: Sales Points Directory — UI/UX Redesign

**Branch**: `001-sales-points-redesign` | **Date**: 2026-08-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-sales-points-redesign/spec.md`

## Summary

Redesign of the Special Car sales-points directory (Arabic, RTL) on the home page (`AccordionLocator`). The work is presentational/interactional on an existing Next.js page — no data-model or API changes. It removes the toolbar text-search, redesigns the List/Map toggle into an animated, keyboard-accessible segmented control, re-lays out the toolbar responsively (one row desktop / two rows mobile), adds a full-width hero with live summary stat chips, expands the footer, adds Leaflet marker clustering (with theme-aware dark tiles) for the 55-points/21-regions dataset, and applies shared motion + accessibility polish. Delivered as independently-revertible increments (one PR per concern), with the clustering change isolated.

## Technical Context

**Language/Version**: TypeScript 5.4, React 18, Next.js 14.2 (App Router), Node ≥18.

**Primary Dependencies**:
- Tailwind CSS 3.4 + `tailwindcss-animate`; design tokens as CSS custom properties in `app/globals.css`.
- shadcn/ui primitives (`components/ui/*`) on Radix UI — **present and to be extended where they fit** (assumption A3 corrected). Existing relevant primitives: `accordion`, `tabs`, `button`, `badge`, `switch`, `separator`.
- `leaflet@1.9.4` + `react-leaflet@4.2.1` (map view). Clustering to be added: `leaflet.markercluster` + a react-leaflet v4-compatible wrapper (`react-leaflet-cluster`), see [research.md](./research.md).
- `lucide-react` (icons) — reuse; do not add an icon library.
- `next-themes` is listed in `package.json` but is **NOT used** — see Constraints.

**Storage**: MongoDB (read-only for this feature). Points via `lib/data/places.ts` (`getPlaces`, `unstable_cache` tag `places`), joined with cities/neighborhoods. **No schema changes**; `POSEntry` already exposes `lat`, `lng`, `vip` client-side.

**Testing**: No automated test infrastructure exists for the public surface (no Jest/Vitest/Playwright). Per spec, **do not introduce a new framework** — manual verification is the bar (see [quickstart.md](./quickstart.md)). No test tasks are generated.

**Target Platform**: Web, modern evergreen browsers. Arabic, `dir="rtl"`, mobile-first.

**Project Type**: Web application (Next.js App Router, single repo with `(public)` and `(admin)` route groups).

**Performance Goals**: Hero image is LCP-relevant → eager load + reserved layout space (no CLS); toggle/accordion/card interactions smooth (use transform/opacity, GPU-friendly); map stays code-split (`next/dynamic({ ssr:false })`, already in place) so it is not loaded for list-only visitors.

**Constraints**:
- WCAG AA contrast in **both** light and dark themes; keyboard-operable controls with visible focus rings; ≥44px touch targets.
- RTL-correct (logical CSS, slide direction, row alignment).
- **No new libraries** beyond the single Leaflet clustering dependency. No new UI kit / animation lib / icon lib.
- **Theme mechanism (SPEC-DEVIATION from spec assumption A5):** the app does **not** use `next-themes`. Theme is driven by a hand-rolled inline script in `app/layout.tsx` that toggles **both** the `.dark` class (shadcn tokens + Tailwind `dark:` variant) **and** the `data-theme="dark"` attribute (custom `--color-*` tokens), persisted in `localStorage["theme"]`; `ThemeSwitcher.tsx` writes the same contract. **All new components MUST use `var(--color-*)` tokens** (which switch via `[data-theme='dark']`) — never hardcoded hex. Leave a `// SPEC-DEVIATION:` comment anywhere code assumed `next-themes`.
- Preserve existing VIP distinction (gold left-border + "VIP" text) and existing marker click/popup behavior — no regressions.
- T6 (clustering) lands as an **isolated PR**; wrap clusterer init in try/catch with fallback to plain markers.

**Scale/Scope**: 55 points across 21 regions; densest city ~12 points. One page (home locator) + its components. Dataset is small — no virtualization.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is in **unfilled template form** (all placeholders: `[PRINCIPLE_1_NAME]`, `[PROJECT_NAME]`, etc.). There are **no project-specific governance principles or gates** defined to enforce. Sensible defaults therefore apply (simplicity / least-architectural-change / preserve existing conventions), consistent with the spec's own §0.1 fallback rule.

**Gate result: PASS** — no constitution gates to violate; no Complexity Tracking entries required. (Re-checked post-design: still PASS — design introduces no new projects, no new patterns beyond extending existing components, and only one new dependency.)

## Project Structure

### Documentation (this feature)

```text
specs/001-sales-points-redesign/
├── plan.md                       # This file
├── research.md                   # Phase 0 decisions (clustering lib, tiles, toggle, theme, image, accordion)
├── data-model.md                 # Existing entities (no schema changes)
├── quickstart.md                 # Manual validation guide
├── contracts/
│   └── component-contracts.md    # Component prop contracts (API unchanged)
├── checklists/
│   └── requirements.md           # Spec quality checklist
└── tasks.md                      # /speckit.tasks output
```

### Source Code (repository root)

```text
app/
├── layout.tsx                      # root: fonts, RTL <html>, theme inline-script (NO next-themes)
├── globals.css                     # tokens: :root (light), [data-theme='dark'] (--color-*), .dark (shadcn)
└── (public)/
    ├── layout.tsx                  # <Header/> <main/> <Footer/>
    ├── page.tsx                    # HOME = locator: server component fetches points → <AccordionLocator/>
    └── sales-points/page.tsx       # permanent redirect to "/" (not the locator)
components/
├── public/
│   ├── AccordionLocator.tsx        # MAIN orchestrator: heading, toolbar (filters/search/toggle/locate), list/map
│   ├── CategoryFilters.tsx         # tier pills (الكل/VIP/عادي) — role=tablist, scrollable
│   ├── RegionGroup.tsx             # custom animated accordion (CSS grid-rows 0fr→1fr + chevron rotate)
│   ├── EntryCard.tsx               # point card with VIP gold accent
│   ├── MapView.tsx                 # Leaflet map (dynamic, ssr:false) — clustering + theme tiles target
│   ├── GeolocationButton.tsx       # "use my location" (drives list proximity-sort + map recenter)
│   ├── Hero.tsx                    # NEW (full-width hero + stat chips)
│   ├── Header.tsx / Footer.tsx     # Footer to be EXPANDED
│   ├── ThemeSwitcher.tsx           # toggles localStorage['theme'] + .dark class + data-theme attr
│   └── SocialIcons.tsx             # REUSED in footer (placeholder props)
└── ui/                             # shadcn primitives (accordion, tabs, button, badge, switch, …)
lib/
├── points.ts                       # POSEntry, Region, groupByCity, filterByCategory, CategoryId
├── geo.ts                          # haversineKm
├── data/{places,cities,neighborhoods}.ts  # cached Mongo reads
└── (NEW) hooks/use-active-theme.ts # runtime theme observer for map tiles
public/
├── special-car-logo.avif
└── darkmode-special-car-logo.png
```

**Structure Decision**: Single-project web app (Next.js App Router). All work is additive/refactor inside `components/public/` + `lib/`, plus token edits in `app/globals.css`. No new packages, apps, or route groups.

## Complexity Tracking

> None — Constitution Check passes with no violations to justify.
