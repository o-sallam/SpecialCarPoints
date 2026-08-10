# Research: Sales Point Detail Sheet (Map View)

**Phase 0 decisions** — the two spec [NEEDS CLARIFICATION] markers were resolved by default (Q1-A same sheet on all viewports; Q2-A universal Google Maps directions link — **both flagged in the spec as pending user confirmation**, A14). This file records all design decisions and the defect root-cause analysis for `/speckit.tasks`.

---

## R1. Detail surface: shadcn Sheet primitive (FR-002)

- **Decision**: Add the standard shadcn `Sheet` primitive as `components/ui/sheet.tsx` (Radix `Dialog`-based, `@radix-ui/react-dialog@^1.1.23` already installed — **zero new dependencies**) and build `components/public/MapDetailSheet.tsx` on `SheetContent side="bottom"`, themed with the existing `var(--color-*)`/`var(--radius-*)` tokens and `cn()`.
- **Rationale**: The user explicitly required shadcn/ui. The repo has `dialog.tsx` (same Radix base) but no sheet; the shadcn Sheet is the standard, dependency-free way to get a bottom drawer with focus-trap, Escape, backdrop, and ARIA dialog semantics for free (FR-010). Reusing tokens keeps it visually identical to the site.
- **Alternatives considered**:
  - *Custom portal/div with own gesture code* — rejected: violates the user's shadcn/ui requirement and re-implements a11y (focus trap, `aria-modal`, Esc) that Radix already provides.
  - *Keep the Leaflet popup, restyled* — rejected: the popup is anchored/floating, not a full-width bottom surface, and cannot host the swipe-down dismiss pattern.
  - *A package like `vaul`* — rejected: no new dependencies (spec A13); the shadcn primitive + a small owned drag handler covers FR-007.

## R2. Root cause of the "unwanted zoom" defect → the fix shape (FR-011…FR-014)

