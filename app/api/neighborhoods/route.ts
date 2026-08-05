import { NextRequest, NextResponse } from 'next/server'
import { getNeighborhoods } from '@/lib/data/neighborhoods'

export async function GET(request: NextRequest) {
  try {
    const cityId = new URL(request.url).searchParams.get('cityId')
    const neighborhoods = await getNeighborhoods()
    const list = neighborhoods.map((n) => ({
      _id: n._id.toString(),
      name: n.name,
      cityId: n.cityId.toString(),
    }))
    // Optional filter by city (used by the cascading neighborhood selector).
    const filtered = cityId ? list.filter((n) => n.cityId === cityId) : list
    return NextResponse.json(filtered)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
