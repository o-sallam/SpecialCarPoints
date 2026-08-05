/*
 * lib/data/cities.ts
 * Cached read path + write helpers for the `cities` collection.
 *
 * Same conventions as lib/data/places.ts: reads go through unstable_cache
 * (tag "cities"); writes bust that tag. Only call from route handlers / server
 * code (unstable_cache needs a request context).
 */

import { unstable_cache, revalidateTag } from 'next/cache'
import { ObjectId } from 'mongodb'
import { connectToDatabase } from '@/lib/mongodb'
import type { City } from '@/lib/types'

/** All cities sorted by Arabic name. Cached under tag "cities". */
export const getCities = unstable_cache(
  async (): Promise<City[]> => {
    const { db } = await connectToDatabase()
    const docs = await db.collection('cities').find({}).sort({ name: 1 }).toArray()
    return docs as unknown as City[]
  },
  ['cities'],
  { tags: ['cities'] },
)

/** City lookup keyed by `_id.toString()` (hex string). */
export async function getCitiesById(): Promise<Map<string, City>> {
  const cities = await getCities()
  return new Map(cities.map((c) => [c._id.toString(), c]))
}

/** Create a city, then bust the "cities" cache. */
export async function createCity(input: { name: string }): Promise<City> {
  const { db } = await connectToDatabase()
  const now = new Date()
  const doc = { name: input.name.trim(), createdAt: now, updatedAt: now }
  const res = await db.collection('cities').insertOne(doc)
  revalidateTag('cities')
  return { _id: res.insertedId, ...doc }
}

/** Update a city by id. Returns the updated doc, or null if not found. */
export async function updateCity(id: string, patch: { name?: string }): Promise<City | null> {
  const { db } = await connectToDatabase()
  const set: Record<string, unknown> = { updatedAt: new Date() }
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) set[k] = v
  }
  const res = await db.collection('cities').updateOne({ _id: new ObjectId(id) }, { $set: set })
  if (res.matchedCount === 0) return null
  revalidateTag('cities')
  const doc = await db.collection('cities').findOne({ _id: new ObjectId(id) })
  return (doc ?? null) as City | null
}
