# Tasks: Admin — Sales Point Geographic Coordinate Management

**Input**: Design documents from `/specs/002-admin-coordinate-picker/` — [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/api-and-component-contracts.md](./contracts/api-and-component-contracts.md), [quickstart.md](./quickstart.md).

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅.

**Tests**: None generated. The project has no automated test runner and the spec explicitly defers adding one (FR/§11). Validation is **manual** via [quickstart.md](./quickstart.md). No TDD/test tasks. (The highest-value automated tests — `googleMapsUrlParser` unit tests + the SSRF host-allowlist regression — are recorded as follow-ups, to add *if/when* a runner is introduced; they are out of scope here.)

**Organization**: Tasks grouped by user story (spec.md P1→P3). The implementation spec's task IDs map onto these stories: T0(discovery)→Foundational verify · T1(parser)→US2 · T2(endpoint)→US3 · T3(MapPickerTab)→US1 · T4(GoogleMapsUrlTab)→US2(+US3 short-link branch) · T5(LocationPickerModal)→US1 · T6(form integration)→US1 · T7(server validation)→US4. **Each story = its own PR/commit.** The two highest-risk increments — the new outbound-request endpoint (US3) and the live form/API validation change (US4 server part) — land as **isolated PRs** (spec §13).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no dependency on an incomplete task).
- **[Story]**: which user story (US1–US4).
- Exact file paths are included in every task.

## Path conventions

Single-project Next.js 14 App Router. Admin form: `components/admin/SalesPointForm.tsx`. New picker components: `components/admin/location-picker/`. shadcn primitives: `components/ui/`. Libs: `lib/`. Admin API: `app/api/...`. Admin pages: `app/(admin)/admin/sales-points/{new,[id]}/page.tsx`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm dependencies. This feature adds **zero** new runtime dependencies (FR-020/SC-006) — Leaflet/react-leaflet, Zod, Radix (dialog/tabs), iron-session, mongodb are already present.

- [X] T001 Confirm no new dependencies are required in `package.json` — verify `leaflet@^1.9.4`, `react-leaflet@^4.2.1`, `zod@^3.22`, `@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `iron-session`, and `mongodb` already resolve; do **not** install any map provider, URL-parsing package, or HTTP-client library (spec FR-020/§12)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared, low-risk infrastructure referenced by multiple user stories. Must exist before US1 (the MVP).

- [X] T002 [P] Create shared coordinate constants/helpers in `lib/coordinates.ts` — `LAT_RANGE=[-90,90]`, `LNG_RANGE=[-180,180]`, `KSA_BBOX={lat:[16,33],lng:[34,56]}`, `KSA_DEFAULT_CENTER={lat:24.7136,lng:46.6753}`, `isFiniteInRange()`, `isCoordinatePairValid(lat,lng)` (both-or-neither + range), `ksaWarning(lat,lng)` (returns the Arabic notice or `null`); single source of truth imported by the parser, validators, form, and tab (research R5)
- [X] T003 [P] Verify discovery findings (impl-spec T0) still hold before building on them — confirm `components/admin/SalesPointForm.tsx` renders `lat`/`lng` as `type="number"` (`number|null`), `lib/validators.ts` `salesPointSchema` currently has bare `z.number().nullable()` for both (no range/both-or-neither), `app/api/sales-points/route.ts` (POST) + `[id]/route.ts` (PUT) both `getSession().isAdmin`-gated and call `salesPointSchema.parse(body)`, shadcn `components/ui/dialog.tsx` + `tabs.tsx` exist, and the public map's `next/dynamic({ssr:false})` code-split pattern in `components/public/AccordionLocator.tsx`; record any drift as a `// SPEC-DEVIATION:` comment

**Checkpoint**: shared coordinate module + discovery verified; user-story work can begin.

---

## Phase 3: User Story 1 — Set a location by clicking the map (Priority: P1) 🎯 MVP

**Goal**: An admin opens a map from the sales-point form, clicks/drag to place a single marker (with an editable, two-way-synced coordinate field), and Confirm writes the coordinates into the form while Cancel changes nothing.

