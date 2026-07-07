import { MongoClient, Db } from 'mongodb'
import { ensureSeeded } from './seed-data'

const uri = process.env.MONGODB_URI || ''
const dbName = process.env.MONGODB_DB || 'special_car'

let initPromise: Promise<{ client: MongoClient; db: Db }> | null = null

function getGlobal() {
  return globalThis as typeof globalThis & {
    __mongoClient?: MongoClient
    __mongoDb?: Db
  }
}

async function startMongod() {
  const { MongoMemoryServer } = await import('mongodb-memory-server')
  const mongod = await MongoMemoryServer.create({
    instance: { dbName },
  })
  const u = mongod.getUri()
  console.log('In-memory MongoDB URI:', u)
  return u
}

export async function connectToDatabase() {
  const g = getGlobal()
  if (g.__mongoClient && g.__mongoDb) {
    return { client: g.__mongoClient, db: g.__mongoDb }
  }

  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    let resolvedUri = uri
    if (!resolvedUri) {
      resolvedUri = await startMongod()
    }

    const c = new MongoClient(resolvedUri)
    await c.connect()
    const d = c.db(dbName)

    await ensureSeeded(d)

    g.__mongoClient = c
    g.__mongoDb = d

    return { client: c, db: d }
  })()

  return initPromise
}
