# Quickstart: Map UI Mobile Improvements (Full-Bleed + Expand/Minimize) — Validation Runbook

**Branch**: `003-map-mobile-ui` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Contracts**: [contracts/component-contracts.md](./contracts/component-contracts.md)

## Prerequisites

- Dev environment with the app running: `npm run dev` (Next.js 14, TypeScript 5.4) at `http://localhost:3000`.
- **No backend/data setup needed** — the feature is pure client-side; the existing MongoDB-backed data source (or its dev fallback) must serve the ~55-point dataset as today.
- No test framework exists in the repo and none is introduced (plan: manual verification is the bar).
- Test surfaces:
  - **Chrome DevTools** device emulation (375px, 767px, 768px, 1440px) — breakpoint, full-bleed, controls, rotation.
  - **Real Android device/browser** (or Chrome emulation with back-button simulation) — hardware back gesture (FR-011, SC-008).
  - **iOS device** (or Safari responsive mode if available) — swipe-back gesture and overscroll/rubber-band (SC-008, FR-009).
  - **Screen reader** (VoiceOver/TalkBack or Chrome DevTools Accessibility pane) — control labels (FR-007, SC-004).

## Scenario Map

| ID | Scenario | FRs | How to run | Expected outcome |
|----|----------|-----|-----------|------------------|
| Q-01 | Full-bleed mobile | FR-001 | Emulate 375px → Map view | Map spans viewport edge-to-edge: computed `margin-inline: -1rem`, `border-radius: 0`, no side borders; no horizontal page scrollbar introduced |
| Q-02 | Desktop unchanged | FR-002 | 1440px → Map view | Map keeps current padding/rounding/border/shadow: computed `border-radius: var(--radius-xl)`, no negative margin; **no Expand control visible** (FR-012) |
| Q-03 | Expand | FR-003/004 | 375px → Map view → tap Expand | Map fills entire viewport (`fixed inset-0`); header/toolbar/list not visible; Expand button replaced by Minimize |
| Q-04 | Background scroll locked | FR-009, SC-005 | While fullscreen: touch-drag empty area, wheel, arrow/space keys, attempt page scroll | Page does not scroll at all; map pan still works (map interactions unaffected) |
| Q-05 | Transition rendering | FR-008, SC-002/006 | Expand then minimize several times, including 5× rapid taps | No blank/gray tile areas at any point; markers/clusters in correct positions; each transition <300 ms; final mode == last tap |
| Q-06 | Scroll restore | FR-006, SC-003 | Scroll to 3 distinct depths (shallow/mid/deep) → expand → minimize each time | Page returns to within ±10px of pre-expand position each time (never top) |
| Q-07 | Popup over fullscreen | FR-010/013 | Fullscreen → tap any marker (incl. clustered area single marker) → dismiss popup | Detail popup opens above the fullscreen map; map stays fullscreen (no auto-minimize); popup content correct |
| Q-08 | Minimize keeps popup | FR-017 | Fullscreen → open marker popup → Minimize (button) | Popup remains open over the normal-size map with content intact; dismiss as usual |
| Q-09 | Back button minimizes | FR-011, SC-008 | Android (or emulated back): fullscreen → back | Map minimizes to normal state; **page does not navigate away**; behaves identically to tapping Minimize |
| Q-10 | History integrity | FR-011, SC-008 | Fullscreen → back → immediately back again | First back minimizes; second back performs standard navigation (leaves page or prior history entry) — never requires two back presses to exit the page |
| Q-11 | Rotation while fullscreen | FR-014, SC-007 | Fullscreen on 375px emulation → rotate to landscape (≥768px) | Map re-fits and renders completely (no gray areas); **Minimize button still visible**; minimize returns to normal page layout |
| Q-12 | Screen-reader labels | FR-007, SC-004 | Focus controls with AT / inspect accessibility tree | "تكبير الخريطة" on Expand, "تصغير الخريطة" on Minimize; distinct, meaningful announcements; icon `aria-hidden`; ≥44px hit area |
| Q-13 | Navigation resets state | FR-015 | Fullscreen → tap a link / navigate away → return | Page loads in normal state (no fullscreen residue, body scroll unlocked, no leftover history entry) |
| Q-14 | No dead-ends / exit always available | SC-007 | Be fullscreen → rotate → tap Minimize; also back while normal-sized | Every path has an exit; no mode stuck states; console free of errors |
| Q-15 | Detail sheet over fullscreen map — joint with feature 004 (reserved row) | 004 FR-020 | Run after feature 004 lands (its quickstart S-11): fullscreen → tap an individual marker → Minimize with the detail sheet open | The feature-004 detail bottom sheet opens above the fullscreen map (z 1001 > 1000), stays open and fully interactive over the normal-size map after minimize, and remains dismissible (swipe/backdrop/close/Escape) |

## Regression checks (must stay green)

- **R-01** List ↔ Map toggling still works at all widths; markers still cluster (55 points, densest city) and `fitBounds` initial view unchanged.
- **R-02** "اضغط للتفاعل مع الخريطة" activation overlay still gates map pan/zoom; locate button still recenters; theme toggle (light/dark) still swaps tiles live — including while fullscreen.
- **R-03** Keyboard walk of the page (tab order) reaches Expand/Minimize with visible focus rings; RTL layout intact (controls on logical side, popup unaffected).
- **R-04** Desktop (1440px) page is pixel-identical to pre-feature output for the map card.

## Definition of Done

All Q-01…Q-14 pass and all R-01…R-04 regressions are green on ≥2 viewports (375px mobile + 1440px desktop) and, for back-gesture scenarios, on at least one real/simulated Android** and one iOS surface where available. Findings are recorded in the spec checklist notes or PR description.