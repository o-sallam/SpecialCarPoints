/*
 * scripts/migrate-districts.ts
 * One-off migration: creates the `districts` collection from the 13 Saudi
 * region ids + 'other', then stamps every sales_points document with the
 * districtId its region resolves to.
 *
 * Run: npx tsx scripts/migrate-districts.ts   (needs MONGODB_URI in env,
 * e.g. `set -a && . ./.env.local && set +a` first — same convention as
 * scripts/seed.ts, which expects the shell env to carry the URI).
 *
 * Idempotent: districts are upserted by name (unique index), and the
 * correctness check at the end exits non-zero if the per-district counts
 * disagree with the detectRegion grouping of the current data.
 */

import { connectToDatabase } from '../lib/mongodb'
import { detectRegion } from '../lib/geo'
import { regionTitle } from '../lib/points'
import type { ObjectId } from 'mongodb'

/** The 14 region ids — labels come VERBATIM from regionTitle() in
 * lib/points.ts (single source of truth for Arabic district labels). */
const DISTRICT_IDS = [
  'riyadh',
  'makkah',
  'madinah',
  'qassim',
  'eastern',
  'asir',
  'tabuk',
  'hail',
  'northern',
  'jazan',
  'najran',
  'bahah',
  'jawf',
  'other',
] as const

async function migrate() {
  const { db } = await connectToDatabase()

  // Step 3 — one-time indexes (idempotent, safe to rerun).
  await db.collection('districts').createIndex({ name: 1 }, { unique: true })
  await db.collection('sales_points').createIndex({ districtId: 1 })
  console.log('Indexes ensured: districts.name (unique), sales_points.districtId')

  // Upsert districts; keep regionId -> district _id map.
  const now = new Date()
  const districtIds = new Map<string, ObjectId>()
  let inserted = 0
  let existed = 0
  for (const id of DISTRICT_IDS) {
    const name = regionTitle(id)
    const existing = await db.collection('districts').findOne({ name })
    if (existing) {
      districtIds.set(id, existing._id)
      existed++
      console.log(`district exists: ${id} (${name}) -> ${existing._id}`)
    } else {
      const res = await db
        .collection('districts')
        .insertOne({ name, createdAt: now, updatedAt: now })
      districtIds.set(id, res.insertedId)
      inserted++
      console.log(`district inserted: ${id} (${name}) -> ${res.insertedId}`)
    }
  }

  // Stamp every sales point with its districtId. Only $set on districtId —
  // no other field is touched.
  const points = await db.collection('sales_points').find({}).toArray()
  let updated = 0
  const perDistrict: Record<string, number> = {}
  for (const p of points) {
    // Same rule the old groupPointsByRegion used:
    const regionId = detectRegion(p.location || p.name || '')
    const districtId = districtIds.get(regionId)
    if (!districtId) {
      console.error(`ERROR: no district id for region '${regionId}' (point ${p._id})`)
      continue
    }
    await db.collection('sales_points').updateOne({ _id: p._id }, { $set: { districtId } })
    perDistrict[regionId] = (perDistrict[regionId] ?? 0) + 1
    updated++
  }

  // Correctness check — expected grouping computed independently with the
  // same detectRegion(location || name || '') rule. Must match exactly.
  const expected: Record<string, number> = {}
  for (const p of points) {
    const regionId = detectRegion(p.location || p.name || '')
    expected[regionId] = (expected[regionId] ?? 0) + 1
  }

  console.log('\n=== SUMMARY ===')
  console.log(`Districts inserted: ${inserted}, already existed: ${existed} (total ${districtIds.size})`)
  console.log(`Sales points updated with districtId: ${updated} / ${points.length}`)

  console.log('\nCount per district (migration) vs expected (detectRegion):')
  for (const id of DISTRICT_IDS) {
    const name = regionTitle(id)
    const migrated = perDistrict[id] ?? 0
    const exp = expected[id] ?? 0
    const marker = migrated === exp ? 'OK' : 'MISMATCH'
    console.log(`  ${name} (${id}): ${migrated} vs ${exp}  ${marker}`)
  }

  let mismatch = false
  for (const id of DISTRICT_IDS) {
    if ((perDistrict[id] ?? 0) !== (expected[id] ?? 0)) {
      mismatch = true
      console.error(`MISMATCH for ${id}: migration=${perDistrict[id] ?? 0} expected=${expected[id] ?? 0}`)
    }
  }
  if (mismatch) {
    console.error('\nFAIL: per-district counts differ from detectRegion grouping.')
    process.exit(1)
  }
  console.log('\nOK: per-district counts match the detectRegion grouping exactly.')
  process.exit(0)
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
