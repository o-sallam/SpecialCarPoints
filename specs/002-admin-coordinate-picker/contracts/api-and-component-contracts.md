# API & Component Contracts: Admin — Sales Point Geographic Coordinate Management

This feature adds **one new external API contract** (the short-link resolution endpoint), **tightens** the validation of two existing routes, and adds a set of **internal TypeScript contracts** (component props + the parser utility). All shapes are pinned here so each task is unambiguous. See [data-model.md](../data-model.md) for entity shapes and [research.md](../research.md) for rationale.

---

## 1. NEW external contract — `POST /api/admin/resolve-map-url`

Resolves a Google Maps **short link** to its final URL (server-side redirect-follow). Full Google Maps URLs are **never** sent here (parsed client-side).

**Auth**: requires an admin session (`getSession().isAdmin`); otherwise `401`. Same guard as the other admin write routes.

**Request**
```http
POST /api/admin/resolve-map-url
Content-Type: application/json
Cookie: special-car-session=…

{ "url": "https://maps.app.goo.gl/…" }
```

**Responses**

| Outcome | HTTP | Body | Client mapping (§5.2) |
|---|---|---|---|
| Success | 200 | `{ "resolvedUrl": "https://www.google.com/maps/place/…/@…,15z/data=…!3d…!4d…" }` | client re-runs `parseGoogleMapsUrl(resolvedUrl)` |
| Not an allowed short-link host | 400 | `{ "error": "invalid_host" }` | (client never sends non-short hosts; treat defensively as "couldn't process") |
| Too many redirects (>5 hops) | 504 | `{ "error": "too_many_redirects" }` | "تعذّر معالجة الرابط المختصر، حاول مرة أخرى" |
| Timed out (≤5 s) | 504 | `{ "error": "timeout" }` | "تعذّر معالجة الرابط المختصر، حاول مرة أخرى" |
| Other network failure | 502 | `{ "error": "network_error" }` | "تعذّر معالجة الرابط المختصر، حاول مرة أخرى" |
| Not admin | 401 | `{ "error": "Unauthorized" }` | (session expired — admin re-logs in) |

**Hard guarantees**:
- **Host allowlist** enforced server-side: only `goo.gl` and `maps.app.goo.gl`. Everything else ⇒ `invalid_host`. This is the primary SSRF defense and is verified independently of any client check (FR-010).
- **Never reads the response body** — only the final redirect-chain URL is returned (FR-011).
- Max **5** redirects; **5 s** timeout; `runtime = 'nodejs'`, `dynamic = 'force-dynamic'` (live outbound request).

**Allowed hosts (client-side routing)** — `GoogleMapsUrlTab` calls this endpoint **only** when the pasted URL's host is `goo.gl` or `maps.app.goo.gl`; all other recognized Google Maps URLs are parsed client-side with zero network requests.

---

## 2. MODIFIED external contract — `POST /api/sales-points` and `PUT /api/sales-points/[id]`

**No shape change.** The request/response bodies are identical to today. The **only** change is tighter `lat`/`lng` validation in the shared Zod `salesPointSchema` (`lib/validators.ts`), which both handlers already run via `salesPointSchema.parse(body)`.

**New `lat`/`lng` validation (both-or-neither + range):**
- `(null, null)` ⇒ valid.
- `(lat ∈ [-90, 90], lng ∈ [-180, 180])` (both finite) ⇒ valid.
- `(value, null)` or `(null, value)` ⇒ **400** `{ error: 'Invalid input', details: […] }` (the existing ZodError path).
- Either value out of range / non-finite ⇒ **400** (same path).

A direct API request bypassing the UI with an out-of-range or half-filled pair is therefore rejected server-side (FR-013, SC-004). No other field's validation changes; the existing `googleMapUrl` (required URL), `cityId`, etc. rules are untouched.

---

## 3. Internal contracts — component props (TypeScript)

### `SalesPointForm` (MODIFIED — `components/admin/SalesPointForm.tsx`)
Existing prop surface **unchanged**; internal additions only.
```ts
interface SalesPointFormProps {
  initialData?: SalesPointData        // unchanged (already carries lat/lng as number|null)
  onSubmit: (data: SalesPointData) => Promise<void>
  isEditing?: boolean
}
// Internal additions:
//   - "اختر من الخريطة" button beside the lat/lng grid cells; opens the picker.
//   - LocationPickerModal loaded via next/dynamic({ ssr:false }) — Leaflet stays out of the initial bundle.
//   - Picker onConfirm writes through the EXISTING update('lat', v)/update('lng', v) — no parallel state.
//   - Thin client range guard on the lat/lng inputs (reuses lib/coordinates.ts).
//   - Existing manual lat/lng inputs REMAIN present, labeled, tab-reachable, editable (non-map fallback).
```

### `LocationPickerModal` (NEW — `components/admin/location-picker/LocationPickerModal.tsx`)
```ts
interface LocationPickerModalProps {
  open: boolean
  initialCoords: { lat: number; lng: number } | null   // form's current lat/lng (or null for new)
  onConfirm: (coords: { lat: number; lng: number } | null) => void  // null allowed (clear)
  onCancel: () => void                                  // must NOT mutate form state
}
// Renders: shadcn <Dialog> (title "تحديد الموقع الجغرافي") + <Tabs> with two tabs:
//   - "الخريطة"  → <MapPickerTab>
//   - "رابط جوجل ماب" → <GoogleMapsUrlTab>
// Owns the single shared PickedLocation state; both tabs read/write it.
// Footer: single "تأكيد الموقع" (Confirm → onConfirm) + "إلغاء" (Cancel → onCancel).
// Radix Dialog gives focus-trap + Escape→onCancel for free.
```