**Independent Test** (quickstart Scenario A): New point → picker opens centered on KSA/Riyadh (~zoom 5–6), never `(0,0)`; edit point → centers on saved coords (~zoom 14–15) with marker pre-placed; click moves a single marker; drag updates the live 6-decimal field; typing a valid value moves the marker (invalid is rejected); Confirm writes to the form; Cancel/Escape leaves prior values untouched.

- [X] T004 [US1] Create `components/admin/location-picker/MapPickerTab.tsx` — react-leaflet v4 declarative (`<MapContainer>`, `<TileLayer key={theme}>` via `useActiveTheme()` for CARTO-dark/OSM-light, `<Marker draggable position eventHandlers={{dragend}}>`), a `useMapEvents({click})` child to place/move a **single** marker, initial center/zoom per FR-003 (existing coords→~14–15; none→`KSA_DEFAULT_CENTER`~5–6; **never `(0,0)`**), an **editable** lat/lng field beside the map two-way synced with the marker (drag→field; valid typed→marker; invalid typed→rejected per FR-012) with a live 6-decimal readout, and Leaflet's keyboard handlers left **enabled** (research R3/R6); optional (R8, cut if schedule risk): "عن الموقع السابق: ~X كم" via `lib/geo.ts` `haversineKm` shown only when editing & moved >0.5 km
- [X] T005 [US1] Create `components/admin/location-picker/LocationPickerModal.tsx` — shadcn `<Dialog>` (title "تحديد الموقع الجغرافي") + `<Tabs>` with two triggers ("الخريطة" / "رابط جوجل ماب"); own the single shared `PickedLocation` state (`{lat,lng}|null`) initialized from `initialCoords`; render `<MapPickerTab value=… onChange=…>` in the Map tab; footer with one **تأكيد الموقع** (→ `onConfirm(state)`) and one **إلغاء** (→ `onCancel`, no mutation); rely on Radix for focus-trap + `Escape`→`onCancel`. Props per [contracts](./contracts/api-and-component-contracts.md) §3 (depends on T004)
- [X] T006 [US1] Wire the picker into `components/admin/SalesPointForm.tsx` — add an **اختر من الخريطة** button beside the lat/lng grid cells; load `LocationPickerModal` via `next/dynamic(() => import('./location-picker/LocationPickerModal'), { ssr:false })` so Leaflet/CSS stay out of the initial form bundle (FR-021); manage `open` state; pass `initialCoords={{lat:form.lat,lng:form.lng}}`; on Confirm call the existing `update('lat', v)/update('lng', v)` — **no parallel state** (FR-017/A9); leave the existing manual lat/lng inputs present, labeled, tab-reachable, editable (depends on T005, T002)
- [X] T007 [US1] Verify US1 acceptance against quickstart Scenario A — default vs saved-coords centering, single-marker click/move, drag + editable two-way field, Confirm writes correct values, Cancel/Escape no-op, never `(0,0)`; confirm both themes and no console errors

**Checkpoint**: US1 fully functional and independently testable — the core error-reduction value (visual selection) is delivered without URL parsing or short links.

---

## Phase 4: User Story 2 — Set a location by pasting a Google Maps URL (Priority: P2)

**Goal**: An admin pastes a full Google Maps URL, the four coordinate formats are parsed client-side (zero network), and on success the shared picker state is updated (marker shown on the Map tab) — with a distinct, specific message for every failure and no partial writes.

**Independent Test** (quickstart Scenario B + D message rows): `@lat,lng`, `data=…!3d…!4d…` (preferred over `@`), `q=lat,lng` all parse with **no network request**; a place-name `q=` yields the specific "couldn't find coordinates" message (not a crash); success syncs the marker across tabs; failure never clears existing lat/lng or writes a lat without lng.

