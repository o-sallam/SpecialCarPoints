# Quickstart — Validation Guide: Admin Coordinate Management

A **manual** validation runbook (the project has no automated test infra, and the spec defers adding one — no new framework is introduced). Run this after each user-story checkpoint and once fully at the end. Each step lists what to do and the expected outcome. Reference: [contracts](./contracts/api-and-component-contracts.md), [data-model](./data-model.md), [research](./research.md).

## Prerequisites

- Node ≥18, deps installed (`npm install`).
- MongoDB reachable locally **or** the app running against its configured instance; seed if empty (`npm run seed`).
- An admin account you can log in with at `/admin/login`.
- Run the dev server: `npm run dev` → `http://localhost:3000/admin/sales-points`.
- For the short-link and server-validation scenarios, also have `curl` (or Postman) and the admin session cookie handy.

> Grab **fresh, live Google Maps links** for Scenario B/C at test time (Google's URL format has changed over the years and may again) — at minimum one of each: an `@lat,lng` URL, a `place/…/data=…!3d…!4d…` URL, a `?q=lat,lng` URL, and one real `maps.app.goo.gl/…` short link.

---

## Scenario A — Map location picker (US1)

1. **New point default center**: go to `/admin/sales-points/new`. Click **اختر من الخريطة**. Expected: the map opens centered on **Riyadh / KSA** at a wide zoom (~5–6), **never** on `(0,0)` (check the readout isn't `0, 0`).
2. **Edit point centers on saved coords**: open an existing point that has coordinates. Click **اختر من الخريطة**. Expected: the map centers on its saved lat/lng at a close zoom (~14–15) with the marker **already placed**.
3. **Click to place**: click anywhere. Expected: a **single** marker appears there; clicking elsewhere **moves** it (never adds a second).
4. **Drag to fine-tune**: drag the marker. Expected: the editable coordinate field beside the map updates **live** to 6 decimals.
5. **Editable field (two-way)**: type a precise latitude/longitude into the in-picker field. Expected: the marker moves to the typed value; typing an out-of-range value is **rejected** (field shows an inline error, marker stays put) per FR-012.
6. **Confirm**: click **تأكيد الموقع**. Expected: the modal closes and the form's lat/lng fields now show the picked values.
7. **Cancel is a no-op** (critical): reopen the picker, move the marker, then click **إلغاء** (or press `Escape`). Expected: the modal closes and the form's lat/lng values are **unchanged** from before opening.

## Scenario B — Paste a full Google Maps URL (US2)

> Verify in the browser **Network** tab that these make **zero** requests (pure client-side parsing).

1. **`@lat,lng` path**: in the **رابط جوجل ماب** tab, paste `https://www.google.com/maps/@24.7136,46.6753,15z`, click **استخراج الإحداثيات**. Expected: green success indicator + resolved coords populate; switching to the **الخريطة** tab shows the marker already placed (shared state).
2. **`data=` `!3d/!4d` priority**: paste a `place/…/data=…!3d<lat>!4d<lng>…` URL that **also** has an `@lat,lng`. Expected: the `!3d`/`!4d` (place) pair is used, **not** the `@` viewport value.
3. **`q=lat,lng`**: paste `https://www.google.com/maps?q=24.7136,46.6753`. Expected: coords parsed.
4. **Place-name `q=` (no crash)**: paste `https://www.google.com/maps?q=Riyadh+Tower`. Expected: the **specific** "تعذّر العثور على إحداثيات…" message — **not** an error/crash, and the form's existing lat/lng are **not** cleared.

## Scenario C — Short links end-to-end (US3)

1. **Real short link resolves**: paste a real `https://maps.app.goo.gl/…` link, click extract. Expected: an inline **spinner** appears (it's a network call, not instant), then the resolved coords populate via the same parser.
2. **Non-Google host rejected server-side (SSRF guard)**: with the admin cookie, call the endpoint directly with a non-allowed host and confirm it is refused — see Scenario F.2. Also confirm from the UI that pasting e.g. `https://example.com/…` yields the "هذا الرابط لا يبدو رابط خرائط جوجل" message.
3. **Resolved-but-no-coordinates**: if you have a short link whose destination is a place search with no coords, expect the standard "تعذّر العثور على إحداثيات…" message (resolution succeeded; parsing the result failed).

## Scenario D — Every distinct error message (US4 / §5.2)

Trigger each and confirm a **distinct** Arabic message (none collapsed into a generic "invalid link", no crash, no partial lat-without-lng write):

| Trigger | Expected message |
|---|---|
| Empty input + extract | "الرجاء لصق رابط من خرائط جوجل" |
| Not a URL (e.g. `hello world`) | "الرابط الذي تم لصقه غير صالح" |
| Valid URL, not Google (e.g. `https://example.com`) | "هذا الرابط لا يبدو رابط خرائط جوجل" |
| Google URL, no coords (place-name `q=`) | "تعذّر العثور على إحداثيات في هذا الرابط، جرّب نسخ الرابط من شريط العنوان…" |
| Out-of-range numbers crafted in a Google-shaped URL | standard out-of-range message |
| Short-link network/timeout failure (simulate by throttling/blocking) | "تعذّر معالجة الرابط المختصر، حاول مرة أخرى" |

## Scenario E — Accessibility & code-split

1. **Keyboard-only**: tab to **اختر من الخريطة** and open it with Enter. Tab through: both tab triggers, the map/inputs, and the Confirm/Cancel buttons are reachable in order. The dialog is **focus-trapped** (focus loops inside). `Escape` cancels and closes.
2. **Map keyboard nav stays on**: focus the map, use arrow keys to pan and `+`/`-` to zoom (Leaflet's built-in handler — must **not** be disabled).
3. **`aria-live` extract status**: with a screen reader (or inspecting the DOM), confirm the extract loading→done transition is announced via the `aria-live="polite"` region; inline errors are associated to the input via `aria-describedby`.
4. **Non-map fallback**: without ever opening the picker, tab to the lat/lng fields on the form, type values, and save — the fields are labeled and reachable independent of the map.
5. **Code-split**: on `/admin/sales-points/new`, inspect the **Network** tab — Leaflet JS/CSS must **not** load until **اختر من الخريطة** is clicked (FR-021/SC-006).

## Scenario F — Server-side validation & SSRF (direct API, bypassing the UI)

Requires the admin session cookie (log in, copy `special-car-session` from devtools). Replace `$COOKIE` and an existing `$ID`.

**F.1 — Server rejects invalid lat/lng (proves validation isn't client-only):**
```bash
# Half-filled pair (lat without lng) — must be 400:
curl -i -X PUT http://localhost:3000/api/sales-points/$ID \
  -H "Content-Type: application/json" \
  -b "special-car-session=$COOKIE" \
  -d '{"cityId":"<validCityId>","googleMapUrl":"https://maps.example","vip":false,"lat":24.71,"lng":null,"socialLinks":{"x":"","facebook":"","whatsapp":"","linkedin":"","email":"","messenger":"","snapchat":""}}'
# Expected: HTTP 400 with ZodError details.

# Out-of-range latitude — must be 400:
curl -i -X PUT http://localhost:3000/api/sales-points/$ID \
  -H "Content-Type: application/json" -b "special-car-session=$COOKIE" \
  -d '{…same shape…,"lat":95,"lng":46.6753,…}'
# Expected: HTTP 400.

# Both null — must SUCCEED (a point may legitimately have no coordinates):
curl -i -X PUT http://localhost:3000/api/sales-points/$ID \
  -H "Content-Type: application/json" -b "special-car-session=$COOKIE" \
  -d '{…same shape…,"lat":null,"lng":null,…}'
# Expected: HTTP 200.
```

**F.2 — Precision round-trip (no truncation) + SSRF host allowlist:**
```bash
# Precision: write 6 decimals, read them back unchanged.
curl -s http://localhost:3000/api/sales-points/$ID -b "special-car-session=$COOKIE" \
  | grep -o '"lat":[0-9.]*'   # after a valid PUT with lat=24.713551 — expect 24.713551, not 24.71.

# SSRF guard: non-allowed host must be rejected, never fetched.
curl -i -X POST http://localhost:3000/api/admin/resolve-map-url \
  -H "Content-Type: application/json" -b "special-car-session=$COOKIE" \
  -d '{"url":"https://example.com/maps"}'        # Expected: 400 invalid_host
curl -i -X POST http://localhost:3000/api/admin/resolve-map-url \
  -H "Content-Type: application/json" -b "special-car-session=$COOKIE" \
  -d '{"url":"https://maps.app.goo.gl/xxxx"}'    # Expected: 200 resolvedUrl (or 504/502 on real failure)

# Unauthenticated — must be 401:
curl -i -X POST http://localhost:3000/api/admin/resolve-map-url \
  -H "Content-Type: application/json" -d '{"url":"https://maps.app.goo.gl/xxxx"}'   # Expected: 401
```

**F.3 — Success path (full/long URL needs no network):** confirm via the browser Network tab that parsing a `@lat,lng` or `data=` URL issues **zero** requests (only short links hit the endpoint).

---

## Cross-cutting checks (run at every checkpoint)

- **Both themes**: render the picker in light and dark — tiles swap (CARTO dark vs OSM light) and all text/controls meet WCAG AA contrast (the admin has no toggle, so toggle via the public site or `localStorage['theme']` + reload).
- **RTL**: tab order, the editable coordinate field, and the Confirm/Cancel bar read correctly under `dir="rtl"`.
- **KSA warning (non-blocking)**: enter a coordinate far outside KSA (e.g. `lat 2, lng 30`) — expect the "هذا الموقع يبدو خارج المملكة العربية السعودية…" warning to appear **without** blocking save (FR-014).
- **Console**: no errors/warnings (especially no Leaflet SSR warnings; map is `ssr:false`).
- **No scope creep**: `package.json` gains **zero** dependencies — no map provider, no URL-parsing package, no HTTP client (FR-020/SC-006).
- **Regression**: save a point with **manually typed** coordinates (never opening the picker) — works exactly as before (SC-007).
