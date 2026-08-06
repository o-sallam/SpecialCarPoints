# Implementation Plan: Admin — Sales Point Geographic Coordinate Management

**Branch**: `002-admin-coordinate-picker` | **Date**: 2026-08-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-admin-coordinate-picker/spec.md`

## Summary

Enhance the admin sales-point create/edit form (`components/admin/SalesPointForm.tsx`) so staff can set a sales point's `latitude`/`longitude` two ways instead of typing raw decimals: (1) an interactive **map location picker** (click/drag a marker, with a live editable coordinate field), and (2) **pasting a Google Maps URL** — including short links (`goo.gl` / `maps.app.goo.gl`), which are resolved through a new admin-authenticated, SSRF-guarded server endpoint. A pure, dependency-free `googleMapsUrlParser` utility handles the four full-URL coordinate formats client-side; short links are "resolve-then-parse" using the same utility. The existing `lat`/`lng` fields and Zod schema are tightened to enforce range + both-or-neither validation on the client **and** server. The picker reuses the project's confirmed Leaflet + react-leaflet stack (with theme-aware tiles) and the existing shadcn `Dialog`/`Tabs`/`Input` primitives — introducing no new map provider, no URL-parsing package, and no HTTP-client library. Delivered as independently-revertible increments, with the short-link endpoint and the form/API validation changes isolated (highest-risk review areas).

## Technical Context

**Language/Version**: TypeScript 5.4, React 18, Next.js 14.2 (App Router), Node ≥18.

**Primary Dependencies** (all already present — none added):
- `leaflet@1.9.4` + `react-leaflet@4.2.1` (map renderer — reused for the picker; react-leaflet v4 declarative API used here, unlike the public `MapView` which uses imperative Leaflet for clustering).
- `zod@3.22` (server + shared validation — `salesPointSchema` in `lib/validators.ts` is tightened, not replaced).
- Radix UI via shadcn primitives in `components/ui/` — `dialog.tsx`, `tabs.tsx`, `input.tsx`, `label.tsx`, `button.tsx` are reused (Dialog gives focus-trap + Escape; Tabs gives arrow-key nav for free).
- `iron-session` (`lib/session.ts`, `getSession()`) — reused to guard the new endpoint (`session.isAdmin`).
- `mongodb` (`lib/mongodb.ts`) — unchanged; `lat`/`lng` already stored as BSON doubles (full ≥6-decimal precision, no migration).
- `sonner` (toasts) + `lucide-react` (icons) — reused; no new icon/toast library.

**Storage**: MongoDB, collection `sales_points`. **No schema migration** — `lat`/`lng` are already nullable doubles (`lib/types.ts` `SalesPoint`). The only data-layer change is tightening the **Zod** validation (`lib/validators.ts`) for range `[-90,90]`/`[-180,180]` and both-or-neither. BSON double round-trips ≥6 decimals with no truncation.

**Testing**: No automated test runner exists (no Jest/Vitest/Playwright, no `test` script; empty `__tests__/`). Per spec, **do not introduce a new framework** — manual verification is the bar (see [quickstart.md](./quickstart.md)). The highest-value automated tests (parser unit tests, SSRF host-allowlist regression) are recorded as follow-ups to add *if/when* a runner is introduced (spec "Suggested follow-ups"). No test tasks are generated.

**Target Platform**: Web, modern evergreen browsers. Arabic, `dir="rtl"`. Admin panel (`app/(admin)/admin/...`), already auth-gated by `middleware.ts` (cookie presence) + per-route `getSession().isAdmin`.

**Project Type**: Web application (Next.js App Router, single repo with `(public)` and `(admin)` route groups).

**Performance Goals**: Map + picker code must be **code-split** out of the initial admin form page load (mirror the public map's `next/dynamic({ ssr:false })`); short-link resolution must enforce a **≤5s server timeout**; picker interactions (marker drag, tab switch) stay smooth (transform/opacity-friendly).

**Constraints**:
- **No new map provider** (no Google Maps JS API, no Mapbox) — reuse Leaflet (spec FR-002/FR-020).
- **No external Google-Maps-URL-parsing package** — a small owned utility (spec FR-007/FR-020, §12).
- **No new HTTP-client library** — use the runtime's built-in `fetch` for redirect-following (spec §12).
- **SSRF guard**: the resolution endpoint enforces a server-side short-link host allowlist, a max-redirect count, and a timeout; it never fetches/parses HTML body (spec FR-010/FR-011).
- **Admin-gated**: the endpoint reuses `getSession().isAdmin` (401 otherwise), same as the other admin write routes (spec FR-010, A4).
- **Server re-validates** `lat`/`lng` independently of the UI (spec FR-013); client validation alone is insufficient.
- **WCAG AA**: keyboard-operable, focus-trapped dialog, `aria-live` for the extract loading state, errors associated via `aria-describedby`; the map's own keyboard nav stays enabled (spec FR-018).
- **Theme (SPEC-DEVIATION note, not a change):** the app does **not** use `next-themes`. Theme is an inline script in `app/layout.tsx` + `ThemeSwitcher` setting `.dark` + `data-theme`, read reactively via `useActiveTheme()` (`lib/hooks/use-active-theme.ts`). The admin chrome has **no theme toggle**, but `data-theme` is still applied globally (localStorage/system), so the picker reuses `useActiveTheme()` + the same CARTO-dark/OSM-light conditional tile logic as the public `MapView` for consistency — harmless if the admin never toggles. All new UI uses `var(--color-*)` tokens, never hardcoded hex.

**Scale/Scope**: One admin form (create + edit pages share `SalesPointForm`), one new modal (3 components), one pure utility module, one new route handler, and a one-line Zod tightening. The ~55-point dataset is unchanged.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is in **unfilled template form** (all placeholders: `[PRINCIPLE_1_NAME]`, `[PROJECT_NAME]`, etc.). There are **no project-specific governance principles or gates** to enforce. Sensible defaults therefore apply — **simplicity / least-architectural-change / reuse existing conventions** — consistent with the spec's own §0.1 fallback rule.

**Gate result: PASS** — no constitution gates to violate; no Complexity Tracking entries required. Re-checked post-design (Phase 1): **still PASS** — the design adds no new projects/apps/packages, introduces **zero** new dependencies, extends existing components and conventions, and adds one new admin-scoped route (justified by the SSRF boundary, not novelty).

## Project Structure

### Documentation (this feature)

```text
specs/002-admin-coordinate-picker/
├── plan.md                            # This file
├── research.md                        # Phase 0 decisions (parser, endpoint/SSRF, theme tiles, validation, etc.)
├── data-model.md                      # Existing SalesPoint (validation tightened) + transient picker/parse types
├── quickstart.md                      # Manual validation runbook
├── contracts/
│   └── api-and-component-contracts.md # New endpoint contract + modified API validation + component/util prop contracts
├── checklists/
│   └── requirements.md               # Spec quality checklist (all passing)
└── tasks.md                           # /speckit.tasks output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── layout.tsx                          # root: RTL <html>, theme inline-script (NO next-themes) — unchanged
├── globals.css                         # var(--color-*) tokens shared with admin — unchanged
├── (admin)/admin/
│   ├── layout.tsx                      # admin shell — unchanged
│   └── sales-points/
│       ├── new/page.tsx                # create — uses <SalesPointForm> — unchanged wrapper
│       └── [id]/page.tsx               # edit  — uses <SalesPointForm initialData> — unchanged wrapper
└── api/
    ├── sales-points/
    │   ├── route.ts                    # POST create — Zod salesPointSchema (lat/lng validation TIGHTENED, no shape change)
    │   └── [id]/route.ts               # PUT update — same schema tightening
    └── admin/
        └── resolve-map-url/route.ts    # NEW — short-link redirect resolution (admin-gated, SSRF-guarded)
