import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCities, createCity } from '@/lib/data/cities'
import { getSession } from '@/lib/session'
import { citySchema } from '@/lib/validators'

export async function GET() {
  try {
    const cities = await getCities()
    // Full shape (incl. `type`) — the admin selectors only read _id/name, so
    // the extra field is harmless to them.
    return NextResponse.json(
      cities.map((c) => ({ _id: c._id.toString(), name: c.name, type: c.type })),
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = citySchema.parse(await request.json())
    const city = await createCity({ name: data.name, type: data.type })
    return NextResponse.json(
      { _id: city._id.toString(), name: city.name, type: city.type },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
