import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI || ''
const dbName = process.env.MONGODB_DB || 'special_car'

let client: MongoClient | null = null
let db: Db | null = null

if (process.env.NODE_ENV === 'development' && uri) {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient
    _mongoDb?: Db
  }

  if (!globalWithMongo._mongoClient) {
    client = new MongoClient(uri)
    globalWithMongo._mongoClient = client
    globalWithMongo._mongoDb = client.db(dbName)
  }
  client = globalWithMongo._mongoClient!
  db = globalWithMongo._mongoDb!
}

export async function connectToDatabase() {
  if (!uri) {
    throw new Error('Please add your Mongo URI to .env.local')
  }

  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
    db = client.db(dbName)
  }

  return { client: client!, db: db! }
}

export { db }
