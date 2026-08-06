/*
 * lib/google-maps-url-parser.ts
 * Pure, dependency-free, framework-agnostic Google Maps URL → coordinates parser.
 * No DOM, no React, no network, no external packages (spec FR-007/§12).
 * Locale-free: returns typed reason codes; Arabic strings live in the UI tab.
 * Never throws on bad input. See specs/002-admin-coordinate-picker/research.md R1.
 */

import { isFiniteInRange, LAT_RANGE, LNG_RANGE } from '@/lib/coordinates'

export type ParseResult =
  | { ok: true; lat: number; lng: number }
  | { ok: false; reason: 'notAUrl' | 'notGoogleMaps' | 'noCoordinates' | 'outOfRange' }

/** Country/variant Google hosts: google.com, maps.google.com, google.co.*, google.com.*, … */
const GOOGLE_HOST_RE =
  /^(www\.)?(maps\.)?google\.(com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})$/

/** Recognized Google Maps hosts, incl. short-link hosts. */
export function isGoogleMapsHost(u: URL): boolean {
  const host = u.hostname.toLowerCase()
  if (host === 'goo.gl' || host === 'maps.app.goo.gl') return true
  if (!GOOGLE_HOST_RE.test(host)) return false
  // A plain google.* URL only counts when it points at /maps (or is maps.* itself).
  return host.startsWith('maps.') || u.pathname.startsWith('/maps')
}

/** True for the two supported short-link hosts (client routes these to the endpoint). */
export function isGoogleShortLink(input: string): boolean {
  const u = parseUrl(input)
  if (!u) return false
  const host = u.hostname.toLowerCase()
  return host === 'goo.gl' || host === 'maps.app.goo.gl'
}

/** Parse a pasted value as a URL; accept a missing scheme by prepending https:// once. */
function parseUrl(input: string): URL | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  try {
    return new URL(trimmed)
  } catch {
    // no scheme (e.g. "google.com/maps/…") — try once with https://
    try {
      return new URL(`https://${trimmed}`)
    } catch {
      return null
    }
  }
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

const NUMERIC_PAIR_RE = /^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/

/**
 * Extract coordinates from a Google Maps URL.
 *
 * Priority (spec FR-006):
 *   1. `!3d<lat>!4d<lng>` inside a `data=` segment (the *place*) — beats `@`.
 *   2. `@lat,lng[,zoom]` in the path (the viewport center).
 *   3. numeric `q=lat,lng` / `ll=lat,lng` query params.
 * A place-name `q=` is NOT an error ⇒ `noCoordinates`.
 */
export function parseGoogleMapsUrl(input: string): ParseResult {
  const u = parseUrl(input)
  if (!u) return { ok: false, reason: 'notAUrl' }

  if (!isGoogleMapsHost(u)) return { ok: false, reason: 'notGoogleMaps' }

  const href = safeDecode(u.href)

  // 1) data= …!3d<lat>!4d<lng>  (place — preferred over the viewport @)
  const place = href.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/)
  if (place) return rangeChecked(Number(place[1]), Number(place[2]))

  // 2) @lat,lng[,zoom]  (viewport center in the path)
  const viewport = href.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,\d+(?:\.\d+)?[zm])?/)
  if (viewport) return rangeChecked(Number(viewport[1]), Number(viewport[2]))

  // 3) numeric q=/ll= query params (place-name q= falls through to noCoordinates)
  for (const key of ['q', 'll'] as const) {
    const raw = u.searchParams.get(key)
    if (raw == null) continue
    const decoded = safeDecode(raw)
    if (NUMERIC_PAIR_RE.test(decoded)) {
      const [lat, lng] = decoded.split(',').map(Number)
      return rangeChecked(lat, lng)
    }
  }

  return { ok: false, reason: 'noCoordinates' }
}

function rangeChecked(lat: number, lng: number): ParseResult {
  if (!isFiniteInRange(lat, LAT_RANGE) || !isFiniteInRange(lng, LNG_RANGE)) {
    return { ok: false, reason: 'outOfRange' }
  }
  return { ok: true, lat, lng }
}