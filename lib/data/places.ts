/*
 * lib/data/places.ts
 * Cached read path + write helper wrapper for the `sales_points` collection.
 *
 * Reads go through unstable_cache (tag "places"); the existing POST/PUT/DELETE
 * route handlers keep writing directly via db.collection and bust this tag so
 * the cached list refreshes. Only call from route handlers / server code.
 */

import { unstable_cache } from 'next/cache'
import type { Document } from 'mongodb'
import { connectToDatabase } from '@/lib/mongodb'

/** All sales points sorted by name, cached under tag "places". */
export const getPlaces = unstable_cache(
  async (): Promise<Document[]> => {
    const { db } = await connectToDatabase()
    const docs = await db
      .collection('sales_points')
      .find({})
      .sort({ name: 1 })
      .toArray()
    return docs as unknown as Document[]
  },
  ['places'],
  { tags: ['places'] }
)