import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getNeighborhoods, createNeighborhood } from '@/lib/data/neighborhoods'
import { getCitiesById } from '@/lib/data/cities'
import { getSession } from '@/lib/session'
import { neighborhoodSchema } from '@/lib/validators'

export async function GET(request: NextRequest) {
  try {
    const cityId = new URL(request.url).searchParams.get('cityId')
    const [neighborhoods, citiesById] = await Promise.all([
      getNeighborhoods(),
      getCitiesById(),
    ])
    // Join the parent city name so the admin list can show it in one request.
    const list = neighborhoods.map((n) => {
      const city = citiesById.get(String(n.cityId))
      return {
        _id: n._id.toString(),
        name: n.name,
        cityId: n.cityId.toString(),
        cityName: city?.name ?? '—',
      }
    })
    // Optional filter by city (kept for the cascading selector).
    const filtered = cityId ? list.filter((n) => n.cityId === cityId) : list
    return NextResponse.json(filtered)
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

    const data = neighborhoodSchema.parse(await request.json())
    const citiesById = await getCitiesById()
    if (!citiesById.has(data.cityId)) {
      return NextResponse.json({ error: 'Invalid cityId' }, { status: 400 })
    }

    const nb = await createNeighborhood({ name: data.name, cityId: data.cityId })
    return NextResponse.json(
      { _id: nb._id.toString(), name: nb.name, cityId: nb.cityId.toString() },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
