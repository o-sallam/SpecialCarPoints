# Research: Admin — Sales Point Geographic Coordinate Management

**Phase 0 output.** Resolves every technical decision for the feature. The spec had **no open `[NEEDS CLARIFICATION]` items** after `/speckit.clarify` (the in-picker readout was resolved → editable), so these are design/implementation decisions, not spec gaps. Each item: Decision → Rationale → Alternatives considered. All decisions honor the hard constraints: **no new map provider, no URL-parsing dependency, no HTTP-client library** (spec FR-020/§12).

---

## R1. Parser strategy — `googleMapsUrlParser` (pure, dependency-free)

**Decision**: A single pure-TS module `lib/google-maps-url-parser.ts` exporting `parseGoogleMapsUrl(url: string): ParseResult`, where:

```ts
type ParseResult =
  | { ok: true; lat: number; lng: number }
  | { ok: false; reason: 'notAUrl' | 'notGoogleMaps' | 'noCoordinates' | 'outOfRange' }
```

No imports beyond TS built-ins; no DOM, no React, no network. The four reason codes map 1:1 to the distinct §5.2 error messages (FR-015), so the UI never collapses them into one generic message.

**Algorithm** (deterministic order):
1. Parse with `new URL(url)` in a try/catch → failure ⇒ `notAUrl`. (Also accept a pasted value with no scheme by prepending `https://` once, since users often paste `google.com/maps/...`.)
2. **Host recognition** (lenient): accept `maps.google.com`, `www.google.com/maps`, `google.com/maps`, country variants `google.co.*/maps` and `google.com.*/maps`, plus the short-link hosts `maps.app.goo.gl` and `goo.gl/maps`. Anything else ⇒ `notGoogleMaps`. (Short-link hosts are recognized as Google but contain no coordinates ⇒ `noCoordinates` if the parser is ever called on one directly; in practice the tab intercepts them first — see R2.)
3. **Coordinate extraction**, in priority order:
   - **`!3d<lat>!4d<lng>`** inside a `data=` segment — **preferred** when present (it is the *place*, not the viewport center). Regex: `/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/`.
   - else **`@lat,lng[,zoom]`** in the path — `/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,\d+(?:\.\d+)?[zm])?/`.
   - else **`q=lat,lng`** / **`ll=lat,lng`** query params — but only if the value fully matches a numeric `lat,lng` pattern (`/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/` after URL-decode). A place-name `q=Riyadh+Tower` is **not** an error ⇒ `noCoordinates`.
4. **Range validation** against `LAT_RANGE = [-90, 90]`, `LNG_RANGE = [-180, 180]` (shared from `lib/coordinates.ts`) before returning `ok`. Out-of-range ⇒ `outOfRange` (never trust parsed numbers unchecked — FR-012/§5.2).
5. If recognized Google host but no pattern matched ⇒ `noCoordinates`.

**Rationale**: spec §12 explicitly forbids external parser packages (thinly maintained, narrower coverage, none handle the `!3d/!4d` priority rule). A ~60-LOC owned utility is fully testable and covers every §3.2.1 format. The typed result keeps the parser locale-free (Arabic strings live in the UI tab — R7).

**Alternatives considered**:
- npm `google-maps-url-parser`-style packages — rejected (spec §12: unmaintained, narrower).
- Using `query-string` for param splitting — the project does not already depend on it; `URLSearchParams` is built-in and sufficient. No new dep.

**Short-link path** (resolve-then-parse): the parser is **reused unchanged** — `GoogleMapsUrlTab` detects a short-link host, calls the R2 endpoint, gets the resolved URL, and calls `parseGoogleMapsUrl()` again on it. There is exactly one parser implementation (spec FR-007).

---

## R2. Short-link resolution endpoint — SSRF guard + redirect-following

**Decision**: New Next.js Route Handler at `app/api/admin/resolve-map-url/route.ts` (POST). Admin-gated via `getSession().isAdmin` (401 if not), matching the existing write routes. Behavior:

- **Input**: `{ url: string }`.
- **Host allowlist** (server-side, the primary SSRF defense): only `goo.gl` and `maps.app.goo.gl` hostnames are accepted. Full `google.com/maps` URLs are **never** sent here (parsed client-side). Any other host ⇒ HTTP 400 `{ error: 'invalid_host' }`. This is checked server-side regardless of any client check (FR-010).
- **Redirect-following**: use the runtime `fetch` with `redirect: 'manual'` and a **manual loop** (max **5** hops). At each 3xx, read the `Location` header, resolve it against the current URL, and continue; stop on a non-3xx. Track hop count; >5 ⇒ HTTP 504 `{ error: 'too_many_redirects' }`.
- **Timeout**: `AbortController` / `AbortSignal.timeout(5000)` on each fetch (and/or the whole loop) ⇒ HTTP 504 `{ error: 'timeout' }` on abort.
- **Network failure** (non-timeout throw) ⇒ HTTP 502 `{ error: 'network_error' }`.
- **Success**: return HTTP 200 `{ resolvedUrl: string }` — the **final URL only**. The endpoint **never reads the response body** (FR-011): coordinates live in the URL itself after redirect, and avoiding body fetch keeps the SSRF surface minimal.
- **Route segment config**: `export const runtime = 'nodejs'` (default) and `export const dynamic = 'force-dynamic'` (it performs a live outbound request; must not be statically rendered or cached).

