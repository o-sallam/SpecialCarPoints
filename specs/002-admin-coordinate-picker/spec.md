# Feature Specification: Admin — Sales Point Geographic Coordinate Management

**Feature Branch**: `002-admin-coordinate-picker`

**Created**: 2026-08-06

**Status**: Draft

**Input**: User description: "Admin Panel — Sales Point Geographic Coordinate Management: enhance the sales-point create/edit form so staff can set a sales point's latitude/longitude (1) interactively by clicking/dragging a marker on a map, and (2) by pasting a Google Maps URL (including short links), instead of typing raw decimals. Goal: reduce coordinate data-entry errors that would misdirect customers on the public map."

## Source artifacts & references

- **Detailed implementation specification**: the originating SpecKit document (this feature description) is the single source of truth for *how* each task is implemented. It defines the task order (T0 discovery → T7 server-side validation), the five Google Maps URL formats, the component architecture (`LocationPickerModal` / `MapPickerTab` / `GoogleMapsUrlTab` / `googleMapsUrlParser` / the short-link resolution endpoint), the validation rules (§5), the per-row error messages (§5.2), accessibility (§9), performance (§10), testing (§11), libraries (§12), and rollback strategy (§13). It is preserved verbatim in the triggering request and MUST be consulted during `/speckit.plan` and `/speckit.tasks`.
- **Prior feature (dependency)**: `specs/001-sales-points-redesign` (the public Sales Points Directory redesign) confirmed this project's map stack and added theme-aware tiles. This feature **reuses that same confirmed stack** for the admin picker — it does not introduce a second map provider.
- **Discovery note** (the spec author's T0 intent) is reflected in the *Assumptions* section below, verified against this repository at spec-writing time.

## Clarifications

### Session 2026-08-06 (spec-time discovery + /speckit.clarify)

- **§4.1 interaction pattern (picker vs. URL-paste grouping)**: Discovery found **no existing "multiple ways to fill one field" pattern** anywhere in the admin panel (no upload-vs-URL, no tabs). Per the spec's stated fallback, this resolves to the **default**: a single modal titled **تحديد الموقع الجغرافي** with two tabs — **الخريطة (Map)** and **رابط جوجل ماب (Google Maps link)** — sharing one `{ lat, lng }` state and one shared **تأكيد الموقع / إلغاء** action bar. No clarification needed; the default applies.
- **lat/lng fields pre-existing**: Discovery confirms `latitude`/`longitude` **already exist** on the form and data model (raw `type="number"` inputs). This feature *upgrades* them with the picker, and tightens their validation — it does not add them from scratch.
- Q: Should the in-picker lat/lng readout be read-only or editable? → A: **Editable.** It is two-way synced with the marker (dragging updates the field; valid typed values move the marker), and typed values are subject to the same validation as any other entry method (FR-012). Rationale: the field's stated purpose is to free a precision-minded admin from relying purely on visual clicking, which a read-only display would not achieve; it also keeps precision adjustment inside the picker's confirmable session.
- **No further open scope/security/UX questions remain** that would warrant a `[NEEDS CLARIFICATION]` marker: the in-picker readout decision above was the last genuinely unresolved item; every other decision in the implementation spec has a stated default or was confirmed against the repo below.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set a location by clicking the map (Priority: P1)

An admin creating or editing a sales point usually knows *where* the place is but not its exact decimal coordinates. Today they must either leave `خط العرض`/`خط الطول` blank or type numbers copied from elsewhere — slow, and a single transposed digit silently places the point in the wrong city. The admin should be able to open a map from the sales-point form, click the spot, drag to fine-tune, watch the decimal values update live as a transparency check, and confirm. The map opens sensibly centered (on the point's existing coordinates when editing; on Saudi Arabia/Riyadh when creating new — never on the empty `(0,0)` "null island").

**Why this priority**: This is the core new capability and the primary error-reduction mechanism. A staff member who can point to a location on a map but not recite its decimals is the most common persona; serving them first delivers value even before URL-pasting or short-link support land.

**Independent Test**: Open the sales-point create form, click **اختر من الخريطة**, click a spot in Riyadh, drag the marker a little, read the live decimal readout beside the map, click **تأكيد الموقع**, and confirm the correct values land in the form's lat/lng fields. Then open an existing point's edit form, open the picker, and confirm the map centers on its saved coordinates with the marker pre-placed.

**Acceptance Scenarios**:

1. **Given** the admin is editing a sales point that already has valid coordinates, **When** they open the picker, **Then** the map centers on those coordinates at a close zoom (≈14–15) with the marker already placed.
2. **Given** the admin is creating a new sales point with no coordinates, **When** they open the picker, **Then** the map centers on Saudi Arabia/Riyadh at a country/region-level zoom (≈5–6) and is never centered on `(0,0)`.
3. **Given** the picker is open, **When** the admin clicks anywhere on the map, **Then** a single marker is placed there (or the existing one moves) and only one marker ever exists at a time.
4. **Given** a marker is placed, **When** the admin drags it or types coordinates into the in-picker field, **Then** the two stay in sync — dragging updates the field to 6 decimal places and valid typed values move the marker — sharing one single source of truth (invalid typed values are rejected per FR-012, not silently applied).
5. **Given** the admin has picked a location, **When** they click **تأكيد الموقع**, **Then** the picked coordinates are written to the form's lat/lng fields and the picker closes; when they instead click **إلغاء**, the form's pre-existing values are left completely untouched.

---

### User Story 2 - Set a location by pasting a Google Maps URL (Priority: P2)

Staff frequently share locations as Google Maps links (far more often than as coordinates). An admin who already has such a link should be able to paste it and have the coordinates extracted automatically — skipping any manual lookup. Full/long Google Maps URLs resolve instantly, entirely on the client, with no network call. On success the coordinates populate (and, if the map tab is open, its marker moves to match, so both entry paths stay visually consistent); on failure a specific, actionable message appears and any already-valid values are preserved.

**Why this priority**: This is the highest-convenience path for the most common real-world sharing habit, and it reuses the same shared state and Confirm action as the map. It depends on the parser utility but is otherwise self-contained.

**Independent Test**: In the picker's **رابط جوجل ماب** tab, paste a full Google Maps URL containing `@lat,lng` coordinates, click **استخراج الإحداثيات**, and confirm the resolved coordinates appear with a success indicator and populate the shared state (visible on the Map tab). Repeat with a `data=` URL containing `!3d/!4d` and confirm the *place* coordinates (not the viewport center) are used.

**Acceptance Scenarios**:

1. **Given** the admin pastes a full Google Maps URL with `@lat,lng,zoom` in the path, **When** they trigger extraction, **Then** the two decimal numbers are parsed and populate the shared state — with **no network request** made.
2. **Given** the pasted URL contains both `@lat,lng` (viewport) and `!3d<lat>!4d<lng>` (place) data, **When** parsed, **Then** the `!3d`/`!4d` pair is preferred because it represents the actual pinned place.
3. **Given** the admin pastes a `q=lat,lng` or `ll=lat,lng` query-parameter URL, **When** parsed, **Then** the numeric coordinate pair is extracted — but a `q=` containing only a place-name string (no numbers) is treated as "no coordinates," not an error/crash.
4. **Given** a successful parse, **When** the admin switches to the Map tab, **Then** the marker is already placed at the parsed coordinates (shared state preserved across tabs) and a single Confirm commits them.
5. **Given** a parse fails, **Then** any already-valid lat/lng in the form are left unchanged and a specific message is shown (never a partial latitude-without-longitude write).

---

### User Story 3 - Resolve shared short links reliably (Priority: P3)

Short links (`https://goo.gl/maps/...` and `https://maps.app.goo.gl/...`) carry no coordinates in the URL itself — they only resolve after an HTTP redirect, which browsers cannot follow for a plain client-side request. These are extremely common (the default "Share" output from the Google Maps mobile app), so unsupported short links would be a frequent dead-end. The system must resolve them through a small, admin-authenticated, SSRF-guarded server endpoint that follows the redirect chain and returns the final URL, which is then parsed by the same logic as full URLs.

**Why this priority**: Completes URL coverage so admins are never told "unsupported link" for the most common share format. It is isolated behind its own endpoint and can be deferred or rolled back independently without affecting map picking or full-URL parsing.

**Independent Test**: Paste a real `maps.app.goo.gl/...` link, confirm a loading state appears during the network round-trip, and confirm coordinates populate after it resolves. Then point the same input at a non-Google host and confirm the server rejects it (it is not turned into an open URL-fetching proxy).

**Acceptance Scenarios**:

1. **Given** the admin pastes a `goo.gl/maps/...` or `maps.app.goo.gl/...` short link, **When** they trigger extraction, **Then** a visible loading state is shown (it is a network call, not instant) and, on success, the resolved coordinates populate via the same parser as full URLs.
2. **Given** the endpoint receives a non-Google-short-link host, **When** it is called, **Then** it is rejected server-side (host allowlist) rather than fetching arbitrary domains — verified independently of any client check.
3. **Given** the short link fails to resolve, **When** it is a network/timeout/too-many-redirects failure, **Then** a distinct "couldn't process the short link, try again" message appears (different from "couldn't find coordinates").
4. **Given** a short link resolves but the resolved URL still has no parseable coordinates, **Then** the standard "couldn't find coordinates" guidance appears.

---

### User Story 4 - Trustworthy validation and an accessible, non-destructive workflow (Priority: P3)

Coordinate data is a data-quality control, not a convenience: a wrong coordinate misdirects a customer to the wrong place on the public map (a trust and conversion risk). Every entry method — map click, drag, URL parse, or direct typing — must converge on the same validation, both in the browser and (defensively) on the server. The workflow must be operable without a mouse (keyboard and screen reader), must never silently overwrite valid data on a failure, and must give a non-blocking heads-up when a location looks far outside Saudi Arabia without hard-blocking legitimate edge cases.

**Why this priority**: This is the cross-cutting quality bar that makes the feature trustworthy rather than just convenient. It lands alongside the entry methods because it guards all of them.

**Independent Test**: Type an out-of-range latitude directly into the field (e.g. `95`) and confirm client-side validation rejects it; then send the same invalid payload directly to the create/update API (bypassing the UI) and confirm the server also rejects it. Tab through the entire picker with a keyboard, confirm focus is trapped and `Escape` cancels, and confirm the lat/lng inputs remain usable without ever opening the map.

**Acceptance Scenarios**:

1. **Given** any entry method, **When** coordinates are committed, **Then** latitude is a finite number in `[-90, 90]` and longitude in `[-180, 180]`, and the two are always required together (never one without the other).
2. **Given** a resolved/entered coordinate falls far outside a reasonable Saudi Arabia bounding box (≈ lat 16–33, lng 34–56), **Then** a non-blocking warning is shown ("هذا الموقع يبدو خارج المملكة العربية السعودية…") that does **not** prevent saving.
3. **Given** a direct API request (bypassing the UI) with an out-of-range or incomplete lat/lng, **When** it reaches the server, **Then** it is rejected — proving server-side validation does not merely trust the client — and valid requests persist at full (≥6-decimal) precision with no truncation.
4. **Given** a keyboard-only session, **When** the picker is open, **Then** it is focus-trapped, `Escape` triggers Cancel, tab order reaches both tabs and all controls, and the map's own keyboard navigation (arrows pan, `+`/`-` zoom) remains enabled.
5. **Given** an admin who never opens the picker, **When** they type coordinates directly and save, **Then** the existing create/edit flow works exactly as before (no regression) and the typed fields remain tab-reachable and labeled.
6. **Given** any error condition in §5.2 of the implementation spec (empty input, not a URL, not a Google Maps link, no coordinates found, short-link failure, out-of-range), **Then** its distinct, specific message is shown — never collapsed into one generic "invalid link" message, and never an unhandled exception that crashes the form/modal.

---

### Edge Cases

- **`(0,0)` null-island**: the picker must never open centered on `0,0` — it must use existing coordinates or the KSA/Riyadh default.
- **Place-name-only search link** (e.g. `?q=Riyadh+Tower`): "no coordinates found" guidance, not an error/crash; the `q=` value is not numeric.
- **`@lat,lng` viewport vs. `!3d/!4d` place data both present**: the place (`!3d/!4d`) pair wins.
- **Short link whose destination has no coordinates** (e.g. resolves to a place search): resolution succeeds but parsing yields "no coordinates found."
- **Malformed/non-Google URL pasted**: distinct "this doesn't look like a Google Maps link" message; never falls back to a default/partial coordinate.
- **Out-of-range numbers extracted from a URL**: re-validated against §5.1 before use; never trusted just because they came from a Google-shaped URL.
- **Failed parse must not partially populate**: never write a latitude without a longitude (or vice versa); the form's prior values stay intact.
- **Pick-then-Cancel**: cancelling after moving the marker must leave the form's pre-existing values byte-for-byte unchanged.
- **Slow/unresponsive short-link target**: the server endpoint must time out (not hang the admin's request indefinitely) and surface a retryable failure.
- **Editing a point with existing coordinates**: the form shows them and the picker centers on them (regression check).
- **Precision on persistence**: stored coordinates must survive a round-trip at ≥6 decimal places (no column-type truncation silently reducing precision).
- **Map not needed for every form view**: the map code must not be bundled into the initial admin form page load; it loads only when the picker opens.

## Requirements *(mandatory)*

### Functional Requirements

**Map location picker**

- **FR-001**: The sales-point create/edit form MUST offer a **اختر من الخريطة (Select from map)** action beside the latitude/longitude fields that opens a location-picker dialog.
- **FR-002**: The picker MUST render an interactive map that reuses the project's existing, confirmed map rendering approach (the same stack as the public map), reusing the existing theme-aware tile logic where the admin shares the theme mechanism — and MUST NOT introduce a new map provider (no Google Maps JS API, no Mapbox, no second competing renderer).
- **FR-003**: When editing a point with valid coordinates, the picker MUST open centered on those coordinates at a close zoom (≈14–15) with the marker pre-placed. When creating a new point with no coordinates, it MUST open centered on Saudi Arabia / Riyadh at a country/region zoom (≈5–6). It MUST NEVER open centered on `(0,0)`.
- **FR-004**: Clicking the map MUST place a single marker (or move the existing one); the marker MUST be draggable; dragging and clicking MUST update the same single source of truth; and only one marker may exist at a time.
- **FR-005**: Beside the map, the picker MUST show the current coordinates at 6 decimal places as an **editable** numeric field that is **two-way synced** with the marker: placing/dragging the marker updates the field, and typing valid values into the field moves the marker. Typed values are subject to the same validation as any other entry method (FR-012); invalid values are rejected, not silently applied. The field reflects the in-picker (uncommitted) selection and, like all in-picker edits, is committed to the form only on Confirm.

**Google Maps URL parsing**

- **FR-006**: The picker MUST provide a **رابط جوجل ماب (Google Maps link)** entry path that accepts a pasted URL and extracts coordinates from each of these full-URL formats, entirely client-side with no network call: (a) `@lat,lng,zoom` in the path; (b) `!3d<lat>!4d<lng>` inside a `data=` segment — which MUST take priority over a simultaneously-present `@lat,lng` viewport value; (c) `q=lat,lng` query parameter (only when the value is numeric — a place-name `q=` is "no coordinates," not an error); and (d) `ll=lat,lng` query parameter.
- **FR-007**: The parsing logic MUST be a framework-agnostic, pure utility (no UI/network dependency) so it is trivially unit-testable and is reused unchanged after short-link resolution (resolve-then-parse, not a second parser).
- **FR-008**: A successful parse MUST populate the picker's shared state (so switching to the Map tab shows the marker already placed) and show a success indicator; it MUST NOT clear or overwrite any already-valid form lat/lng on a failure, and MUST NEVER write a latitude without a longitude (or vice versa).

**Short-link resolution**

- **FR-009**: Short links on `goo.gl` / `maps.app.goo.gl` (and any confirmed short Google Maps host) MUST be resolved through a new admin-authenticated server endpoint that follows the redirect chain server-side and returns the final URL, which is then parsed by the same utility as full URLs. A visible loading state MUST be shown while the call is in flight.
- **FR-010**: The resolution endpoint MUST be protected by the same admin authentication/authorization as the rest of the admin API and MUST enforce a server-side host allowlist (rejecting any non-Google-short-link host) so it cannot be used as an open URL-fetching proxy (SSRF guard). It MUST impose a redirect-count limit and a timeout, and MUST return distinguishable errors for invalid host, timeout, too-many-redirects, and generic network failure.
- **FR-011**: The endpoint MUST follow only the redirect chain and return the final URL; it MUST NOT fetch or parse the destination page's HTML body.

**Validation, errors & data quality**

- **FR-012**: Regardless of entry method (map, drag, URL parse, or direct typing), latitude MUST be a finite number in `[-90, 90]` and longitude in `[-180, 180]`, and the two MUST be required together (one without the other is invalid, not a valid partial).
- **FR-013**: The create/update API MUST independently re-validate FR-012 server-side before persisting, so a request that bypasses the UI with an out-of-range or incomplete lat/lng is rejected. Persisted values MUST round-trip at ≥6-decimal precision with no truncation introduced by the storage layer.
- **FR-014**: When a resolved/entered coordinate falls far outside a reasonable Saudi Arabia bounding box (≈ lat 16–33, lng 34–56), the UI MUST show a non-blocking warning ("هذا الموقع يبدو خارج المملكة العربية السعودية — تأكد من صحة الرابط أو التحديد") that does NOT prevent saving.
- **FR-015**: Every URL-parse failure condition MUST show its distinct, specific message (empty input; not a valid URL; not a recognized Google Maps link; recognized link but no coordinates found; short-link resolution network/server failure; extracted values out of range), per the implementation spec's §5.2 table — never collapsed into one generic "invalid link" message, and never an unhandled exception that crashes the form or modal.

**Modal assembly, form integration & accessibility**

- **FR-016**: The picker MUST be a single dialog (titled **تحديد الموقع الجغرافي**) reusing the project's existing dialog primitive, with two tabs (**الخريطة** and **رابط جوجل ماب**) sharing one `{ lat, lng }` state, plus a single shared **تأكيد الموقع (Confirm)** action that commits to the form and a single **إلغاء (Cancel)** that discards and closes without side effects. Confirm is the only path that writes to the underlying form fields; Cancel (and `Escape`) must leave prior form values unchanged.
- **FR-017**: The form integration MUST populate the form's actual existing `latitude`/`longitude` state using the form's existing state approach (no parallel/competing state). The existing manual lat/lng inputs MUST remain present, labeled, tab-reachable, and editable as a non-map fallback, and client-side range validation (FR-012) MUST run on them regardless of entry method.
- **FR-018**: The dialog MUST be keyboard-operable and focus-trapped while open; `Escape` MUST trigger Cancel; tab order MUST reach both tabs and all interactive controls in the active tab; the map's built-in keyboard navigation MUST remain enabled; error messages MUST be associated with their input via the project's existing form-error accessibility convention (e.g. `aria-describedby`); and the URL-extract loading state MUST announce progress/completion to assistive tech (e.g. an `aria-live="polite"` region).
- **FR-019**: New UI MUST reuse the admin panel's existing design tokens, input/button/dialog primitives, and inline-error convention. The only net-new visual elements are the map container, the draggable marker, and a small inline preview/status area — which MUST read as part of this admin form, not as a bolted-on third-party widget.

**Reuse & performance constraints**

- **FR-020**: No new map provider/library and no external Google-Maps-URL-parsing package may be introduced; the parser is a small, fully-owned internal utility, and redirect-following uses the runtime's built-in HTTP facilities (no new HTTP client library solely for this call).
- **FR-021**: The map and its CSS MUST be loaded only when the picker is actually opened (code-split / dynamic import, mirroring the existing public map's loading pattern), so it is not bundled into the initial admin form page load. The resolution endpoint MUST enforce its server-side timeout so a slow redirect target cannot hang the request.

### Key Entities *(include if feature involves data)*

- **Sales Point (existing)**: a physical sales location managed in the admin panel. Relevant existing attributes: city, neighborhood/extra label, VIP flag, contact/social links, a Google Maps URL, and **`latitude`/`longitude`** (already stored as nullable numbers). This feature changes *how* those two fields are filled and validated — not the persisted shape.
- **Picked Location (transient)**: the single `{ lat, lng } | null` selection held inside the picker dialog, shared by both the Map tab and the URL tab, committed to the form only on Confirm.
- **Parsed Google Maps URL (transient)**: a pasted Google Maps link reduced by the parser utility to either a coordinate pair or a typed "not found / not a Google Maps URL" result; for short links, the resolved final URL is fed back through the same parser.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An admin can set a sales point's location three ways — by clicking/dragging the map, by pasting a full Google Maps URL, and by pasting a short link — and in every case correct, validated coordinates land in the form's lat/lng fields after a single Confirm.
- **SC-002**: All five supported Google Maps URL shapes work (the four full-URL formats plus one real `maps.app.goo.gl` short link resolved end-to-end through the server), verified against live, current Google Maps links at implementation time.
- **SC-003**: Every distinct failure condition produces its own specific, actionable Arabic message (none collapsed into a generic "invalid link"), and no failure ever partially populates the form or crashes the modal.
- **SC-004**: A direct API request that bypasses the UI with an out-of-range or incomplete lat/lng is rejected by the server, while a valid request persists and round-trips at full (≥6-decimal) precision — proving validation is not client-only and precision is not lost.
- **SC-005**: The entire picker workflow is operable by keyboard alone (open, switch tabs, place/adjust a location or paste a link, Confirm/Cancel via `Escape`), and the lat/lng inputs remain a fully usable, labeled, tab-reachable fallback without ever opening the map.
- **SC-006**: No new map provider and no external Google-Maps-URL-parsing dependency are added; the map is code-split so it is absent from the initial admin form page load; and all new UI reuses the existing design tokens and dialog/input/button primitives.
- **SC-007**: The existing sales-point create/edit flow has zero regressions for an admin who never opens the picker — manually typing coordinates and saving works exactly as before — and the short-link endpoint and the form/API changes are delivered as independently revertible increments.

## Assumptions

These were verified against this repository at spec-writing time and feed the implementation's T0 discovery task:

- **A1 — Same app, same stack: CONFIRMED.** The admin panel lives in the same Next.js 14 (App Router) app under the `app/(admin)/admin/...` route group, using the same TypeScript + Tailwind stack as the public site. No separate app/repo translation is needed.
- **A2 — lat/lng already exist as raw inputs: CONFIRMED.** The form is `components/admin/SalesPointForm.tsx`; it already renders `خط العرض (Lat)` and `خط الطول (Lng)` as `type="number" step="any"` inputs stored as `number | null`. So this feature *upgrades* them with the picker and tightens validation rather than adding new fields. Other existing fields: city (Select), neighborhood (Select), extra label (Input), Google Maps URL (Input, required), VIP (Switch), and seven social-link inputs.
- **A3 — Persistence via existing REST route + Zod: CONFIRMED.** Sales points are persisted through `app/api/sales-points/route.ts` (POST) and `app/api/sales-points/[id]/route.ts` (PUT), which validate the body with the Zod `salesPointSchema` in `lib/validators.ts` and write to MongoDB (collection `sales_points`, via `lib/mongodb`). The new short-link endpoint follows this same REST-route + `getSession()` convention. **Gap to close (T7):** `salesPointSchema` currently defines `lat: z.number().nullable()` and `lng: z.number().nullable()` with **no range and no required-together rule** — server-side validation must be added.
- **A4 — Admin auth already exists: CONFIRMED.** Auth is an iron-session (`lib/session.ts`, `getSession()`); write routes check `session.isAdmin` and return 401 otherwise. The new endpoint reuses this same guard. (No new auth is built; if any admin route were unguarded, that is a pre-existing gap to flag, not in scope here.)
- **A5 — Map stack reusable: CONFIRMED.** Dependencies `leaflet@^1.9.4`, `react-leaflet@^4.2.1`, and `leaflet.markercluster@^1.5.3` are present; the reference renderer is `components/public/MapView.tsx`. The picker reuses this stack and its theme-aware tile logic — no new map provider. **Code-split pattern confirmed:** the public map is loaded via `dynamic(() => import('./MapView'), { ssr: false })`; the admin picker MUST mirror this so it is not in the initial form load.
- **A6 — Theme mechanism (correction of the prior spec's assumption):** The app does **not** use `next-themes` at runtime (see the `SPEC-DEVIATION` note in `lib/hooks/use-active-theme.ts`). Theme is set by an inline script in `app/layout.tsx` + `ThemeSwitcher` (`.dark` class + `data-theme` attribute) and read reactively via the `useActiveTheme()` hook, which `MapView` already uses to swap CARTO `dark_all` vs OSM tiles live. The admin panel shares the same `var(--color-*)` token system. The picker should reuse `useActiveTheme()` + the same conditional tile logic if theme switching is reachable in the admin chrome; otherwise a single tile set is acceptable (per the spec's T0 point 6 fallback). The server-side short-link endpoint is theme-agnostic.
- **A7 — UI primitives to reuse: CONFIRMED.** shadcn/Radix primitives already exist in `components/ui/`: `dialog.tsx`, `tabs.tsx`, `input.tsx`, `label.tsx`, `button.tsx`, `select.tsx`, `switch.tsx`. The admin also has `components/admin/ConfirmModal.tsx` (built on `alert-dialog.tsx`) as a reference for the dialog action-bar pattern. Inline-error convention in this form is a red `<p>` beneath the field; success/error toasts use `sonner`. The new picker MUST reuse `dialog` + `tabs` and the existing button/input/error conventions.
- **A8 — "Multiple ways to fill one field" pattern: NOT FOUND.** Discovery found no existing tabs/upload-vs-URL/dual-entry pattern in the admin panel. Per the implementation spec's §4.1 fallback, this resolves to the **default**: one modal, two tabs, shared state, single Confirm/Cancel (recorded in *Clarifications*).
- **A9 — Form-state approach: CONFIRMED as plain `useState`.** `SalesPointForm` manages its state with React `useState` (not React Hook Form / Formik) and does its own input wiring via an `update(field, value)` helper. The picker's Confirm MUST write through this same `update('lat', …)` / `update('lng', …)` path — no parallel state library is introduced for these two fields.
- **A10 — Test infrastructure: NOT PRESENT.** No Jest/Vitest/Playwright and no `test` script exist (the `__tests__/` directory is empty); `tsx` is available for scripts. Per the implementation spec, no new test framework is introduced speculatively; manual verification is the minimum bar, with the parser-utility unit tests and the SSRF host-allowlist regression test flagged as follow-ups to add *if/when* a runner is introduced.
- **A11 — Icons:** `lucide-react` is present; new icons reuse it or inline SVG (no new icon library).
- **Constitution**: `.specify/memory/constitution.md` is still in its unfilled template form (no project-specific governance constraints), so no additional governance rules apply beyond this spec.

## Suggested follow-ups (explicitly out of scope)

- Introduce a test runner (Vitest/Jest) and add the parser-utility unit tests and the SSRF host-allowlist regression test (the highest-value automated coverage called out by the implementation spec) — do not add a framework speculatively as part of this feature.
- Auto-fill the form's Google Maps URL field from a successfully parsed link when one is absent, or reverse-sync a picker selection back into a shareable URL — not required by this spec.
- Add the optional "distance from previously saved location" readout when editing (nice-to-have per the implementation spec's §4.2) if a trivial library utility is used; no custom geodesic math.
- Build admin-side auth if discovery were ever to find an unguarded admin surface (a flagged concern, not this feature's job).
- Batch/bulk coordinate backfill or import for legacy points lacking lat/lng.