components/
├── admin/
│   ├── SalesPointForm.tsx              # MODIFIED — "اختر من الخريطة" trigger; Confirm writes via update('lat'/'lng'); client range guard
│   └── location-picker/                # NEW subgroup (3 tightly-coupled files)
│       ├── LocationPickerModal.tsx     # Dialog + Tabs, shared {lat,lng} state, Confirm/Cancel
│       ├── MapPickerTab.tsx            # react-leaflet map (dynamic import, ssr:false), click/drag, editable readout, theme tiles
│       └── GoogleMapsUrlTab.tsx        # URL input + استخراج الإحداثيات + loading/error states + aria-live
└── ui/                                 # shadcn primitives — REUSED (dialog, tabs, input, label, button)
lib/
├── validators.ts                       # MODIFIED — salesPointSchema lat/lng: range + both-or-neither (superRefine)
├── google-maps-url-parser.ts           # NEW — pure util: parseGoogleMapsUrl(url) → typed ParseResult (no deps, no DOM)
├── coordinates.ts                      # NEW — shared LAT_RANGE / LNG_RANGE / KSA_BBOX + isInRange / ksaWarning (client+server)
├── geo.ts                              # EXISTING haversineKm/formatDistance — reused for the OPTIONAL distance readout
├── session.ts                          # getSession() — reused to guard the new endpoint
├── mongodb.ts                          # connectToDatabase() — unchanged
└── hooks/use-active-theme.ts           # reused by MapPickerTab for theme-aware tiles
```

**Structure Decision**: Single-project web app (Next.js App Router). All work is **additive** inside `components/admin/` (new `location-picker/` subgroup for the 3 coupled picker files), `lib/` (two new modules + one tightened schema), and one new `app/api/admin/` route. No new packages, apps, or route groups. The new `/api/admin/` subgroup is created (rather than the flat `/api/<name>` convention) because the endpoint is admin-gated and SSRF-sensitive — the subgroup makes the security boundary self-documenting; it is purely additive and does not alter the existing flat routes.

## Complexity Tracking

> None — Constitution Check passes with no violations to justify.
