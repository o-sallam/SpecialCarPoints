import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { getSession } from '@/lib/session'
import { settingsSchema } from '@/lib/validators'
import { z } from 'zod'

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const settings = await db.collection('settings').findOne({ _id: 'main' as unknown as import('mongodb').ObjectId })
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = settingsSchema.parse(body)

    const { db } = await connectToDatabase()
    await db.collection('settings').updateOne(
      { _id: 'main' as unknown as import('mongodb').ObjectId },
      { $set: data },
      { upsert: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
