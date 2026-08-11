import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/mongodb'
import { updateCity, deleteCity } from '@/lib/data/cities'
import { getSession } from '@/lib/session'
import { citySchema } from '@/lib/validators'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const { db } = await connectToDatabase()
    const doc = await db.collection('cities').findOne({ _id: new ObjectId(id) })
    if (!doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({
      _id: doc._id.toString(),
      name: doc.name,
      type: doc.type ?? 'مدينة',
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

    const data = citySchema.parse(await request.json())
    const updated = await updateCity(id, { name: data.name, type: data.type })
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

    // FK safety — never allow silent orphaning. A city may be referenced by
    // sales_points (directly) and/or neighborhoods (parent of). Block with a
    // clear message if anything still points at it.
    const { db } = await connectToDatabase()
    const oid = new ObjectId(id)
    const [pointCount, neighborhoodCount] = await Promise.all([
      db.collection('sales_points').countDocuments({ cityId: oid }),
      db.collection('neighborhoods').countDocuments({ cityId: oid }),
    ])
    if (pointCount > 0 || neighborhoodCount > 0) {
      const parts: string[] = []
      if (pointCount > 0) parts.push(`${pointCount} نقطة بيع`)
      if (neighborhoodCount > 0) parts.push(`${neighborhoodCount} حي`)
      return NextResponse.json(
        { error: `لا يمكن حذف المنطقة: مستخدمة في ${parts.join(' و ')}` },
        { status: 409 },
      )
    }

    const ok = await deleteCity(id)
    if (!ok) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
