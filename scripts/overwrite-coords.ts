/*
 * scripts/overwrite-coords.ts  (Decision A — coordinate correction pass)
 *
 * OVERWRITES sales_points.lat/lng with the geographically-correct values
 * resolved by resolve-map-coords.js. This is the intentional overwrite of the
 * 18 systemically-misaligned coordinates (resolved values verified correct;
 * existing DB values were shifted/wrong from an earlier extraction).
 *
 * Skips the 6 bogus resolves (broken short links -> Google default) — those
 * stay null. Idempotent: a second run changes nothing (DB already == resolved).
 *
 * Run: export MONGODB_URI=... MONGODB_DB=... && npx tsx scripts/overwrite-coords.ts
 */
import { MongoClient } from 'mongodb'
import fs from 'fs'

const uri = process.env.MONGODB_URI!
const dbName = process.env.MONGODB_DB || 'special_car'
const resultsFile = './map-coords-results.json'

const BOGUS = { lat: 31.1240367, lng: 33.8296832 }
const isBogus = (lat: number, lng: number) =>
  Math.abs(lat - BOGUS.lat) < 1e-4 && Math.abs(lng - BOGUS.lng) < 1e-4

async function main() {
  const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8')) as Array<{
    id: string
    lat: number | null
    lng: number | null
  }>

  const client = new MongoClient(uri)
  await client.connect()
  const sp = client.db(dbName).collection('sales_points')

  let corrected = 0
  let alreadyCorrect = 0
  let skippedBogus = 0
  let noJoin = 0
  const changed: { legacyId: string; from: string; to: string }[] = []

  for (const r of results) {
    const doc = await sp.findOne({ legacyId: String(r.id) })
    if (!doc) {
      noJoin++
      continue
    }
    if (r.lat == null || r.lng == null || isBogus(r.lat, r.lng)) {
      skippedBogus++
      continue
    }
    const prev =
      doc.lat != null && doc.lng != null ? `${doc.lat},${doc.lng}` : 'null'
    const next = `${r.lat},${r.lng}`
    // overwrite unconditionally (resolved is authoritative for non-bogus)
    await sp.updateOne({ _id: doc._id }, { $set: { lat: r.lat, lng: r.lng } })
    if (prev === next) {
      alreadyCorrect++
    } else {
      corrected++
      changed.push({ legacyId: r.id, from: prev, to: next })
    }
  }

  console.log('=== Decision A: coordinate overwrite complete ===')
  console.log(`  corrected (DB was wrong -> resolved): ${corrected}`)
  console.log(`  already correct (no change):         ${alreadyCorrect}`)
  console.log(`  skipped bogus (broken links):        ${skippedBogus}`)
  console.log(`  no join:                              ${noJoin}`)
  if (corrected) {
    console.log('  --- corrections applied ---')
    for (const c of changed) console.log(`    ${c.legacyId}: ${c.from}  ->  ${c.to}`)
  }
  await client.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
