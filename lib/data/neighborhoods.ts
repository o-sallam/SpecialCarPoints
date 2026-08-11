/*
 * lib/data/neighborhoods.ts
 * Cached read path for the `neighborhoods` collection. Neighborhoods are
 * unique per (name, cityId) — the same name can recur across cities.
 */

import { unstable_cache, revalidateTag } from 'next/cache'
import { ObjectId } from 'mongodb'
import { connectToDatabase } from '@/lib/mongodb'
import type { Neighborhood } from '@/lib/types'

/** All neighborhoods sorted by name. Cached under tag "neighborhoods". */
export const getNeighborhoods = unstable_cache(
  async (): Promise<Neighborhood[]> => {
    const { db } = await connectToDatabase()
    const docs = await db.collection('neighborhoods').find({}).sort({ name: 1 }).toArray()
    return docs as unknown as Neighborhood[]
  },
  ['neighborhoods'],
  { tags: ['neighborhoods'], revalidate: 60 },
)

/** Neighborhood lookup keyed by `_id.toString()` (hex string). */
export async function getNeighborhoodsById(): Promise<Map<string, Neighborhood>> {
  const all = await getNeighborhoods()
  return new Map(all.map((n) => [n._id.toString(), n]))
}

/** Create a neighborhood within a city, then bust the cache. */
export async function createNeighborhood(input: {
  name: string
  cityId: string
}): Promise<Neighborhood> {
  const { db } = await connectToDatabase()
  const now = new Date()
  const doc = {
    name: input.name.trim(),
    cityId: new ObjectId(input.cityId),
    createdAt: now,
    updatedAt: now,
  }
  const res = await db.collection('neighborhoods').insertOne(doc)
  revalidateTag('neighborhoods')
  return { _id: res.insertedId, ...doc }
}

/** Update a neighborhood by id. Returns the updated doc, or null if not found. */
export async function updateNeighborhood(
  id: string,
  patch: { name?: string; cityId?: string },
): Promise<Neighborhood | null> {
  const { db } = await connectToDatabase()
  const set: Record<string, unknown> = { updatedAt: new Date() }
  if (patch.name !== undefined) set.name = patch.name.trim()
  if (patch.cityId !== undefined) set.cityId = new ObjectId(patch.cityId)
  const res = await db.collection('neighborhoods').updateOne(
    { _id: new ObjectId(id) },
    { $set: set },
  )
  if (res.matchedCount === 0) return null
  revalidateTag('neighborhoods')
  const doc = await db.collection('neighborhoods').findOne({ _id: new ObjectId(id) })
  return (doc ?? null) as Neighborhood | null
}

/** Delete a neighborhood by id. Returns true if a document was deleted. Caller
 *  MUST guard against sales_points still referencing it first. */
export async function deleteNeighborhood(id: string): Promise<boolean> {
  const { db } = await connectToDatabase()
  const res = await db.collection('neighborhoods').deleteOne({ _id: new ObjectId(id) })
  if (res.deletedCount > 0) revalidateTag('neighborhoods')
  return res.deletedCount > 0
}
