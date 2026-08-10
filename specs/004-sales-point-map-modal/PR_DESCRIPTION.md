# PR: Sales Point Detail Sheet (Map View) — feature 004

**Branch**: `004-sales-point-map-modal` · **Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

## What

A mobile-first **detail bottom sheet** for Map View marker taps. Tapping an individual
marker slides the sheet up (shadcn `Sheet` primitive, `side="bottom"`, tokens-only) showing
the point in the exact List View format (`displayName` + VIP pill + `cityName • حي
neighborhoodName`), with **الاتجاهات** and **فتح في خرائط Google** actions. The sheet is
dismissible by swipe-down, backdrop tap, close control, and Escape — each clears the marker
highlight.

## The defect fix (isolated commit)

The previous `selectedId` effect ran `flyTo(14)` + `openPopup()` on **every** selection, so a
marker tap at zoom ≥14 visibly zoomed out / panned — perceived as an "unwanted second zoom".
This PR separates the two click handlers: individual-marker clicks call
`L.DomEvent.stopPropagation` and markers are created with `bubblingMouseEvents: false`, so one
tap yields **exactly one outcome** (the sheet, zero map movement). Cluster rendering,
count badge, and zoom-to-bounds are byte-identical. List View keeps today's popup + flyTo
(spec A2), never opening the sheet.

## Increments (one commit / review surface each)

| Story | Commit | Scope |
|-------|--------|-------|
| US1 | sheet primitive + component + integration | MVP: sheet opens/swaps/dismisses, highlight clears |
| US2 | click separation + `selectionOrigin` | **Isolated high-risk PR** — Leaflet event wiring |
| US3 | `lib/maps.ts` builders + actions row | destinations, hide rule, safe links |
| US4+US5 | desktop width containment + viewport-bound sheet + 003 joint row | robustness, rotation/overflow, cross-feature |

## Changes

- **NEW** `components/ui/sheet.tsx` — standard shadcn Sheet on the already-installed
  `@radix-ui/react-dialog@^1.1.23`; **zero new dependencies** (`package.json` untouched).
- **NEW** `components/public/MapDetailSheet.tsx` — sheet content, swipe-down (pointer drag,
  96px threshold / flick), close/backdrop/Escape via Radix.
- **NEW** `lib/maps.ts` — pure `googleMapsLink` / `directionsLink` builders (contract 4).
- **MODIFIED** `components/public/MapView.tsx` — `onSelect(id, origin)`, propagation control,
  effect split, `selectionOrigin` prop (click-behavior only; no renderer changes).
- **MODIFIED** `components/public/AccordionLocator.tsx` — origin state, derived `selectedPoint`
  (clears when filtered out), sheet mounting (map-origin only).
- **MODIFIED** `specs/003-map-mobile-ui/quickstart.md` — reserved Q-15 joint row (FR-020).
- **DOCS** `specs/004-sales-point-map-modal/*` — plan, contracts (contract 1 extended),
  tasks (T001…T021 complete).

## Validation

Automated gates: `tsc --noEmit` + `npm run build` green on every increment.
Manual runbook: [quickstart.md](./quickstart.md) S-01…S-13 + R-01…R-05.

### Pending manual / device verification (recorded here, per plan T019/T021)

The environment has no browser/device surface, so these scenarios are queued for the QA pass
before merge:

- S-01/S-03/S-08/S-09 (open <300 ms, all four dismiss paths, in-place swap, keyboard/screen
  reader) — 375px emulation.
- S-04/S-05/S-06/S-13 (zero map movement incl. >z14, cluster behavior, one-outcome-per-tap,
  list regression) — zoom/center read before/after.
- S-07 (destination resolution + new-tab/app opening) — **real device** for external app links.
- S-10 (rotations, 768/1440 viewports, long-content scroll) — incl. real-device rotation.
- S-12 (filter/selection lifecycle) and R-01…R-05 regression sweep.
- Q-15 / S-11 joint row (detail sheet over 003 fullscreen map) — runs once feature 003.
- Swipe-down gesture on at least one real mobile device (touch event fidelity).

## Follow-ups / flags

- **Q1/Q2 defaults pending user confirmation (spec A14)**: Q1-A same sheet on all viewports
  (FR-019) and Q2-A universal Google Maps directions link (FR-016) were defaulted to unblock
  planning. Each is a **one-line** spec/plan change if overridden:
  - Q1 override → sheet scoped to mobile + popup elsewhere;
  - Q2 override → UA-sniffed Apple Maps link in `lib/maps.ts` `directionsLink`.
- **Automated tests**: when a runner is ever introduced, `lib/maps.ts` is the prime unit-test
  candidate (pure builders, contract 4 verification table ready).
- **Feature 003 joint verification**: Q-15 row appended to `specs/003-map-mobile-ui/quickstart.md`;
  the sheet's z-1001 overlay slot already clears 003's z-1000 fullscreen overlay by token math.
- **Swipe drag**: honors RTL (translateY is direction-agnostic); touch-action none confined to
  the header/grabber surface so the body keeps native pan-y scroll.