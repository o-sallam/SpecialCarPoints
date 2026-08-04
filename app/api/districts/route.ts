import { NextRequest, NextResponse } from 'next/server'
import { getDistricts, createDistrict } from '@/lib/data/districts'
import { getSession } from '@/lib/session'
import { districtSchema } from '@/lib/validators'
import { z } from 'zod'

export async function GET() {
  try {
    const districts = await getDistricts()
    return NextResponse.json(districts)
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
    const data = districtSchema.parse(body)

    const district = await createDistrict(data)
    return NextResponse.json(district, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
