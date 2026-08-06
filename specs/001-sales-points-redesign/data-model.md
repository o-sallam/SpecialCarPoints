# Data Model: Sales Points Directory — UI/UX Redesign

**Key point: NO schema or API changes.** This feature is presentational/interactional. The entities below are the **existing** shapes the redesigned UI consumes; they are documented here so implementers know exactly which fields are available (especially for clustering). All live in `lib/points.ts` and are normalized in `app/(public)/page.tsx`.

---

## Entity: `POSEntry` (existing — unchanged)

A single sales point, normalized for the UI. Source: `lib/points.ts`.

| Field | Type | Notes |
|---|---|---|
| `_id` | `string` | Stable React key / marker id. |
| `cityId` | `string` | Grouping key (city ObjectId hex). |
| `cityName` | `string` | Region/accordion label. |
| `cityType` | `string` | `مدينة` \| `محافظة` \| `منطقة` (UI composition). |
| `neighborhoodId` | `string \| null` | Optional. |
| `neighborhoodName` | `string \| null` | Optional; used in display name + popup. |
| `extraLabel` | `string \| null` | Optional fallback label. |
| `displayName` | `string` | **Generated (UI-only, never stored)** by `composeDisplayName()`, e.g. "نقطة بيع مدينة الرياض حي السويدي". |
| `vip` | `boolean` | **VIP tier flag** — drives filter + card accent + marker star. |
| `googleMapUrl` | `string` | "Open in Google Maps" link in marker popup. |
| `lat` | `number \| null` | **Latitude** — required for map/clustering; points with null lat/lng are filtered out of the map. |
| `lng` | `number \| null` | **Longitude** — same. |
| `whatsapp?` | `string` | Contact (per-point; empty when absent). |
| `email?` | `string` | Contact. |
| `phone?` | `string` | Contact (not stored yet per current mapping). |

**Validation rules relevant to the UI**:
- Map/clustering only includes points where `lat != null && lng != null`.
- VIP filtering: `filterByCategory(entries, 'vip')` keeps `e.vip === true`; `'standard'` keeps `!e.vip`; `'all'` returns all.

---

## Entity: `Region` (existing — unchanged)

A group of entries sharing one city. Source: `groupByCity()` in `lib/points.ts`.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | `cityId` hex — stable React key. |
| `label` | `string` | `cityName` — accordion header. |
| `entries` | `POSEntry[]` | Points in this city. |

**Derivation**: buckets by `cityId`, drops empties, sorts by entry-count desc then city name (`ar` locale). When geolocation is active, `AccordionLocator` additionally sorts regions (and entries within) by nearest distance — this proximity-sort is preserved by the redesign (see clarification Q1).

---

## Entity: `MapCluster` (transient — derived, not stored)

A zoom-dependent grouping of nearby points, rendered as a single count-bearing marker by the clustering library.

| Attribute | Notes |
|---|---|
| `count` | Number of points in the cluster (shown on the badge; also the a11y label). |
| `bounds` | LatLng bounds of member markers (used when clicking the cluster to fit-bounds). |
| `members` | Underlying `POSEntry`/markers; splits into smaller clusters / individuals as zoom increases. |

**Lifecycle**: created/destroyed purely by the clustering engine as the user zooms; at `maxZoom` every marker is individual. No persistence.

---

## Supporting enums / config (existing — unchanged)

- `CategoryId = 'all' | 'vip' | 'standard'` with `CATEGORY_META` labels/colors (`الكل` / `VIP` / `عادي`).
- `composeDisplayName()`, `filterByCategory()`, `groupByCity()`, `toWhatsAppLink()`, `isCallablePhone()` helpers — all reused as-is.

---

## Source of truth & freshness

`getPlaces()` (`lib/data/places.ts`) reads the `sales_points` MongoDB collection through `unstable_cache` (tag `places`, `revalidate: 60`). Admin writes bust the tag via `revalidateTag('places')`. The home page (`app/(public)/page.tsx`) is a server component that joins places + cities + neighborhoods and passes `POSEntry[]` as props to `AccordionLocator` — **all clustering/map data is available client-side with no new fetch**.
