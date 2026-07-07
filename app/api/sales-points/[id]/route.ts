import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { connectToDatabase } from '@/lib/mongodb'
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

    return NextResponse.json(doc)
  } catch (error) {
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
    const data = salesPointSchema.parse(body)

    const { db } = await connectToDatabase()
    const { id } = params

    const update = {
      $set: {
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

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
