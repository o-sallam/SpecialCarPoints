/*
 * scripts/backfill-coords.ts  (Task 5b Step 3)
 * Additive, idempotent coordinate backfill from map-coords-results.json.
 *
 * Policy (per implementation plan — conservative default):
 *   - resolved is the known Google default/bogus coord     -> skip, log as bogus
 *   - sales_point.lat/lng currently null  & resolved good  -> WRITE (additive)
 *   - sales_point already has lat/lng, matches resolved     -> skip (match)
 *   - sales_point already has lat/lng, differs >0.001 deg   -> DO NOT overwrite,
 *                                                              log to discrepancies
 *
 * Never overwrites existing coordinates. Safe to re-run.
 *
 * Run: export MONGODB_URI=... MONGODB_DB=... && npx tsx scripts/backfill-coords.ts
 */
import { MongoClient } from 'mongodb'
import fs from 'fs'

const uri = process.env.MONGODB_URI!
const dbName = process.env.MONGODB_DB || 'special_car'
const resultsFile = './map-coords-results.json'
const discrepanciesFile = './coord-discrepancies.json'

const BOGUS = { lat: 31.1240367, lng: 33.8296832 } // Google default returned by broken short links
const isBogus = (lat: number, lng: number) =>
  Math.abs(lat - BOGUS.lat) < 1e-4 && Math.abs(lng - BOGUS.lng) < 1e-4
const far = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
  Math.abs(a.lat - b.lat) > 0.001 || Math.abs(a.lng - b.lng) > 0.001

async function main() {
  const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8')) as Array<{
    id: string
    lat: number | null
    lng: number | null
    finalUrl: string | null
    error: string | null
  }>

  const client = new MongoClient(uri)
  await client.connect()
  const sp = client.db(dbName).collection('sales_points')

  const stats = {
    total: results.length,
    noJoin: 0,
    bogus: 0,
    written: 0,
    matched: 0,
    discrepancies: 0,
  }
  const bogus: any[] = []
  const discrepancies: any[] = []

  for (const r of results) {
    const doc = await sp.findOne({ legacyId: String(r.id) })
    if (!doc) {
      stats.noJoin++
      continue
    }
    const resolved = r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng } : null

    if (!resolved || isBogus(resolved.lat, resolved.lng)) {
      stats.bogus++
      bogus.push({ legacyId: r.id, _id: String(doc._id), name: doc.name ?? doc._legacyName, dbLat: doc.lat ?? null, dbLng: doc.lng ?? null, resolved, finalUrl: r.finalUrl, note: 'resolved missing or Google-default bogus' })
      continue
    }

    const dbHas = doc.lat != null && doc.lng != null
    if (!dbHas) {
      await sp.updateOne({ _id: doc._id }, { $set: { lat: resolved.lat, lng: resolved.lng } })
      stats.written++
    } else {
      const db = { lat: doc.lat as number, lng: doc.lng as number }
      if (far(db, resolved)) {
        stats.discrepancies++
        discrepancies.push({ legacyId: r.id, _id: String(doc._id), name: doc.name ?? doc._legacyName, db, resolved, finalUrl: r.finalUrl, deltaLat: +(resolved.lat - db.lat).toFixed(6), deltaLng: +(resolved.lng - db.lng).toFixed(6) })
      } else {
        stats.matched++
      }
    }
  }

  fs.writeFileSync(
    discrepanciesFile,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        summary: stats,
        note:
          'Existing DB lat/lng are systemically misaligned vs freshly resolved coords (resolved appear geographically correct). ' +
          'Per conservative policy these were NOT overwritten. Review and re-run an overwrite pass if confirmed.',
        bogus,
        discrepancies,
      },
      null,
      2,
    ),
  )

  console.log('=== Task 5b Step 3 complete ===')
  console.log(JSON.stringify(stats, null, 2))
  console.log(`discrepancies + bogus written to ${discrepanciesFile} (${bogus.length} bogus, ${discrepancies.length} discrepancies)`)
  await client.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
