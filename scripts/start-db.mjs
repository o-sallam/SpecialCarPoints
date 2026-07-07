import { MongoMemoryServer } from 'mongodb-memory-server'
import { execSync, spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  console.log('Starting in-memory MongoDB...')
  const mongod = await MongoMemoryServer.create({
    instance: { dbName: 'special_car' },
  })
  const uri = mongod.getUri()
  console.log('MongoDB URI:', uri)

  const envPath = path.join(__dirname, '..', '.env.local')
  let envContent = fs.readFileSync(envPath, 'utf-8')
  envContent = envContent.replace(/^MONGODB_URI=.*$/m, `MONGODB_URI=${uri}`)
  fs.writeFileSync(envPath, envContent)
  console.log('Updated .env.local with local MongoDB URI')

  console.log('Seeding database...')
  execSync(`MONGODB_URI="${uri}" MONGODB_DB=special_car npx tsx scripts/seed.ts`, {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true,
  })

  console.log('Starting Next.js dev server...')
  const next = spawn('npx', ['next', 'dev'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, MONGODB_URI: uri, MONGODB_DB: 'special_car' },
  })

  process.on('SIGINT', async () => {
    next.kill()
    await mongod.stop()
    process.exit(0)
  })

  next.on('close', async () => {
    await mongod.stop()
    process.exit(0)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
