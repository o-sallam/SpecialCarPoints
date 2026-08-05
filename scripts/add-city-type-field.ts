/*
 * scripts/add-city-type-field.ts
 * Additive, idempotent migration: add `type` to every city in the `cities`
 * collection so composeDisplayName can render the correct city class
 * (مدينة | محافظة | منطقة) instead of embedding it in legacy free-text.
 *
 * MUST run BEFORE the legacy name/location field cleanup, or the
 * type distinction for الليث (منطقة) and عـفيف (محافظة) is lost.
 *
 * Run:  npx tsx scripts/add-city-type-field.ts
 * (reads MONGODB_URI / MONGODB_DB from the env, falling back to .env.local)
 */
import { MongoClient } from 'mongodb'
import fs from 'fs'

// ---- env resolution (mirrors how seed.ts connects so one command works) ----
let uri = process.env.MONGODB_URI || ''
let dbName = process.env.MONGODB_DB || 'special_car'
if (!uri && fs.existsSync('.env.local')) {
  const env = fs.readFileSync('.env.local', 'utf8')
  const m = env.match(/^MONGODB_URI=(.*)$/m)
  if (m) uri = m[1].trim()
}
if (!uri) {
  console.error('MONGODB_URI not set (and no .env.local found). Aborting.')
  process.exit(1)
}

/** Strip tatweel so we match عفيف regardless of tatweel spelling. */
const stripTatweel = (s: string) => s.replace(/\u0640/g, '').trim()

/** name -> (canonical city name matching db, type) exception map */
const typeExceptions = [
  { name: 'الليث', type: 'منطقة' },
  { name: 'عفيف', type: 'محافظة' }, // matched by stripTatweel; covers عـفيف
]

async function main() {
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)
  const cities = db.collection('cities')

  console.log('Adding type field to cities collection...')

  // -- type exceptions (منطقة / محافظة) --
  for (const { name, type: t } of typeExceptions) {
    const raw = await cities
      .find({ type: { $exists: false } })
      .toArray()
    // match on tatweel-normalized name
    const matches = raw.filter((c) => stripTatweel(c.name) === name)
    let matched = 0
    for (const c of matches) {
      await cities.updateOne(
        { _id: c._id },
        { $set: { type: t, updatedAt: new Date() } },
      )
      matched++
    }
    console.log(`  ${name} -> type: ${t}  (${matched} city)`)
  }

  // (re-check) any city still missing a type -> default مدينة
  const remaining = await cities.find({ type: { $exists: false } }).toArray()
  for (const c of remaining) {
    await cities.updateOne({ _id: c._id }, { $set: { type: 'مدينة', updatedAt: new Date() } })
  }
  console.log(`Defaulted ${remaining.length} cities to type: مدينة`)

  // ---------- Verification ----------
  const counts = await cities
    .aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }, { $sort: { _id: 1 } }])
    .toArray()
  console.log('\nFinal type distribution:')
  counts.forEach(({ _id, count }) => console.log(`  ${_id}: ${count}`))

  const stillMissing = await cities.countDocuments({ type: { $exists: false } })
  if (stillMissing > 0) {
    console.warn(`⚠️  WARNING: ${stillMissing} cities still missing type field!`)
  } else {
    console.log('\n✅ All cities now have a type field')
  }

  // spot-check the exception cities
  const named = await cities
    .find({ name: { $in: ['الليث', 'عفيف'] } })
    .map((c) => `${c.name}=${c.type}`)
    .toArray()
  if (named.length) console.log('Spot-check:', named.join(' | '))

  await client.close()
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})