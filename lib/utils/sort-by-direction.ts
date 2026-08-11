/*
 * lib/utils/sort-by-direction.ts
 * Geographic (bearing-based) ordering for the locator's list surfaces.
 *
 * Replaces the earlier name-keyword approach (matching شرق/شمال/غرب/جنوب in
 * the card text) — names don't reliably carry those words, so ordering is
 * driven by each item's ACTUAL lat/lng position relative to a reference
 * center instead:
 *
 *   Level 1 — the top-level accordion (regions/cities): bearing from the
 *             collection center to each region's center.
 *   Level 2 — the points inside an expanded region: bearing from that
 *             region's center to each point's lat/lng.
 *
 * Reference centers are computed as centroids. There is no stored center in
 * the DB today (City/Neighborhood carry no lat/lng) — if one is ever added,
 * pass it in and skip recomputing (see regionCenter below).
 *
 * Buckets are 90° arcs centered on each cardinal direction (0° = north),
 * giving the fixed order: شرق (east) → شمال (north) → غرب (west) → جنوب
 * (south). All sorts here are STABLE (comparator returns 0 for equal ranks):
 * same-bucket items and items without coordinates keep their current
 * relative order. Items missing lat/lng fall back to the end, never crash.
 */

import type { POSEntry, Region } from '@/lib/points'
import type { LatLng } from '@/lib/geo'

/** Standard great-circle initial bearing from (lat1,lon1) to (lat2,lon2), normalized 0–360°. */
export function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const toDeg = (rad: number) => (rad * 180) / Math.PI
  const φ1 = toRad(lat1)
  const φ2 = toRad(lat2)
  const Δλ = toRad(lon2 - lon1)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  const θ = Math.atan2(y, x)
  return (toDeg(θ) + 360) % 360
}

export type DirectionBucket = 'east' | 'north' | 'west' | 'south'

/** 90° arcs centered on each cardinal direction (0° = north). */
export function getDirectionBucket(bearing: number): DirectionBucket {
  if (bearing >= 315 || bearing < 45) return 'north'
  if (bearing >= 45 && bearing < 135) return 'east'
  if (bearing >= 135 && bearing < 225) return 'south'
  return 'west' // 225–315
}

/** Fixed priority: east → north → west → south. */
export const DIRECTION_PRIORITY: Record<DirectionBucket, number> = {
  east: 1,
  north: 2,
  west: 3,
  south: 4,
}

/** Missing-coordinate rank: sorts to the end while keeping the sort stable. */
const NO_COORD_RANK = Number.MAX_SAFE_INTEGER

function isValid(lat: unknown, lng: unknown): boolean {
  return typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)
}

/** Arithmetical mean of coordinates (null entries skipped); null when no valid pairs exist. */
export function centroidOf(points: Array<LatLng | null>): LatLng | null {
  const valid = points.filter((p): p is LatLng => p != null && isValid(p.lat, p.lng))
  if (valid.length === 0) return null
  const lat = valid.reduce((s, p) => s + p.lat, 0) / valid.length
  const lng = valid.reduce((s, p) => s + p.lng, 0) / valid.length
  return { lat, lng }
}

/** A point-entry's coordinates, or null when absent. */
export function entryCoord(entry: POSEntry): LatLng | null {
  const { lat, lng } = entry
  return lat != null && lng != null && isValid(lat, lng) ? { lat, lng } : null
}

/**
 * A region's reference center. Stored-center hook: if a region ever gains a
 * stored center coordinate, return it here instead of recomputing. Today no
 * such field exists (City/Neighborhood have no lat/lng), so we use the
 * centroid of the region's located entries; null when none have coordinates.
 */
export function regionCenter(region: Region): LatLng | null {
  return centroidOf(region.entries.map(entryCoord))
}

/** Reference for the top-level list: centroid of the regions' centers (no
 *  country/city-level center is stored). Null when nothing has coordinates. */
export function collectionCenter(regions: Region[]): LatLng | null {
  return centroidOf(
    regions.map(regionCenter).filter((c): c is LatLng => c != null),
  )
}

/**
 * Stable sort of `items` into the fixed direction buckets relative to
 * `reference`, using each item's own coordinates (via `coord`). Items without
 * coordinates sort to the end in their current relative order.
 */
export function sortByBearingFrom<T>(
  reference: LatLng,
  items: T[],
  coord: (item: T) => LatLng | null,
): T[] {
  const ranked = items.map((item) => {
    const c = coord(item)
    const rank = c
      ? DIRECTION_PRIORITY[getDirectionBucket(getBearing(reference.lat, reference.lng, c.lat, c.lng))]
      : NO_COORD_RANK
    return { item, rank }
  })
  // Stable: equal ranks return 0, so buckets keep their current relative order.
  return ranked.sort((a, b) => a.rank - b.rank).map((x) => x.item)
}

/** Level-2 sort: points inside a region, by bearing from the region center. */
export function sortEntries(entries: POSEntry[], reference: LatLng): POSEntry[] {
  return sortByBearingFrom(reference, entries, entryCoord)
}

/** Level-1 sort: regions of the top-level accordion, by bearing from the
 *  collection center (each region measured at its own center). */
export function sortRegions(regions: Region[], reference: LatLng): Region[] {
  return sortByBearingFrom(reference, regions, regionCenter)
}