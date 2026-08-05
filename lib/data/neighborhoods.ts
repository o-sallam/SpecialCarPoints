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
  { tags: ['neighborhoods'] },
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
