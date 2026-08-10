# Component & Behavior Contracts: Map UI Mobile Improvements (Full-Bleed + Expand/Minimize)

**Branch**: `003-map-mobile-ui` | **Date**: 2026-08-11 | **Spec**: [spec.md](../spec.md) | **Plan**: [plan.md](../plan.md) | **Data model**: [data-model.md](../data-model.md)

This feature exposes **no public API and no backend interface**. The contracts below are UI/component contracts: the `MapView` props surface (the only interface change across a component boundary) and the page-level behavior contracts that `AccordionLocator` must honor.

---

## Contract 1 — `MapView` props surface (only change to an existing component)

```ts
interface MapViewProps {
  points: MapPoint[]                    // unchanged
  selectedId: string | null             // unchanged
  onSelect: (id: string) => void        // unchanged
  userLocation?: { lat: number; lng: number } | null   // unchanged
  recenterSignal?: number               // unchanged
  resizeSignal?: number                 // NEW — default 0
}
```

**Semantics**:
- Every increment of `resizeSignal` (after expand and minimize) MUST trigger `map.invalidateSize()` — once immediately and once inside `requestAnimationFrame` (plan R2).
- A rAF-throttled `window` `resize` listener MUST also call `invalidateSize()` (device rotation / URL-bar height changes, FR-014).
- `invalidSize()` calls MUST be guarded to the mounted `mapRef`; the map instance must never be torn down or re-created by these signals (FR-016).
- Markers, clustering, tiles, popups, activation overlay, and locate button behavior are **behavioral no-ops** — the resize work must not alter marker positions, cluster state, open popups, view center/zoom, or the theme tile swap.

**Verification**: `MapPoint` shape and all pre-existing props appear in the diff only as untouched lines; the only added prop is `resizeSignal?: number`.

## Contract 2 — Map wrapper class matrix (owned by `AccordionLocator`)

| State | Viewport | Wrapper classes | Effects |
|-------|----------|-----------------|---------|
| normal | <768px | current + `margin-inline: calc(-1 * var(--space-4))`, `rounded-none`, `border-x-0` | Full-bleed width, no rounded corners (FR-001) |
| normal | ≥768px | current classes **exactly as shipped** | No change (FR-002) |
| fullscreen | any | `fixed inset-0 z-[var(--z-overlay)]`, `rounded-none`, `border-0` (drop border/shadow), `h-auto` (inset-0 governs) | Map fills the entire viewport; page content hidden/inaccessible (FR-004) |

- Fullscreen MUST be applied via classes on the **existing wrapper** — never by unmounting/remounting `MapView`, never via a portal (plan R1).
- Top/bottom borders and shadow are dropped in fullscreen; on mobile the side borders are dropped in normal mode to avoid edge cut-lines.
- The `container` padding (`--space-4` = 1rem below 768px) is the single source for the negative-margin value; if the token changes, the calc must keep tracking it.

**Verification**: at 375px, computed `margin-inline` of the wrapper == `-1rem` and `border-radius` == 0; at 1440px, computed styles identical to current production values (border-radius `var(--radius-xl)`, no negative margin).

## Contract 3 — Fullscreen behavior contract (`AccordionLocator` + hooks)

| # | Behavior | Contract |
|---|----------|----------|
| 3.1 | Scroll capture | On expand: `capturedScrollY = window.scrollY` **before** any class change. |
| 3.2 | Scroll lock | While fullscreen: `document.body` `overflow: hidden` + `overscroll-behavior: none` (FR-009). Restore previous inline values on minimize **and** on unmount (FR-015). Keyboard/touch/wheel must not scroll the page. |
| 3.3 | Scroll restore | On minimize: `window.scrollTo({ top: capturedScrollY, behavior: 'instant' })` (FR-006, SC-003 ±10px). |
| 3.4 | History entry | On expand: exactly one `history.pushState({ scMap: 'expanded' }, '')` (FR-011). |
| 3.5 | Back minimize | `popstate` handler: if `event.state?.scMap === 'expanded'` → minimize (idempotent). No other popstate states may trigger minimize. Back press in normal mode = standard navigation, untouched (FR-011). |
| 3.6 | Button minimize | Pops the pushed entry via `history.back()` when the entry is present; the popstate path performs the actual state change — single code path, idempotent guard `if (mode !== 'fullscreen') return`. |
| 3.7 | State reset | Any page navigation/unmount clears all state; next visit starts normal (FR-015). |
| 3.8 | Popup survival | Minimize must NEVER call `closePopup` or clear `selectedId` — the open detail popup ("bottom sheet", feature 001) stays open over the normal-size map (FR-017). Rapid expand/minimize must never strand the mode (final state == last tap). |
| 3.9 | Marker taps | `handleSelect`/marker click wiring is NOT modified: in fullscreen, tapping a marker opens the popup above the fullscreen map and the map stays expanded (FR-010/FR-013). |

## Contract 4 — Controls (Expand / Minimize)

| # | Rule |
|---|------|
| 4.1 | `type="button"`, icon-only with `aria-hidden` icon; `aria-label="تكبير الخريطة"` (Expand) / `aria-label="تصغير الخريطة"` (Minimize) (FR-007, SC-004). |
| 4.2 | Touch target ≥44×44px; focus-visible ring using existing token-based style (mirror the locate button in `MapView.tsx`). |
| 4.3 | Placement: absolute overlay inside the map wrapper, logical (RTL-safe) corners; `z-index` above MapView's subtree including its internal `z-[1000]` activation overlay (plan R9). |
| 4.4 | Visibility matrix (plan R5): Expand iff `useIsMobile() && mode === 'normal'`; Minimize iff `mode === 'fullscreen'` (any width — rotation dead-end prevention, FR-012/FR-014). |
| 4.5 | Clicks on the controls must not trigger MapView's activation overlay or map interactions (`stopPropagation` on the button handler — same pattern as the existing locate button). |

## Contract 5 — `useIsMobile` hook (new)

- `useIsMobile(): boolean` — SSR-safe (`false` on server/first render), `useSyncExternalStore` subscription to `matchMedia('(max-width: 767px)')` (plan R4).
- Used **only** for control visibility + expand gating; never for styling (styling stays CSS-media-driven).
- Matches spec breakpoint A2 (<768px) — the same boundary feature 001 uses.

## Contract 6 — `useScrollLock` hook (new)

- `useScrollLock(locked: boolean)` — while `locked`, saves `document.body.style.overflow` and `overscrollBehavior`, sets `hidden`/`none`; on unlock or unmount restores the saved values.
- Never permanently locks the page; safe cleanup under React 18 StrictMode double-effects.

## Cross-checks

- FR-008 (no blank tiles): satisfied by Contract 1's double-rAF invalidate; verified per quickstart scenario Q-05.
- FR-011 scenario 2 (history as before expand): Contract 3.4–3.6 — after minimize, `history.length` equals the pre-expand value (only the one pushed entry was created and popped).
- SC-007 (no dead ends): Contract 4.4 guarantees Minimize at any width; Contract 3.5 guarantees back exit.