The client (`GoogleMapsUrlTab`) maps `{ invalid_host, timeout, too_many_redirects, network_error }` to the §5.2 rows: `invalid_host` is a client-side path that shouldn't normally reach the server (but if it does, treat as "couldn't process"); `timeout`/`too_many_redirects`/`network_error` ⇒ "تعذّر معالجة الرابط المختصر، حاول مرة أخرى" (distinct from "couldn't find coordinates").

**Rationale**: spec §6.1 mandates a server-side resolution step (browsers can't follow the cross-origin redirect), a host allowlist (SSRF), a redirect-count limit, and a timeout, returning only the final URL. Node's built-in `fetch` (available in Next.js route handlers) with `redirect: 'manual'` gives precise hop-count control and lets us avoid reading the body — `redirect: 'follow'` would not let us cap hops or inspect intermediate hosts. No HTTP-client library is needed (spec §12).

**Alternatives considered**:
- `redirect: 'follow'` — rejected: cannot precisely cap redirect count or observe/validate intermediate hosts (a malicious chain could hop through many hosts).
- `axios` / `got` / `node-fetch` — rejected: new dependency solely for one call (spec §12 forbids); built-in `fetch` suffices.
- Resolve-then-return-coordinates directly from the endpoint — rejected by spec §6.1 ("return the final resolved URL"); the parser stays client-side-owned and single-sourced (R1).
- An external redirect-resolution SaaS — rejected: adds a dependency + a new SSRF/privacy surface.

**Auth note**: `middleware.ts` gates `/admin/*` pages on cookie *presence*, but the real authorization is `getSession().isAdmin` inside each route handler (the existing write routes do exactly this). The new endpoint repeats that same check — it is the authoritative guard (FR-010).

---

## R3. Theme-aware map tiles in the admin picker

**Decision**: Reuse `useActiveTheme()` (`lib/hooks/use-active-theme.ts`) + the same conditional tile logic as the public `MapView.tsx`: dark ⇒ CARTO `dark_all`; light ⇒ OSM. The admin chrome has **no theme toggle**, but `data-theme` is set globally by the inline script in `app/layout.tsx` (from `localStorage["theme"]` / `prefers-color-scheme`), so the picker renders whichever theme is active app-wide — consistent with the public map, at zero extra cost.

**Rationale**: The spec's T0 point-6 fallback allows a single tile set when the admin has no theme switching, but reusing `useActiveTheme()` is strictly better (consistency with the public map, no conditional to maintain, and it stays correct if an admin toggle is ever added). It also satisfies FR-002's "reuse the existing theme-aware tile logic."

**Alternatives considered**:
- Hardcode OSM light tiles only — acceptable per the spec fallback, but inconsistent with the (possibly dark) rest of the admin UI; rejected in favor of reuse.
- Introduce `next-themes` — explicitly rejected (R4 of the prior feature; the app does not use it).

---

## R4. Code-splitting the picker (Leaflet out of the initial form load)

**Decision**: Load `LocationPickerModal` (and therefore Leaflet + its CSS + the picker components) via `next/dynamic(() => import('./location-picker/LocationPickerModal'), { ssr: false })` from `SalesPointForm`. Leaflet needs `window`, so `ssr: false` is **mandatory**, not optional. Leaflet's CSS (`leaflet/dist/leaflet.css`) is imported inside the dynamically-imported module so it loads only when the picker opens.

**Rationale**: FR-021 requires the map not be bundled into the initial admin form page load. This mirrors the public map's exact pattern (`AccordionLocator` does `dynamic(() => import('./MapView'), { ssr: false })`) — spec A5 confirmed this; reusing it avoids inventing a second approach.

**Alternatives considered**: Eager import — rejected (Leaflet in every form load, violates FR-021 and SSR-safety).

---

## R5. Validation approach — client + server, shared constants

**Decision**: A shared `lib/coordinates.ts` module exports `LAT_RANGE`, `LNG_RANGE`, `KSA_BBOX` (`{ lat: [16, 33], lng: [34, 56] }`), and helpers `isCoordinatePairValid(lat, lng)` + `ksaWarning(lat, lng)`. Both client and server import these so the rules can never drift.

- **Server (the authoritative guard)**: tighten `salesPointSchema` in `lib/validators.ts` with a Zod `.superRefine` on the `{ lat, lng }` pair implementing the **both-or-neither** rule: `(null, null)` and `(valid, valid)` are allowed; `(value, null)` / `(null, value)` are rejected; present values must be finite and in range. `lat`/`lng` stay **nullable** (a point may legitimately have no coordinates — making them required would break existing null-coord points and is **not** what FR-012 means). No persisted-shape change; only validation. The POST and PUT handlers already `salesPointSchema.parse(body)`, so both routes gain the guard with one edit.
- **Client**: a thin range guard runs on the form's manual lat/lng inputs **and** the in-picker editable field (FR-012/FR-017), reusing the same constants. It blocks clearly-invalid input but the server is still the source of truth.
- **KSA warning (FR-014)**: `ksaWarning()` returns the non-blocking Arabic notice when a committed/previewed coordinate is far outside `KSA_BBOX`; the UI shows it without preventing save.

**Rationale**: FR-012/FR-013 require the same range + both-or-neither rule regardless of entry method, validated on both tiers. Extracting constants to one module guarantees client and server agree (the server check is what defeats a direct API bypass — SC-004). Zod is already the project's validator (A3), so no new library.

**Alternatives considered**:
- Make `lat`/`lng` required (non-null) — rejected: breaks existing points without coordinates and over-reads FR-012 (which means "both or neither," not "always present").
- A separate validation library (Yup/class-validator) — rejected: Zod is already used.
- Inline magic numbers in two places — rejected: drift risk.

---

## R6. Map renderer style for the picker — react-leaflet declarative

**Decision**: Build `MapPickerTab` with **react-leaflet v4 declarative** components (`<MapContainer>`, `<TileLayer key={theme}>`, `<Marker draggable position={…} eventHandlers={{dragend, …}}>`, and a child using `useMapEvents({ click })`) rather than the imperative `L.map(...)` style the public `MapView.tsx` uses.

**Rationale**: The picker is far simpler than the public map (single marker, click-to-place, drag, theme tile swap, editable-field two-way sync). react-leaflet v4 is already a dependency (A5), and its declarative model makes the marker↔state two-way binding (FR-004/FR-005) and the live readout trivial and reactive. The public `MapView` uses imperative Leaflet only because of clustering complexity (`leaflet.markercluster`), which does not apply here. Theme tile swap is a one-liner: `<TileLayer key={theme} url={theme === 'dark' ? CARTO : OSM} attribution={…} />` — changing `key` remounts the layer cleanly.

**Alternatives considered**:
- Imperative Leaflet (`L.map`, like `MapView`) — rejected for the picker: more boilerplate for the reactive two-way binding the editable field needs, with no clustering benefit to justify it.

---

## R7. Error-message source / locale handling

**Decision**: Keep the parser **locale-free** (it returns typed `reason` codes only — R1). The Arabic user-facing strings live in `GoogleMapsUrlTab`, which owns a `reason → message` map covering every §5.2 row (empty input, `notAUrl`, `notGoogleMaps`, `noCoordinates`, `outOfRange`, and the endpoint's `timeout`/`too_many_redirects`/`network_error`). Errors are rendered inline (red `<p>` under the input, matching the form's existing convention — A7) and associated to the input via `aria-describedby` (FR-018). The extract loading state uses an `aria-live="polite"` region announcing "جارٍ الاستخراج…" → result.

**Rationale**: Separating logic (codes) from presentation (Arabic strings) keeps the parser trivially unit-testable and means the short-link endpoint's codes reuse the same UI mapping. There is no i18n framework in the app (Arabic is hardcoded throughout), so a local message map is the consistent choice.

**Alternatives considered**: putting Arabic strings inside the parser — rejected (couples pure logic to locale, blocks unit testing of the logic alone).

---

## R8. Optional "distance from previous saved location" readout (§4.2 nicety)

**Decision**: Implement **only if trivial** — and it is: `lib/geo.ts` already exports `haversineKm(a, b)` + `formatDistance(km)` + the `LatLng` type. When editing a point that has saved coordinates, the picker can show a small readout "عن الموقع السابق: ~X كم" next to the live coordinate field, but **only when the current pick differs from the saved location by more than a threshold** (e.g. >0.5 km) to avoid noise on every drag. This is a non-blocking nicety; if it risks schedule, it is cut with no spec impact.

**Rationale**: spec §4.2 says implement this only if a trivial library utility already exists — `haversineKm` does, so no custom geodesic math. Leaflet's `LatLng.distanceTo` would also work; reusing the existing `lib/geo.ts` helper keeps one distance utility in the codebase.

**Alternatives considered**: Leaflet `distanceTo` — fine but duplicates an existing helper; skip entirely — acceptable (it is explicitly non-blocking).

---

## R9. Accessibility — lean on Radix primitives

**Decision**: Reuse shadcn `Dialog` (Radix) for the picker — it provides focus trapping, `Escape`→close, and correct ARIA out of the box — and shadcn `Tabs` (Radix) for the Map/رابط جوجل ماب switch (arrow-key navigation + `aria-selected`). The map's own keyboard handlers (arrow-key pan, `+`/`-` zoom) stay **enabled** (FR-018 — do not disable Leaflet's keyboard handler). Add only what the primitives don't give: `aria-describedby` wiring for inline errors (R7) and the `aria-live="polite"` extract-status region.

**Rationale**: FR-018's requirements are almost entirely satisfied by reusing the existing primitives (A7); building bespoke focus-trap/tab logic would violate "reuse, don't duplicate." Keeping Leaflet's keyboard nav satisfies the explicit "remain enabled" clause.

**Alternatives considered**: a custom modal — rejected (reimplements Radix; worse a11y).
