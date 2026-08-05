import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { revalidateTag } from 'next/cache'
import { connectToDatabase } from '@/lib/mongodb'
import { getCitiesById } from '@/lib/data/cities'
import { getNeighborhoodsById } from '@/lib/data/neighborhoods'
import { getSession } from '@/lib/session'
import { salesPointSchema } from '@/lib/validators'
import { z } from 'zod'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { id } = params

    let doc
    if (ObjectId.isValid(id)) {
      doc = await db.collection('sales_points').findOne({ _id: new ObjectId(id) })
    } else {
      doc = await db.collection('sales_points').findOne({ legacyId: id })
    }

    if (!doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Return the raw doc so the edit form can populate cityId/neighborhoodId/
    // extraLabel directly. (ObjectId/Date serialize to hex/ISO via toJSON.)
    return NextResponse.json(doc)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    if (body && Object.hasOwn(body, 'neighborhoodId') && body.neighborhoodId === '') {
      body.neighborhoodId = null
    }
    if (body && Object.hasOwn(body, 'extraLabel') && body.extraLabel === '') {
      body.extraLabel = null
    }
    const data = salesPointSchema.parse(body)

    const [citiesById, neighborhoodsById] = await Promise.all([
      getCitiesById(),
      getNeighborhoodsById(),
    ])
    if (!citiesById.has(data.cityId)) {
      return NextResponse.json({ error: 'Invalid cityId' }, { status: 400 })
    }
    if (data.neighborhoodId) {
      const nb = neighborhoodsById.get(data.neighborhoodId)
      if (!nb || String(nb.cityId) !== data.cityId) {
        return NextResponse.json(
          { error: 'Invalid neighborhoodId for this city' },
          { status: 400 },
        )
      }
    }

    const { db } = await connectToDatabase()
    const { id } = params

    const update = {
      $set: {
        cityId: new ObjectId(data.cityId),
        neighborhoodId: data.neighborhoodId ? new ObjectId(data.neighborhoodId) : null,
        extraLabel: data.extraLabel ?? null,
        googleMapUrl: data.googleMapUrl,
        vip: data.vip,
        lat: data.lat,
        lng: data.lng,
        socialLinks: {
          x: data.socialLinks.x || '',
          facebook: data.socialLinks.facebook || '',
          whatsapp: data.socialLinks.whatsapp || '',
          linkedin: data.socialLinks.linkedin || '',
          email: data.socialLinks.email || '',
          messenger: data.socialLinks.messenger || '',
          snapchat: data.socialLinks.snapchat || '',
        },
        updatedAt: new Date(),
      },
    }

    let result
    if (ObjectId.isValid(id)) {
      result = await db.collection('sales_points').updateOne({ _id: new ObjectId(id) }, update)
    } else {
      result = await db.collection('sales_points').updateOne({ legacyId: id }, update)
    }

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    revalidateTag('places')
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const { id } = params

    let result
    if (ObjectId.isValid(id)) {
      result = await db.collection('sales_points').deleteOne({ _id: new ObjectId(id) })
    } else {
      result = await db.collection('sales_points').deleteOne({ legacyId: id })
    }

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    revalidateTag('places')
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
