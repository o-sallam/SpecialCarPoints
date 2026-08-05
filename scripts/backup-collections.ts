/*
 * scripts/backup-collections.ts
 * One-off READ-ONLY backup. Dumps `districts` and `sales_points` in full to
 * timestamped JSON files under backups/. Run before any destructive migration.
 *
 * Serialization: ObjectId -> hex string, Date -> ISO string. Every other field
 * is preserved verbatim. Sufficient as a human-readable rollback reference and
 * re-importable by a trivial restore script.
 *
 * Run: export MONGODB_URI=... MONGODB_DB=... && npx tsx scripts/backup-collections.ts
 */
import { MongoClient, ObjectId } from 'mongodb'
import fs from 'fs'
import path from 'path'

const uri = process.env.MONGODB_URI!
const dbName = process.env.MONGODB_DB || 'special_car'

function serialize(value: unknown): unknown {
  if (value instanceof ObjectId) return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(serialize)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = serialize(v)
    return out
  }
  return value
}

async function main() {
  const stamp = new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
  const dir = path.join(process.cwd(), 'backups', `${stamp}-pre-normalization`)
  fs.mkdirSync(dir, { recursive: true })

  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)

  const targets = ['districts', 'sales_points'] as const
  const summary: string[] = []
  for (const name of targets) {
    const docs = await db.collection(name).find({}).sort({ _id: 1 }).toArray()
    const serialized = serialize(docs)
    const file = path.join(dir, `${name}.json`)
    fs.writeFileSync(file, JSON.stringify(serialized, null, 2), 'utf-8')
    const stat = fs.statSync(file)
    summary.push(`${name}: ${docs.length} docs -> ${file} (${stat.size} bytes)`)
  }

  console.log(`Backup directory: ${dir}`)
  summary.forEach((s) => console.log(`  ${s}`))

  // Verify non-empty (Task 1 requirement).
  let ok = true
  for (const name of targets) {
    const file = path.join(dir, `${name}.json`)
    const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'))
    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.error(`VERIFY FAIL: ${file} is empty or not an array`)
      ok = false
    }
  }
  console.log(ok ? 'VERIFY OK: both files non-empty.' : 'VERIFY FAILED.')
  await client.close()
  process.exit(ok ? 0 : 1)
}

main().catch((e) => {
  console.error('Backup failed:', e)
  process.exit(1)
})