- **Decision**: Two coordinated changes in `components/public/MapView.tsx`:
  1. **Movement removal**: the `selectedId` effect currently runs `flyTo(marker.getLatLng(), 14)` + `openPopup()` for **every** selection. On a marker tap this forcibly re-centers and snaps the zoom to 14 — at zoom ≥14 it visibly zooms **out**, and at any zoom it pans. This is the user-perceived "second, unwanted zoom/pan" on individual marker taps. The map-origin path must do **neither** (FR-012, scenario 10): sheet opens, map stays put.
  2. **Handler isolation** (the amendment's explicit ask): individual marker clicks call `L.DomEvent.stopPropagation(e.originalEvent)` and markers are created with `bubblingMouseEvents: false`, guaranteeing the marker click never reaches the cluster group's/map's click handling (FR-013/FR-014). Cluster rendering, count badge, and zoom-to-bounds stay untouched (FR-011).
- **Rationale**: Removing the flyTo eliminates the actual movement defect; propagation control makes the one-outcome-per-tap guarantee explicit and future-proof (belt-and-suspenders), exactly as the amendment requires — "explicitly prevented, not just visually masked".
- **Alternatives considered**:
  - *Only stopPropagation, keep flyTo* — rejected: the visible zoom/pan persists (flyTo(14) is independent of event bubbling).
  - *Keep flyTo but clamp zoom* — rejected: still re-centers (pan side effect), and scenario 10 forbids *any* view change.
  - *Investigating/patched cluster-plugin event internals* — rejected: `leaflet.markercluster`'s zoom-on-click is bound to cluster layers only; no plugin change needed once propagation control is in place.

## R3. Selection origin flag ('map' | 'list') (spec A2)

- **Decision**: `AccordionLocator` gains `selectionOrigin: 'map' | 'list'`; `handleSelect(id, origin)` records it. `MapView`'s `onSelect` marker wiring calls origin `'map'`; list card handlers (`EntryCard`/`RegionGroup` props wired by `AccordionLocator`) pass `'list'`. The sheet renders only for `origin === 'map'` selections; the existing flyTo+popup `selectedId` effect in `MapView` runs only for `origin === 'list'` (behavioral no-op for map taps).
- **Rationale**: Spec A2 pins List View behavior unchanged; the sheet is map-scoped. A single `selectedId` still drives the marker highlight (FR-007's "clear highlight"), popup (list only), and sheet (map only) — one source of truth, one toggle.
- **Alternatives considered**: *Sheet for both origins* — rejected (changes list behavior, widens scope); *separate state per view* — rejected (breaks the existing highlight toggle semantics and FR-008).

## R4. Sheet hosting, z-order, and outside-tap dismiss (FR-007/FR-018/FR-020)

- **Decision**: `AccordionLocator` renders `<MapDetailSheet/>` as a sibling of the map wrapper (outside `.map-isolate`'s stacking context), Radix portal to `body` (the shadcn default), overlay `z-index` at `1001` (`var(--z-overlay)` + 1) — above page content (40) and feature 003's fullscreen map (1000), below toasts (1100). Dismissal: backdrop click (Radix `onOpenChange(false)`), Escape (Radix), close button, and swipe-down.
- **Rationale**: Radix's portal + overlay handles "tap outside" and ARIA for free; the z-slot sits exactly between the fullscreen map and toasts so the sheet works identically over the normal page and 003's fullscreen map (FR-020), and toasts stay above (session feedback).
- **Alternatives considered**: *Map-level click handler to deselect* — unnecessary (backdrop covers it) and risks closing on marker re-tap UX; *`z-[1100]`* — rejected, would cover toasts.

## R5. Swipe-down dismiss (FR-007)

- **Decision**: A small owned pointer-drag handler on the sheet content: `pointerdown` records start, `pointermove` translates the sheet via `transform: translateY()` (friction factor on the drag), `pointerup` — if distance > ~96px or velocity high → animate closed (`onOpenChange(false)`), else spring back to 0 with the `--duration`/`--ease` tokens. The close button and backdrop remain always-available fallbacks (RTL-safe: direction-agnostic).
- **Rationale**: FR-007 explicitly requires swipe-down; Radix Dialog has no drag support, and adding a dependency is banned (A13). A ~60-line transform-only handler is cheap, stays on the compositor (SC-001's <300 ms), and degrades gracefully (any pointer-drag failure leaves button/backdrop/Escape dismissals intact).
- **Alternatives considered**: *No swipe (button/backdrop/Escape only)* — rejected (FR-007 explicit); *vaul-style `@radix-ui/react-dialog` fork* — rejected (dependency).

## R6. Destination links (FR-015/FR-016/FR-017)

- **Decision**: New pure module `lib/maps.ts`:
  - `googleMapsLink(p)`: `p.googleMapUrl` if non-empty, else `https://www.google.com/maps?q=${lat},${lng}`.
  - `directionsLink(p)`: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` (**Q2-A default**: universal Google Maps; no UA sniffing, no Apple Maps).
  - Both return `null` when `lat`/`lng` are null and `googleMapUrl` is empty → sheet hides both buttons (FR-017).
- **Rationale**: Reuses the exact field the current popup and List View already trust (`googleMapUrl`); coordinates are the only other destination source in the data model (no Place ID exists — spec A3). Hidden-not-disabled avoids dead controls (edge case #1).
- **Alternatives considered**: *Address-based query fallback* — rejected (adds geocoding scope, spec A4); *platform-aware Apple Maps* — the rejected Q2-B option (documented in spec A14).

## R7. Same sheet on all viewports (FR-019, Q1-A default)

- **Decision**: No viewport branching — the bottom sheet renders identically on mobile, tablet, and desktop (Google-Maps-web style). Verification adds desktop checks, no extra code path.
- **Rationale**: One surface, one code path, one QA matrix (plan card: default chosen during clarification, pending user confirmation — A14).
- **Alternatives considered**: Mobile-only sheet + popup elsewhere (Q1-B) or desktop dialog (Q1-C) — both rejected as defaults; both remain one-line spec changes if overridden.

## R8. Feature 003 integration (FR-020)

- **Decision**: No code coupling now — 003 (`003-map-mobile-ui`, draft) is unlanded. Contract: sheet z sits above 003's fullscreen overlay (R4) and 003's FR-010/FR-013/FR-017 (sheet over fullscreen map; sheet survives minimize) are honored by construction: the sheet is outside the map subtree, so fullscreen class swaps never affect it. Joint verification is added to both features' quickstarts.
- **Rationale**: 003's own research (R8) anticipated exactly this sheet as its "detail bottom sheet" surface; explicit cross-feature test rows prevent regression when both land.
- **Alternatives considered**: *Implement 003's fullscreen hooks now* — rejected (out of scope; 003 is a separate feature).

## R9. Selection lifecycle with filters (edge case)

- **Decision**: The selected point is derived as `visible.find(p => p._id === selectedId)` in `AccordionLocator`; if the filter/tier set changes and the selected point is no longer present, the selection (highlight, popup, sheet) clears. Tapping a cluster while the sheet is open does not change selection (FR-023).
- **Rationale**: Prevents a dangling selectedId pointing at an invisible point (broken sheet content / highlight); matches how highlight behaves today via re-render.
- **Alternatives considered**: *Keep selection across filters* — rejected (sheet would show a point not on the map).

## R10. Content & animation details (FR-003/FR-004/FR-009)

- **Decision**: Sheet header = `displayName` (bold title) + VIP badge (exact `EntryCard` rendering), body = location line `{cityName} • حي {neighborhoodName}` (or `• {extraLabel}` fallback) — byte-for-byte the List View format — plus a short "فتح في خرائط Google" style hint line if desired (optional, no new strings beyond existing copy). Animation: shadcn's built-in `data-[state=open/closed]` slide+fade using `tailwindcss-animate` with `--duration`/`--ease` tokens (already the repo's motion convention).
- **Rationale**: FR-004's consistency requirement pins the rendering; reusing the shadcn animation classes keeps motion on-brand without new keyframes.
- **Alternatives considered**: *Custom keyframes* — rejected (repository convention is token-driven + tailwindcss-animate).