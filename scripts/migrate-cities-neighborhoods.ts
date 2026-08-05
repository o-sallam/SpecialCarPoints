/*
 * scripts/migrate-cities-neighborhoods.ts
 * Additive, idempotent migration (Tasks 2-5). Creates `cities` + `neighborhoods`
 * from sales_points free-text, backfills cityId/neighborhoodId/extraLabel on
 * every sales point, and runs an integrity check. Does NOT delete or rename
 * anything (legacy fields kept; districts untouched — separate tasks).
 *
 * Parsing source = sales_points.name (falls back to _legacyName if a later
 * rename already happened, so the whole script stays re-runnable).
 *
 * Run: export MONGODB_URI=... MONGODB_DB=... && npx tsx scripts/migrate-cities-neighborhoods.ts
 */
import { MongoClient, ObjectId } from 'mongodb'

const uri = process.env.MONGODB_URI!
const dbName = process.env.MONGODB_DB || 'special_car'

/** Strip tatweel + collapse whitespace. Deliberately does NOT fold alef/hamza,
 * so canonical names keep correct spelling (أبها, not ابها). All raw variants
 * in this dataset differ only by tatweel, so this is sufficient for dedup. */
function lightlyNormalize(s: string): string {
  return s.replace(/\u0640/g, '').replace(/\s+/g, ' ').trim()
}

const CITY_PREFIXES = ['مدينة', 'محافظة', 'منطقة', 'مدنية'] // last one is a real typo in the data
const NP_VARIANTS = ['نقطة بيع', 'نقطه بيع']

interface Parsed {
  _id: ObjectId
  rawName: string
  cityName: string
  neighborhoodName: string | null
  extraLabel: string | null
  note: string | null
}

function parseDoc(doc: any): Parsed {
  const rawName: string = doc.name ?? doc._legacyName ?? ''
  let s = rawName
  for (const np of NP_VARIANTS) s = s.split(np).join(' ')
  s = s.replace(/\s+/g, ' ').trim()

  let cityPart = s
  let nbPart: string | null = null
  const idx = s.indexOf(' حي ')
  if (idx >= 0) {
    cityPart = s.slice(0, idx).trim()
    nbPart = s.slice(idx + ' حي '.length).trim()
  }

  // strip one city-class prefix (مدينة/محافظة/منطقة/مدنية) if present
  for (const p of CITY_PREFIXES) {
    if (cityPart === p) {
      cityPart = ''
      break
    }
    if (cityPart.startsWith(p + ' ')) {
      cityPart = cityPart.slice(p.length).trim()
      break
    }
  }

  let cityName = lightlyNormalize(cityPart)
  let neighborhoodName = nbPart ? lightlyNormalize(nbPart) : null
  let extraLabel: string | null = null
  let note: string | null = null

  // ---- explicit edge cases (do NOT force these into neighborhoods) ----
  if (cityName.includes('عريعرة')) {
    // الزلفي عريعرة  -> city الزلفي, extraLabel عريعرة
    cityName = 'الزلفي'
    extraLabel = 'عريعرة'
    neighborhoodName = null
    note = "edge: 'عريعرة' (الزلفي) -> extraLabel"
  } else if (cityName.includes('شارع الاصفر')) {
    // رفحاء شارع الاصفر -> city رفحاء, extraLabel شارع الاصفر (a street, not a حي)
    cityName = 'رفحاء'
    extraLabel = 'شارع الاصفر'
    neighborhoodName = null
    note = "edge: 'شارع الاصفر' (رفحاء) -> extraLabel (street, not a حي)"
  } else if (cityName.includes('الطرف') && cityName.includes('الاحساء')) {
    // مدينة الاحساء الطرف (compound city token) -> city الاحساء. The "الطرف"
    // token here is a compound-city-name artifact, not a real second location,
    // so drop it entirely (no extraLabel). Keep the parsed neighborhood (الخزمة).
    // (Final decision — see implementation plan Task 5a. 2aae's "حي الطرف" is a
    // real neighborhood and is unaffected; only this 2aaf compound drops الطرف.)
    cityName = 'الاحساء'
    note = "edge: 'الأحساء الطرف' compound -> city الاحساء only (الطرف dropped per final decision)"
  }

  // Hand-fix docs (2ab6, 1e7e) need NO special code: parsing `name` directly
  // already resolves them (name is well-formed even though location/nb aren't).

  return { _id: doc._id, rawName, cityName, neighborhoodName, extraLabel, note }
}

