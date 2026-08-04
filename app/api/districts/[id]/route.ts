import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { updateDistrict, deleteDistrict } from '@/lib/data/districts'
import { getSession } from '@/lib/session'
import { districtSchema } from '@/lib/validators'
import { z } from 'zod'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid district id' }, { status: 400 })
    }

    const body = await request.json()
    const data = districtSchema.partial().parse(body)

    const district = await updateDistrict(id, data)
    if (!district) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(district)
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

    const { id } = params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid district id' }, { status: 400 })
    }

    const deleted = await deleteDistrict(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    // deleteDistrict throws when sales points still reference the district —
    // surface that message as a 400 so the client sees the real reason.
    if (error instanceof Error && error.message.startsWith('Cannot delete:')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
