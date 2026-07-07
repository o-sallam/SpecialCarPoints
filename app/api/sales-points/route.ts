import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { getSession } from '@/lib/session'
import { salesPointSchema } from '@/lib/validators'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const vip = searchParams.get('vip')

    const filter: Record<string, unknown> = {}

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { location: { $regex: escaped, $options: 'i' } },
        { neighborhood: { $regex: escaped, $options: 'i' } },
      ]
    }

    if (vip === 'true') {
      filter.vip = true
    }

    const points = await db
      .collection('sales_points')
      .find(filter)
      .sort({ name: 1 })
      .toArray()

    return NextResponse.json(points)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = salesPointSchema.parse(body)

    const { db } = await connectToDatabase()
    const now = new Date()
    const doc = {
      ...data,
      socialLinks: {
        x: data.socialLinks.x || '',
        facebook: data.socialLinks.facebook || '',
        whatsapp: data.socialLinks.whatsapp || '',
        linkedin: data.socialLinks.linkedin || '',
        email: data.socialLinks.email || '',
        messenger: data.socialLinks.messenger || '',
        snapchat: data.socialLinks.snapchat || '',
      },
      legacyId: null,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection('sales_points').insertOne(doc)
    return NextResponse.json({ ...doc, _id: result.insertedId }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
