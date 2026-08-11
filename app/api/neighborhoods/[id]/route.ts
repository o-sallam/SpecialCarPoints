import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/mongodb'
import { getCitiesById } from '@/lib/data/cities'
import { updateNeighborhood, deleteNeighborhood } from '@/lib/data/neighborhoods'
import { getSession } from '@/lib/session'
import { neighborhoodSchema } from '@/lib/validators'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const { db } = await connectToDatabase()
    const doc = await db.collection('neighborhoods').findOne({ _id: new ObjectId(id) })
    if (!doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({
      _id: doc._id.toString(),
      name: doc.name,
      cityId: doc.cityId.toString(),
    })
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

    const { id } = params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const data = neighborhoodSchema.parse(await request.json())
    const citiesById = await getCitiesById()
    if (!citiesById.has(data.cityId)) {
      return NextResponse.json({ error: 'Invalid cityId' }, { status: 400 })
    }

    const updated = await updateNeighborhood(id, { name: data.name, cityId: data.cityId })
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // FK safety — block if any sales point still references this neighborhood.
    const { db } = await connectToDatabase()
    const pointCount = await db
      .collection('sales_points')
      .countDocuments({ neighborhoodId: new ObjectId(id) })
    if (pointCount > 0) {
      return NextResponse.json(
        { error: `لا يمكن حذف الحي: مستخدم في ${pointCount} نقطة بيع` },
        { status: 409 },
      )
    }

    const ok = await deleteNeighborhood(id)
    if (!ok) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
