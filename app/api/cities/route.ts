import { NextResponse } from 'next/server'
import { getCities } from '@/lib/data/cities'

export async function GET() {
  try {
    const cities = await getCities()
    // Minimal shape for the admin selectors.
    return NextResponse.json(
      cities.map((c) => ({ _id: c._id.toString(), name: c.name })),
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