- [X] T008 [P] [US2] Create `lib/google-maps-url-parser.ts` — pure, dependency-free `parseGoogleMapsUrl(url): ParseResult` per [contracts](./contracts/api-and-component-contracts.md) §4 / [data-model](./data-model.md); host recognition (incl. country `google.*` + short-link hosts); extraction priority `!3d/!4d` (place) **beats** `@lat,lng` (viewport), then numeric `q=`/`ll=`; range-validate via `lib/coordinates.ts`; return typed `{ok:true,lat,lng} | {ok:false,reason}` (`notAUrl`|`notGoogleMaps`|`noCoordinates`|`outOfRange`); **never throws** (research R1). Depends on T002 only — parallelizable with US1 (different file).
- [X] T009 [US2] Create `components/admin/location-picker/GoogleMapsUrlTab.tsx` and mount it as the second tab in `LocationPickerModal.tsx` — `<Input>` + **استخراج الإحداثيات** button; on submit, parse via `parseGoogleMapsUrl` (**no network** for full URLs); success → `onChange({lat,lng})` + green check + resolved coords (switching to Map tab shows marker placed); map each `reason` to its distinct §5.2 Arabic message inline (red `<p>` with `aria-describedby`); empty input → "الرجاء لصق رابط من خرائط جوجل"; on any failure leave existing state untouched and never write a partial pair (FR-008/FR-015). Depends on T008 and T005.
- [X] T010 [US2] Verify US2 acceptance against quickstart Scenario B + the §5.2 message rows in Scenario D — all four full-URL formats parse client-side (zero requests in Network tab), `!3d/!4d` priority over `@`, place-name `q=`→`noCoordinates`, shared-state marker sync across tabs, distinct messages, no partial writes

**Checkpoint**: US1 (map) AND US2 (full-URL paste) both work and share one `{lat,lng}` state + one Confirm.

---

## Phase 5: User Story 3 — Resolve shared short links reliably (Priority: P3)

**Goal**: `goo.gl`/`maps.app.goo.gl` short links resolve through a new admin-authenticated, SSRF-guarded server endpoint (loading state shown), then parse via the same utility as full URLs.

**Independent Test** (quickstart Scenario C + F.2): a real `maps.app.goo.gl` link shows a spinner then resolves to coordinates; a non-Google host is **rejected server-side** (curl → 400 `invalid_host`); an unauthenticated request → 401; network/timeout failures show the distinct "تعذّر معالجة الرابط المختصر" message (different from "couldn't find coordinates").

- [X] T011 [P] [US3] Create `app/api/admin/resolve-map-url/route.ts` — `POST`, `runtime='nodejs'`, `dynamic='force-dynamic'`; guard with `getSession().isAdmin` (→401); server-side **host allowlist** (`goo.gl`, `maps.app.goo.gl`) else 400 `invalid_host`; resolve with `fetch(…, {redirect:'manual'})` in a manual loop (max **5** hops, resolving each `Location`), `AbortSignal.timeout(5000)`; return 200 `{resolvedUrl}` (final URL only — **never read the body**), or 504 `too_many_redirects` / 504 `timeout` / 502 `network_error` (research R2, [contracts](./contracts/api-and-component-contracts.md) §1). Independent file — parallelizable with US1/US2.
- [X] T012 [US3] Add the short-link branch to `components/admin/location-picker/GoogleMapsUrlTab.tsx` — when the parsed host is `goo.gl`/`maps.app.goo.gl`, show an inline spinner + `aria-live="polite"` status, `POST /api/admin/resolve-map-url {url}`, then re-run `parseGoogleMapsUrl(resolvedUrl)`; map `timeout`/`too_many_redirects`/`network_error` → "تعذّر معالجة الرابط المختصر، حاول مرة أخرى" (distinct from "couldn't find coordinates"); if the resolved URL yields `noCoordinates`, show the standard guidance; on any failure leave existing state untouched (FR-009/§4.3). Depends on T011 and T009 (same file — sequential).
- [X] T013 [US3] Verify US3 acceptance against quickstart Scenario C + F.2 — real short link resolves with a visible loading state; SSRF guard rejects non-Google hosts (curl `invalid_host`); unauthenticated → 401; simulated timeout/network failure → the distinct short-link message; resolved-but-no-coordinates → "couldn't find coordinates"

**Checkpoint**: All five supported Google Maps URL shapes now work (4 full-URL formats + short links end-to-end). **US3 endpoint ships as its own isolated PR** (spec §13).

---