### `MapPickerTab` (NEW — `components/admin/location-picker/MapPickerTab.tsx`)
```ts
interface MapPickerTabProps {
  value: { lat: number; lng: number } | null            // shared PickedLocation (controlled)
  onChange: (next: { lat: number; lng: number }) => void
}
// react-leaflet v4 declarative: <MapContainer> + <TileLayer key={theme} …> (theme via useActiveTheme)
//   + <Marker draggable position eventHandlers={{dragend}}> + useMapEvents({click}).
// Initial center/zoom: value present → [lat,lng] @ ~14–15; null → KSA_DEFAULT_CENTER @ ~5–6. NEVER (0,0).
// Single marker only (click moves it). Editable lat/lng field beside the map, two-way synced with the
// marker (drag updates field; valid typed value moves marker; invalid typed value rejected per FR-012).
// Live readout at 6 decimals. Map keyboard handlers remain ENABLED.
// Optional (R8): "عن الموقع السابق: ~X كم" via lib/geo.ts haversineKm, shown only when editing & moved >0.5 km.
```

### `GoogleMapsUrlTab` (NEW — `components/admin/location-picker/GoogleMapsUrlTab.tsx`)
```ts
interface GoogleMapsUrlTabProps {
  value: { lat: number; lng: number } | null            // shared PickedLocation (to keep marker synced)
  onChange: (next: { lat: number; lng: number }) => void
  savedCoords?: { lat: number; lng: number } | null     // for the optional distance readout context
}
// Renders: <Input> + "استخراج الإحداثيات" button + inline result/error area (red <p>, aria-describedby)
//   + aria-live="polite" status region for the loading→done transition.
// Flow:
//   1. empty input submitted → "الرجاء لصق رابط من خرائط جوجل" (no parse attempted).
//   2. parse with parseGoogleMapsUrl(url):
//        ok            → onChange({lat,lng}) + green check + resolved coords; NO network call.
//        notAUrl       → "الرابط الذي تم لصقه غير صالح".
//        notGoogleMaps → "هذا الرابط لا يبدو رابط خرائط جوجل".
//        noCoordinates → "تعذّر العثور على إحداثيات في هذا الرابط، جرّب نسخ الرابط من شريط العنوان…".
//        outOfRange    → standard out-of-range message (FR-015).
//   3. if host is a short link (goo.gl / maps.app.goo.gl): show spinner, POST /api/admin/resolve-map-url,
//        then re-run parseGoogleMapsUrl(resolvedUrl); map endpoint errors to the "تعذّر معالجة الرابط المختصر" message.
// On any failure: existing form lat/lng are NOT mutated; no partial lat-without-lng write (FR-008).
```

---

## 4. Internal contract — `parseGoogleMapsUrl` utility (`lib/google-maps-url-parser.ts`)

Pure, dependency-free, framework-agnostic (no React/DOM/network) — trivially unit-testable (research R1).

```ts
export type ParseResult =
  | { ok: true;  lat: number; lng: number }
  | { ok: false; reason: 'notAUrl' | 'notGoogleMaps' | 'noCoordinates' | 'outOfRange' }

export function parseGoogleMapsUrl(input: string): ParseResult
```

**Guarantees**:
- Returns a typed result — **never throws** on bad input (FR-015: "never an unhandled exception").
- Recognized Google Maps hosts (lenient, incl. country `google.*` variants + short-link hosts).
- Extraction priority: `!3d<lat>!4d<lng>` (data=, the *place*) **beats** `@lat,lng` (viewport) when both are present (FR-006). Then numeric `q=`/`ll=`. A place-name `q=` ⇒ `noCoordinates`, not an error.
- Range-validates against `lib/coordinates.ts` before returning `ok` ⇒ out-of-range numbers ⇒ `outOfRange`.
- Reused unchanged for the short-link path (resolve-then-parse) — there is exactly one parser (FR-007).

**Shared constants** (`lib/coordinates.ts`, imported by parser, validators, form, and tab):
```ts
export const LAT_RANGE = [-90, 90] as const
export const LNG_RANGE = [-180, 180] as const
export const KSA_BBOX = { lat: [16, 33], lng: [34, 56] } as const
export const KSA_DEFAULT_CENTER = { lat: 24.7136, lng: 46.6753 }
export function isCoordinatePairValid(lat: number|null, lng: number|null): boolean
export function ksaWarning(lat: number, lng: number): string | null
```

---

## 5. Behavioral contracts (must-not-regress)

- **Existing manual entry**: typing lat/lng directly and saving works exactly as before (just with the new range/both-or-neither guard) — the create/edit flow has **zero regressions** for an admin who never opens the picker (SC-007).
- **Confirm/Cancel isolation**: Cancel (and Escape) after moving the marker leaves the form's prior values byte-for-byte unchanged; only Confirm writes to the form (FR-016, edge case "Pick-then-Cancel").
- **Single source of truth**: clicking, dragging, typing in the editable field, and URL-parse success all update the same `PickedLocation` — never two competing states (FR-004/FR-005/FR-008).
- **Map stack unchanged**: Leaflet + react-leaflet reused; no new map provider. Theme tiles reuse `useActiveTheme()` + the CARTO-dark/OSM-light conditional (research R3).
- **No new runtime dependencies**: `package.json` gains **zero** entries — no map provider, no URL-parsing package, no HTTP client (FR-020, SC-006).
