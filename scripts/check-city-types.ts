import { MongoClient } from 'mongodb'
import fs from 'fs'

let uri = process.env.MONGODB_URI || ''
let dbName = process.env.MONGODB_DB || 'special_car'
if (!uri && fs.existsSync('.env.local')) {
  const env = fs.readFileSync('.env.local', 'utf8')
  const m = env.match(/^MONGODB_URI=(.*)$/m)
  if (m) uri = m[1].trim()
}

async function main() {
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)
  
  const sample = await db.collection('cities').findOne({})
  console.log('Sample city:', JSON.stringify(sample, null, 2))
  
  const withType = await db.collection('cities').countDocuments({ type: { $exists: true } })
  const total = await db.collection('cities').countDocuments({})
  console.log(`\nCities with type field: ${withType}/${total}`)
  
  if (withType > 0) {
    const counts = await db.collection('cities').aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray()
    console.log('\nType distribution:')
    counts.forEach(({ _id, count }) => console.log(`  ${_id}: ${count}`))
    
    // Check specific exception cities
    const exceptions = await db.collection('cities')
      .find({ name: { $in: ['الليث', 'عفيف', 'عـفيف'] } }, { projection: { name: 1, type: 1 } })
      .toArray()
    
    if (exceptions.length > 0) {
      console.log('\nException cities:')
      exceptions.forEach(c => console.log(`  ${c.name}: ${c.type}`))
    }
  }
  
  await client.close()
}

main().catch(console.error)
