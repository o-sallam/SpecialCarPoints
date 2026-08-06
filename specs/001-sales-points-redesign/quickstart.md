# Quickstart — Validation Guide: Sales Points Directory Redesign

A **manual** validation runbook (the project has no automated test infra for the public surface, and the spec explicitly defers adding one). Run this after each user-story checkpoint and once fully at the end. Each step lists what to do and the expected outcome.

## Prerequisites

- Node ≥18, deps installed (`npm install`).
- MongoDB reachable locally **or** the app gracefully renders the empty state (the locator catches DB errors and still mounts).
- Run the dev server: `npm run dev` → open `http://localhost:3000/` (the locator; `/sales-points` redirects here).

> Reference: [component-contracts.md](./contracts/component-contracts.md) for prop surfaces; [data-model.md](./data-model.md) for the `POSEntry` shape; [research.md](./research.md) for decisions.

---

## Scenario A — Core discovery flow (US1)

1. **Search is gone**: confirm there is **no** text input, search icon, or "ابحث عن مدينة أو حي…" placeholder anywhere in the toolbar (inspect DOM — not just visually hidden).
2. **Filters work**: click `الكل` / `VIP` / `عادي`. Expected: the header summary counts (`X نقطة في Y منطقة`) always equal the visible points; VIP filter shows only VIP cards (gold accent).
3. **Desktop layout (≥768px)**: filters + "use my location" on the start side, List/Map toggle on the end side — **one row**, no wrapping.
4. **Mobile layout (375px)**: row 1 = filters + location (horizontally scrollable, no wrap), row 2 = the toggle.
5. **"Use my location"**: grant geolocation → list re-sorts by nearest region/point **and** (in map view) map recenters. Available in **both** views.

## Scenario B — View toggle (US2)

1. Click `القائمة` ↔ `الخريطة`: the active indicator **slides** smoothly (not a snap).
2. **Keyboard**: Tab to the toggle → arrow keys move between segments → Enter/Space activates; ARIA exposes a 2-option tablist with the selected state.
3. Each segment ≥44×44px touch target; slide direction is correct under RTL.

## Scenario C — Hero & footer (US3)

1. **Hero full-bleed**: the hero spans the full viewport width; the toolbar/list below remain inside the normal centered container (verify via devtools computed width, not just visually).
2. **Stat chips**: show **live** numbers (total / regions / VIP) — change a filter and confirm the hero total reflects reality (hero total = all points, independent of filter).
3. **No broken image**: with no hero asset, a gradient fallback renders (never a broken-image icon); reserve height prevents layout shift while loading.
4. **Footer**: About/brand column + social icons + legal line; multi-column on desktop, stacked with generous spacing on mobile; a top divider separates it from content. No empty "Quick links" column.

## Scenario D — Map clustering + dark tiles (US4)

1. Switch to الخريطة. Zoomed out, dense areas (e.g. **Riyadh ≈12 points**, Jeddah ≈9) collapse into **one cluster** showing the correct count.
2. Zoom progressively into Riyadh → clusters split into smaller clusters, then **all individual markers at max zoom**.
3. Click a cluster → map fits its bounds. Click an individual marker → existing popup + selection behavior (regression check).
4. Toggle theme: **dark mode shows dark (CARTO) tiles**, light mode shows OSM tiles; the switch happens live without a full reload. Attribution visible in both.
5. Rapidly toggle List↔Map several times → no console errors (marker teardown is clean).

## Scenario E — Polish & accessibility (US5)

1. **Keyboard-only**: Tab through the entire toolbar and the first region row — every control is reachable in reading order (RTL) with a **visible focus ring**.
2. **Hover/focus**: cards lift slightly (surface→raised, subtle primary border, ~-2px), filter pills lighten, all using the **same** motion timing.
3. **Accordion**: expand/collapse a multi-point region (e.g. Riyadh) — height animates smoothly and the chevron rotates.
4. **VIP preserved**: gold left-border + "VIP" text intact across all states (not color-only).

---

## Cross-cutting checks (run at every checkpoint)

- **Three breakpoints**: 375px, 768px (boundary), 1440px — no layout jump when resizing across 768px.
- **Both themes**: light + dark render correctly; body text ≥4.5:1 contrast, hero text legible over its scrim at all three widths.
- **RTL**: toggle slide direction and toolbar row alignment correct (the two RTL-prone areas).
- **Console**: no errors/warnings (especially no unused-import warnings after search removal).
- **Bundle**: confirm the map code is still split out (Network tab: Leaflet JS only loads after switching to Map view, not on initial List load).
- **No scope creep**: `package.json` has only the single new clustering dependency; no new UI/animation/icon library.
