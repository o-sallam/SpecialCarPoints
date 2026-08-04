/*
 * lib/data/districts.ts
 * Cached read path + write helpers for the `districts` collection.
 *
 * Follows the same conventions as lib/mongodb.ts / lib/validators.ts:
 * plain async functions, no abstraction layers. Reads go through
 * unstable_cache (tag "districts"); every write busts that tag so the
 * next read re-fetches. Only called from route handlers / server code —
 * unstable_cache requires a request context (never call at module load).
 */

import { unstable_cache, revalidateTag } from 'next/cache'
import { ObjectId } from 'mongodb'
import { connectToDatabase } from '@/lib/mongodb'
import type { District } from '@/lib/types'

/**
 * All districts sorted by Arabic name. Cached under tag "districts".
 * Note: unstable_cache serializes the result, so `_id`/`createdAt`/
 * `updatedAt` arrive as JSON strings, not ObjectId/Date — safe to use
 * `.toString()` on either representation.
 */
export const getDistricts = unstable_cache(
  async (): Promise<District[]> => {
    const { db } = await connectToDatabase()
    const docs = await db
      .collection('districts')
      .find({})
      .sort({ name: 1 })
      .toArray()
    return docs as unknown as District[]
  },
  ['districts'],
  { tags: ['districts'] }
)

/** District lookup keyed by `_id.toString()` (hex string). */
export async function getDistrictsById(): Promise<Map<string, District>> {
  const districts = await getDistricts()
  return new Map(districts.map((d) => [d._id.toString(), d]))
}

/** Create a district, then bust the "districts" cache. */
export async function createDistrict(input: { name: string }): Promise<District> {
  const { db } = await connectToDatabase()
  const now = new Date()
  const doc = {
    name: input.name.trim(),
    createdAt: now,
    updatedAt: now,
  }
  const res = await db.collection('districts').insertOne(doc)
  revalidateTag('districts')
  return { _id: res.insertedId, ...doc }
}

/** Update a district by id. Returns the updated doc, or null if not found. */
export async function updateDistrict(id: string, patch: { name?: string }): Promise<District | null> {
  const { db } = await connectToDatabase()
  const set: Record<string, unknown> = { updatedAt: new Date() }
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) set[k] = v
  }
  const res = await db.collection('districts').updateOne({ _id: new ObjectId(id) }, { $set: set })
  if (res.matchedCount === 0) return null
  revalidateTag('districts')
  const doc = await db.collection('districts').findOne({ _id: new ObjectId(id) })
  return (doc ?? null) as District | null
}

/**
 * Delete a district by id. Refuses while any sales point still references
 * it — throws with a count so the route can return a useful 400 instead of
 * silently orphaning `districtId` references.
 */
export async function deleteDistrict(id: string): Promise<boolean> {
  const { db } = await connectToDatabase()
  const oid = new ObjectId(id)
  const refs = await db.collection('sales_points').countDocuments({ districtId: oid })
  if (refs > 0) {
    throw new Error(`Cannot delete: ${refs} sales points still reference this district.`)
  }
  const res = await db.collection('districts').deleteOne({ _id: oid })
  if (res.deletedCount === 0) return false
  revalidateTag('districts')
  return true
}