## Phase 6: User Story 4 — Trustworthy validation & accessible, non-destructive workflow (Priority: P3)

**Goal**: Every entry method converges on the same validation on client **and** server; the workflow is keyboard/screen-reader operable; and the KSA warning is non-blocking. This is the cross-cutting quality bar — its server-validation part is independent of the UI and can run in parallel with US1–US3.

**Independent Test** (quickstart Scenario D + E + F.1): a direct API call with an out-of-range or half-filled lat/lng is rejected (both-null succeeds); client-side typing of out-of-range values is rejected; the KSA warning appears but does not block save; the whole modal is keyboard-operable (focus-trapped, Escape cancels, tab order covers both tabs + controls, map keyboard nav on); precision round-trips at ≥6 decimals.

- [X] T014 [P] [US4] Tighten `salesPointSchema` in `lib/validators.ts` — add a Zod `.superRefine` on `{lat,lng}` enforcing **both-or-neither** + range (reusing `lib/coordinates.ts`): `(null,null)` and finite in-range pairs pass; `(value,null)`/`(null,value)`/out-of-range reject. `lat`/`lng` stay nullable. The existing POST (`app/api/sales-points/route.ts`) and PUT (`app/api/sales-points/[id]/route.ts`) handlers already `salesPointSchema.parse(body)`, so both gain the guard with this one edit (FR-013). Depends on T002 only — **parallelizable with US1–US3** (API layer only, impl-spec T7).
- [X] T015 [US4] Add client-side range validation + the non-blocking KSA warning to the manual lat/lng inputs in `components/admin/SalesPointForm.tsx` (reusing `lib/coordinates.ts`) — reject clearly out-of-range typed values inline; show the "هذا الموقع يبدو خارج المملكة العربية السعودية…" warning when a committed/previewed coordinate is far outside `KSA_BBOX` **without** blocking save (FR-014/FR-017); ensure the picker Confirm path is consistent with the same rules. Depends on T002 and T006 (same file as T006 — sequential across phases).
- [X] T016 [US4] Accessibility hardening across `components/admin/location-picker/{LocationPickerModal,MapPickerTab,GoogleMapsUrlTab}.tsx` — confirm Radix Dialog focus-trap + `Escape`→Cancel, tab order reaches both tab triggers + all controls in the active tab, the map's own keyboard handlers remain enabled, inline errors are associated via `aria-describedby`, and the extract status uses an `aria-live="polite"` region; fix any gaps. Depends on T005/T009/T012.
- [X] T017 [US4] Verify US4 acceptance against quickstart Scenario D + E + F.1 — every §5.2 error row shows its distinct message; out-of-range typing rejected client-side; curl proves the server rejects out-of-range/half-filled pairs while both-null succeeds; precision round-trips (≥6 decimals); KSA warning is non-blocking; full keyboard-only operation works

**Checkpoint**: Coordinates are trustworthy end-to-end (client + server) and the workflow is accessible. **The `validators.ts`/route change (T014) ships as its own isolated PR** (spec §13) — check T003 for any non-UI caller of this API (e.g. a bulk import) before tightening.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation and cleanup spanning all stories.

- [X] T018 [P] Run the full [quickstart.md](./quickstart.md) validation (Scenarios A–F + cross-cutting checks: both themes, RTL, KSA warning, console-clean, code-split, manual-entry regression, zero new deps)
- [X] T019 [P] Final cleanup — confirm `package.json` added **zero** dependencies (FR-020/SC-006); confirm the map is code-split (Leaflet JS/CSS absent from `/admin/sales-points/new` until the picker opens); confirm no dead code/unused imports; prepare the PR description flagging isolated PRs (US3 endpoint, US4 server validation) and follow-ups (test runner + parser/SSRF tests, optional distance readout, auto-fill of the Google Maps URL field, bulk backfill)

---

## Dependencies & Execution Order