async function main() {
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)
  const sp = db.collection('sales_points')
  const cities = db.collection('cities')
  const neighs = db.collection('neighborhoods')

  // ---------------- Phase A: parse all docs ----------------
  const docs = await sp.find({}).sort({ _id: 1 }).toArray()
  const plan = docs.map(parseDoc)

  console.log(`\n========== PHASE A: parsed ${plan.length} sales_points ==========`)
  for (const p of plan) {
    console.log(
      `  ${String(p._id).slice(-4)} raw=${JSON.stringify(p.rawName)} -> city=${JSON.stringify(p.cityName)}` +
        ` nb=${JSON.stringify(p.neighborhoodName)} extra=${JSON.stringify(p.extraLabel)}` +
        (p.note ? `  [${p.note}]` : ''),
    )
  }

  // city count report (sanity check)
  const cityCounts = new Map<string, number>()
  for (const p of plan) cityCounts.set(p.cityName, (cityCounts.get(p.cityName) ?? 0) + 1)
  console.log(`\n--- cities (canonical name -> #points) [${cityCounts.size} distinct] ---`)
  ;[...cityCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ar')).forEach(([n, c]) => console.log(`   ${JSON.stringify(n)} -> ${c}`))

  // ---------------- Phase B: cities ----------------
  await cities.createIndex({ name: 1 }, { unique: true })
  const now = new Date()
  const cityIdByName = new Map<string, ObjectId>()
  let citiesInserted = 0
  for (const name of cityCounts.keys()) {
    const res = await cities.findOneAndUpdate(
      { name },
      { $setOnInsert: { name, createdAt: now, updatedAt: now } },
      { upsert: true, returnDocument: 'after' },
    )!
    if (res) {
      cityIdByName.set(name, res._id)
      if (res.createdAt?.toISOString?.() === now.toISOString()) citiesInserted++
    }
  }
  console.log(`\n========== PHASE B: cities upserted ==========`)
  console.log(`  distinct cities: ${cityIdByName.size} (newly inserted this run: ${citiesInserted})`)

  // ---------------- Phase C: neighborhoods ----------------
  await neighs.createIndex({ name: 1, cityId: 1 }, { unique: true })
  // collect distinct (name, cityName)
  const nbKeys = new Map<string, { name: string; cityName: string; count: number }>()
  for (const p of plan) {
    if (!p.neighborhoodName) continue
    const key = p.neighborhoodName + '\u0000' + p.cityName
    const e = nbKeys.get(key)
    if (e) e.count++
    else nbKeys.set(key, { name: p.neighborhoodName, cityName: p.cityName, count: 1 })
  }
  const neighIdByKey = new Map<string, ObjectId>()
  let neighInserted = 0
  for (const [, e] of nbKeys) {
    const cityId = cityIdByName.get(e.cityName)!
    const res = await neighs.findOneAndUpdate(
      { name: e.name, cityId },
      { $setOnInsert: { name: e.name, cityId, createdAt: now, updatedAt: now } },
      { upsert: true, returnDocument: 'after' },
    )!
    if (res) {
      neighIdByKey.set(e.name + '\u0000' + e.cityName, res._id)
      if (res.createdAt?.toISOString?.() === now.toISOString()) neighInserted++
    }
  }
  console.log(`\n========== PHASE C: neighborhoods upserted ==========`)
  console.log(`  distinct (name, city) pairs: ${nbKeys.size} (newly inserted this run: ${neighInserted})`)

  // correctness check: known cross-city collisions must each be 2 separate rows
  console.log(`  --- cross-city collision check (expect 2 rows each) ---`)
  for (const [nb, cityA, cityB] of [
    ['الربوة', 'ابها' /*normalized?*/, 'ينبع'],
    ['المنار', 'جدة', 'الدمام'],
    ['النسيم', 'جدة', 'الرياض'],
    ['طيبة', 'جدة', 'المدينة المنورة'],
  ]) {
    // raw source has tatweel-free forms already for these; check by lookup:
    const found = [...nbKeys.values()].filter((e) => e.name === nb)
    console.log(`   حي ${nb}: rows=${found.length} -> ${JSON.stringify(found)}`)
  }

  // ---------------- Phase D: backfill sales_points ----------------
  console.log(`\n========== PHASE D: backfill sales_points ==========`)
  let updated = 0
  const perCity = new Map<string, number>()
  for (const p of plan) {
    const cityId = cityIdByName.get(p.cityName)
    if (!cityId) {
      console.error(`  ERROR: no city id for ${JSON.stringify(p.cityName)} (point ${p._id})`)
      continue
    }
    let neighborhoodId: ObjectId | null = null
    if (p.neighborhoodName) {
      neighborhoodId = neighIdByKey.get(p.neighborhoodName + '\u0000' + p.cityName) ?? null
      if (!neighborhoodId) console.error(`  ERROR: no neighborhood id for ${p.neighborhoodName}/${p.cityName} (point ${p._id})`)
    }
    await sp.updateOne(
      { _id: p._id },
      { $set: { cityId, neighborhoodId, extraLabel: p.extraLabel } },
    )
    perCity.set(p.cityName, (perCity.get(p.cityName) ?? 0) + 1)
    updated++
  }
  console.log(`  backfilled: ${updated} / ${plan.length}`)

  // ---------------- Phase E: integrity check ----------------
  console.log(`\n========== PHASE E: integrity check ==========`)
  const total = await sp.countDocuments()
  const noCity = await sp.countDocuments({ cityId: { $in: [null, undefined] } })
  const withNid = await sp.countDocuments({ neighborhoodId: { $type: 'objectId' } })
  const allNeighIds = await sp.distinct('neighborhoodId', { neighborhoodId: { $type: 'objectId' } })
  const orphanNeighs: ObjectId[] = []
  for (const nid of allNeighIds) {
    const exists = await neighs.countDocuments({ _id: nid as ObjectId })
    if (!exists) orphanNeighs.push(nid as ObjectId)
  }
  const allCityIds = await sp.distinct('cityId')
  const orphanCities: ObjectId[] = []
  for (const cid of allCityIds) {
    const exists = await cities.countDocuments({ _id: cid as ObjectId })
    if (!exists) orphanCities.push(cid as ObjectId)
  }
  const extraCount = await sp.countDocuments({ extraLabel: { $type: 'string' } })
  const cityTotal = await cities.countDocuments()
  const neighTotal = await neighs.countDocuments()

  console.log(`  sales_points total:        ${total}`)
  console.log(`  with cityId:               ${total - noCity}  (missing: ${noCity})`)
  console.log(`  with neighborhoodId:       ${withNid}`)
  console.log(`  with extraLabel:           ${extraCount}`)
  console.log(`  cities docs:               ${cityTotal}`)
  console.log(`  neighborhoods docs:        ${neighTotal}`)
  console.log(`  orphan cityId refs:        ${orphanCities.length}`)
  console.log(`  orphan neighborhoodId refs:${orphanNeighs.length}`)

  let ok = true
  if (noCity !== 0) {
    console.error('  FAIL: some sales_points have no cityId')
    ok = false
  }
  if (orphanNeighs.length !== 0) {
    console.error(`  FAIL: orphan neighborhoodId refs: ${JSON.stringify(orphanNeighs)}`)
    ok = false
  }
  if (orphanCities.length !== 0) {
    console.error(`  FAIL: orphan cityId refs: ${JSON.stringify(orphanCities)}`)
    ok = false
  }
  console.log(ok ? '\nINTEGRITY CHECK: PASS' : '\nINTEGRITY CHECK: FAIL')
  await client.close()
  process.exit(ok ? 0 : 1)
}

main().catch((e) => {
  console.error('Migration failed:', e)
  process.exit(1)
})
