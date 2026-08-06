# Data Model: Admin — Sales Point Geographic Coordinate Management

**Key point: NO persisted-schema migration.** The only data-layer change is tightening the **Zod validation** for `lat`/`lng` (range + both-or-neither). `lat`/`lng` are already stored as nullable BSON doubles (`lib/types.ts` `SalesPoint`), which round-trip ≥6 decimals with no truncation, so no column-type/precision work is needed. The entities below document (a) the existing persisted shape and its tightened validation, and (b) the **transient** in-memory types the new picker/parser/endpoint produce (never stored).

---

## Entity: `SalesPoint` (existing — persisted, validation TIGHTENED)

A single sales point in the `sales_points` MongoDB collection. Source: `lib/types.ts`.

| Field | Type | Notes |
|---|---|---|
| `_id` | `ObjectId` | Primary key. |
| `cityId` | `ObjectId` | Required. |
| `neighborhoodId` | `ObjectId \| null` | Optional. |
| `extraLabel` | `string \| null` | Optional fallback label. |
| `googleMapUrl` | `string` | Required. The "Open in Google Maps" link (separate from coordinates). |
| `vip` | `boolean` | VIP tier flag. |
| **`lat`** | **`number \| null`** | **Latitude.** Nullable. **NEW validation:** when present, finite and in `[-90, 90]`. |
| **`lng`** | **`number \| null`** | **Longitude.** Nullable. **NEW validation:** when present, finite and in `[-180, 180]`. |
| `socialLinks` | `object` | Seven contact fields (x, facebook, whatsapp, linkedin, email, messenger, snapchat). |
| `createdAt` / `updatedAt` | `Date` | Timestamps. |
| `legacyId` | `string \| null` | Legacy compatibility. |

**NEW validation rule (both-or-neither — spec FR-012/FR-013):**
- `(null, null)` ⇒ **valid** (a point may legitimately have no coordinates).
- `(validLat, validLng)` ⇒ **valid**.
- `(value, null)` or `(null, value)` ⇒ **invalid** ("required together" — never one without the other).
- Either value out of its range, or non-finite ⇒ **invalid**.
- Enforced server-side in `salesPointSchema` (`lib/validators.ts`) via a Zod `superRefine` on the pair — this is what rejects a direct API bypass (SC-004). The persisted shape is unchanged.

**Precision**: BSON double (64-bit IEEE-754) stores ≥6 decimals exactly; the round-trip (write → read) must show identical values — verified in quickstart Scenario F.

---

## Transient type: `PickedLocation` (in-picker only — never persisted)

The single coordinate selection held inside `LocationPickerModal`, shared by both tabs, committed to the form only on Confirm.

```ts
type PickedLocation = { lat: number; lng: number } | null
```

**Lifecycle**:
- On open (editing a point with saved coords): initialized to those coords; map centers there with the marker pre-placed.
- On open (new point, no coords): initialized to `null`; map centers on the KSA/Riyadh default (≈ `[24.7136, 46.6753]`, zoom ≈5–6) — **never `(0,0)`**.
- Map click / marker drag / typed-in-picker value ⇒ updates `PickedLocation` (single source of truth; the editable field and marker stay two-way in sync).
- URL-parse success ⇒ overwrites `PickedLocation` (so switching to the Map tab shows the marker already placed).
- **Confirm** ⇒ writes `PickedLocation` into the form's `lat`/`lng` state via `update('lat', …)` / `update('lng', …)` and closes the modal.
- **Cancel** / **Escape** ⇒ discards `PickedLocation`; the form's pre-existing values are untouched (FR-016, edge case "Pick-then-Cancel").

---

## Transient type: `ParseResult` (parser output — `lib/google-maps-url-parser.ts`)

The result of `parseGoogleMapsUrl(url)`. Locale-free (typed reason codes only — Arabic strings live in `GoogleMapsUrlTab`).

```ts
type ParseResult =
  | { ok: true; lat: number; lng: number }            // already range-validated
  | { ok: false; reason: 'notAUrl' | 'notGoogleMaps' | 'noCoordinates' | 'outOfRange' }
```

**Reason → meaning**:
- `notAUrl` — `new URL()` failed even after a scheme-prepend attempt.
- `notGoogleMaps` — valid URL but not a recognized Google Maps host.
- `noCoordinates` — recognized Google Maps URL, but no `@lat,lng` / `!3d!4d` / numeric `q=`|`ll=` found (e.g. a place-name search link). Not an error/crash.
- `outOfRange` — numbers extracted but failed `[-90,90]`/`[-180,180]`.

Extraction priority: `!3d/!4d` (place) **beats** `@lat,lng` (viewport) when both are present (spec FR-006).

---

## Transient type: `ResolveResult` (short-link endpoint I/O — `app/api/admin/resolve-map-url/route.ts`)

The endpoint resolves a short link to its final URL; the client then re-runs `parseGoogleMapsUrl()` on it.

**Request**: `POST /api/admin/resolve-map-url` with `{"url":"https://maps.app.goo.gl/…"}` (admin session required).

**Response** (discriminated by HTTP status):

| Outcome | HTTP | Body |
|---|---|---|
| Success | 200 | `{ "resolvedUrl": "<final URL>" }` |
| Not an allowed short-link host | 400 | `{ "error": "invalid_host" }` |
| Redirect chain too long (>5 hops) | 504 | `{ "error": "too_many_redirects" }` |
| Timed out (≤5s) | 504 | `{ "error": "timeout" }` |
| Other network failure | 502 | `{ "error": "network_error" }` |
| Not admin | 401 | `{ "error": "Unauthorized" }` |

The endpoint **never returns coordinates** and **never reads the response body** — only the final redirect-chain URL (spec FR-011/§6.1). The client maps `timeout`/`too_many_redirects`/`network_error` to the "تعذّر معالجة الرابط المختصر" message, then parses `resolvedUrl`; if that parse yields `noCoordinates`, the standard "couldn't find coordinates" guidance is shown.

---

## Shared constants: `lib/coordinates.ts` (NEW — client + server)

One source of truth for coordinate rules, imported by `validators.ts` (server), `SalesPointForm` + `MapPickerTab` (client), and `google-maps-url-parser.ts`.

```ts
export const LAT_RANGE = [-90, 90] as const
export const LNG_RANGE = [-180, 180] as const
export const KSA_BBOX = { lat: [16, 33], lng: [34, 56] } as const   // non-blocking warning box
export const KSA_DEFAULT_CENTER = { lat: 24.7136, lng: 46.6753 }     // Riyadh; picker default for new points
export function isFiniteInRange(v: unknown, [min, max]: readonly number[]): boolean
export function isCoordinatePairValid(lat: number | null, lng: number | null): boolean  // both-or-neither + range
export function ksaWarning(lat: number, lng: number): string | null                  // Arabic notice or null
```

Reusing `lib/geo.ts`'s existing `LatLng` / `haversineKm` / `formatDistance` for the optional distance readout (research R8) — no duplication.

---

## Source of truth & freshness (unchanged)

`getPlaces()` (`lib/data/places.ts`) reads `sales_points` through `unstable_cache` (tag `places`). Admin writes (`POST`/`PUT`) bust the tag via `revalidateTag('places')`, so the public map/clustering picks up corrected coordinates on next read. This feature changes **how** coordinates are entered and validated, not the freshness mechanism.