### Phase dependencies
- **Setup (Phase 1)**: T001 — verification only (no install); no blockers.
- **Foundational (Phase 2)**: T002 (coordinates module) + T003 (discovery verify) — block US1 and the parser. They are independent of each other.
- **User Stories (Phase 3–6)**:
  - **US1 (MVP)** first — establishes the modal shell, MapPickerTab, and form integration that US2/US3 plug into.
  - **US2** depends on US1's modal (T005) + the parser (T008).
  - **US3** depends on US2's tab (T009) + the endpoint (T011).
  - **US4** is cross-cutting: **T014 (server validation) is independent and can run in parallel with US1–US3** (API layer only). T015/T016 depend on the UI deliverables; T017 is verification.
- **Polish (Phase 7)**: after all stories.

### Within / across stories (file-conflict notes)
- `components/admin/SalesPointForm.tsx` is edited by **T006 (US1)** then **T015 (US4)** — sequential across phases; not parallel.
- `components/admin/location-picker/GoogleMapsUrlTab.tsx` is created by **T009 (US2)** then extended by **T012 (US3)** — sequential; not parallel.
- `lib/validators.ts` is edited only by **T014** — parallel with all UI work (different file, depends on T002).
- New files with no overlap: `lib/coordinates.ts` (T002), `lib/google-maps-url-parser.ts` (T008), `components/admin/location-picker/MapPickerTab.tsx` (T004), `…/LocationPickerModal.tsx` (T005), `app/api/admin/resolve-map-url/route.ts` (T011).

### Independent test criteria per story
- **US1**: default vs saved-coords centering (never `(0,0)`); single marker click/move; drag + editable two-way field; Confirm writes; Cancel/Escape no-op. (Scenario A)
- **US2**: four full-URL formats parse client-side (zero requests); `!3d/!4d` priority; place-name `q=`→`noCoordinates`; shared-state marker sync; distinct messages; no partial writes. (Scenarios B + D)
- **US3**: short link resolves with loading state; SSRF host allowlist (curl); 401 unauth; timeout/network → distinct message; resolved-but-no-coords → guidance. (Scenarios C + F.2)
- **US4**: server rejects out-of-range/half-filled via curl (both-null ok); client range guard; KSA warning non-blocking; keyboard-operable + focus-trapped + aria-live + map kbd nav; precision round-trip. (Scenarios D + E + F.1)

### Parallel opportunities
- Phase 2: T002 ∥ T003.
- **T008 (parser, US2) ∥ US1 work** — different file, depends only on T002.
- **T011 (endpoint, US3) ∥ US1/US2** — independent server file.
- **T014 (server validation, US4) ∥ US1–US3** — API layer only.
- Phase 7: T018 ∥ T019.

---

## Implementation Strategy

### MVP first (US1 only)
1. Phase 1 Setup (T001) + Phase 2 Foundational (T002, T003).
2. Phase 3 US1 (T004–T007).
3. **STOP & VALIDATE** via quickstart Scenario A — admins can already set a location by map and Confirm it, delivering the primary error-reduction value without URL parsing or short links.

### Incremental delivery (one PR per story)
1. US1 (T001–T007) → map picker, **MVP**.
2. US2 (T008–T010) → full-URL paste (client-side, zero network).
3. US3 (T011–T013) → **isolated PR** (new endpoint) — short-link support.
4. US4 (T014–T017) → validation + a11y; **T014 (server validation) is its own isolated PR** within US4.
5. Phase 7 (T018–T019) → validate + cleanup.

Each increment is independently revertible (spec §13). The two medium-risk areas — the new outbound-request endpoint (US3) and the live form/API validation tightening (US4/T014) — get their own isolated PRs and the most careful review.

### Parallel team strategy
With multiple developers after Foundational:
- Developer A: US1 (T004→T005→T006→T007).
- Developer B (parallel): T008 (parser) → T011 (endpoint) → wire US2/US3 once US1's modal lands.
- Developer C (parallel): T014 (server validation) — fully independent of the UI.

---

## Notes
- [P] = different files, no dependency on an incomplete task.
- [Story] label maps a task to its user story for traceability.
- No test tasks: validation is manual via quickstart.md (no test infra; adding one is a flagged follow-up, not in scope — research/quickstart note the parser + SSRF tests as the first things to add).
- Commit after each task; each user story is its own PR (US3 endpoint and US4 server-validation isolated per spec §13).
