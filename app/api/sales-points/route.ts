import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { revalidateTag } from 'next/cache'
import { connectToDatabase } from '@/lib/mongodb'
import { getPlaces } from '@/lib/data/places'
import { getDistrictsById } from '@/lib/data/districts'
import { getSession } from '@/lib/session'
import { salesPointSchema } from '@/lib/validators'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const vip = searchParams.get('vip')

    // Read via the cached path (tag "places"); the dataset is small so the
    // q/vip filters are applied in memory, preserving the original semantics
    // (case-insensitive substring on name/location/neighborhood, vip flag).
    const points = await getPlaces()

    const filtered = points.filter((p) => {
      if (vip === 'true' && !p.vip) return false
      if (q) {
        const needle = q.toLowerCase()
        const haystack = [p.name, p.location, p.neighborhood].filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      return true
    })

    return NextResponse.json(filtered)
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

    const districtsById = await getDistrictsById()
    if (!districtsById.has(data.districtId)) {
      return NextResponse.json({ error: 'Invalid districtId' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const now = new Date()
    const doc = {
      ...data,
      districtId: new ObjectId(data.districtId),
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
    revalidateTag('places')
    return NextResponse.json({ ...doc, _id: result.insertedId }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
