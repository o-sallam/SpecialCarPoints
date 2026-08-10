# Quickstart: Sales Point Detail Sheet (Map View) — Validation Runbook

**Branch**: `004-sales-point-map-modal` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Contracts**: [contracts/component-contracts.md](./contracts/component-contracts.md)

## Prerequisites

- Dev environment: `npm run dev` (Next.js 14, TypeScript) at `http://localhost:3000`; the existing data source serves the ~55-point dataset.
- No test framework exists in the repo and none is introduced (plan: manual verification is the bar).
- Test surfaces: **Chrome DevTools** device emulation (375px / 768px / 1440px), **real mobile device** (swipe gesture, external-app links, hardware back), **screen reader or accessibility tree** (labels, focus), and a **zoom range check over the densest city** (clusters ↔ individual markers).
- Feature 003 fullscreen map: only for the S-11 cross-feature row **after** both features land (003 is draft; the row is reserved).

## Scenario Map

| ID | Scenario | FRs | How to run | Expected outcome |
|----|----------|-----|-----------|------------------|
| S-01 | Sheet opens on marker tap | FR-001/002/004 | 375px, Map view, zoom into a city, tap an individual marker | Sheet slides up from the bottom in <300 ms, token-styled (no raw hex), showing that point's details |
| S-02 | Content matches List View | FR-003/004 | Open sheet; open the same point's card in List view | Title, `cityName • حي neighborhood` (or `• extraLabel`) line, VIP badge render identically (SC-002) |
| S-03 | Dismiss paths + highlight clear | FR-007/008 | Open sheet → (a) swipe down, (b) tap backdrop, (c) close button, (d) Escape | Sheet closes each way; marker highlight (accent pin) clears; zero console errors |
| S-04 | No map movement on tap | FR-012, SC-001 | Record `getZoom()`/`getCenter()` via devtools before tapping; tap ≥5 markers incl. points currently zoomed beyond 14 | Zoom and center identical after each tap — no flyTo/pan/popup on the map-origin path; sheet opens only |
| S-05 | Cluster behavior unchanged | FR-011, SC-003 | Zoomed out at country level → clusters show counts; tap ≥10 clusters | Cluster count badges as today; every cluster tap zooms to reveal; **never** opens a sheet |
| S-06 | One outcome per individual tap | FR-013/014, SC-003 | Tap ≥20 individual markers: clustered areas (watch after zoom-in) and free-standing points; include taps right after a cluster zoom animation | Exactly one outcome per tap: sheet opens, no zoom/pan/re-cluster, no delayed second action (SC-003) |
| S-07 | Action buttons & destinations | FR-015/016/018 | (a) point with `googleMapUrl` → open buttons; (b) point with coords only → both coordinate-based; (c) point with neither → no buttons | Buttons open correct destinations in new tab/app (`rel="noopener"`); data-less points show no buttons (SC-006) |
| S-08 | Switching + toggle semantics | FR-008/009 | Sheet open → tap a different marker → tap the original marker again | Content swaps in place without close/reopen; tapping the already-selected marker closes the sheet (SC-005) |
| S-09 | Keyboard & screen reader | FR-010, SC-004 | Tab to markers/clusters (map keyboard nav), open sheet, Tab through actions, Escape | Focus moves into sheet on open; Esc closes; close button announces "إغلاق"; actions reachable with focus-visible rings |
| S-10 | Viewports, rotation, overflow | FR-019/021/022 | 375px → open sheet → rotate to landscape; 1440px → open sheet; 375px short viewport with long-name point | Sheet stays open and correctly positioned on rotation; renders identically on desktop (Q1-A); never exceeds viewport — long content scrolls internally (SC-007) |
| S-11 | Cross-feature: fullscreen map (003) | FR-020 | RESERVED: after 003 lands — fullscreen the map, tap a marker, minimize with sheet open | Sheet opens above the fullscreen map; stays open over the normal-size map after minimize; still fully dismissible |
| S-12 | Filter/selection lifecycle | research R9 | Open sheet for a VIP point → switch filter to عادي (loses VIP) | Selection clears (no dangling sheet/highlight for a hidden point); switching back re-taps works |
| S-13 | List view regression | A2 | From List view, tap a card | Today's behavior: view switches to map, marker flies to + popup opens + highlight — no sheet (SC-008) |

## Regression checks (must stay green)

- **R-01** Marker clustering across the full zoom range (Riyadh stress test) — counts, declustering, cluster zoom-to-bounds.
- **R-02** "اضغط للتفاعل مع الخريطة" activation overlay; locate/recenter button; theme tiles (light/dark) including with the sheet open.
- **R-03** List↔Map toggle; EmptyState; category filter counts; `fitBounds` initial view.
- **R-04** Desktop (1440px) page: map card and List view pixel-identical to pre-feature output.
- **R-05** Site-wide: no console errors on any scenario; page scroll not locked after any dismiss sequence (Radix unlock).

## Definition of Done

All S-01…S-13 pass and R-01…R-05 regressions are green on ≥2 viewports (375px mobile + 1440px desktop), with swipe and external-link scenarios verified on at least one real device. S-11 is exercised in the feature-003 validation run (cross-feature row). Findings recorded in the PR description or spec checklist notes.