import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { revalidateTag } from 'next/cache'
import { connectToDatabase } from '@/lib/mongodb'
import { getPlaces } from '@/lib/data/places'
import { getCitiesById } from '@/lib/data/cities'
import { getNeighborhoodsById } from '@/lib/data/neighborhoods'
import { getSession } from '@/lib/session'
import { salesPointSchema } from '@/lib/validators'
import { composeDisplayName } from '@/lib/points'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const vip = searchParams.get('vip')

    const [points, citiesById, neighborhoodsById] = await Promise.all([
      getPlaces(),
      getCitiesById(),
      getNeighborhoodsById(),
    ])

    // Resolve each doc to a display shape: city/neighborhood joined and a
    // composed displayName. Legacy free-text (name/location/neighborhood) is
    // intentionally NOT returned — the display name is derived, never stored.
    const resolved = points.map((p: any) => {
      const city = p.cityId ? citiesById.get(String(p.cityId)) : null
      const cityName = city?.name || 'مدن أخرى'
      const cityType = city?.type || 'مدينة'
      const neighborhoodName = p.neighborhoodId
        ? neighborhoodsById.get(String(p.neighborhoodId))?.name ?? null
        : null
      const extraLabel = p.extraLabel ?? null
      return {
        _id: p._id.toString(),
        cityId: p.cityId?.toString() ?? '',
        cityName,
        cityType,
        neighborhoodId: p.neighborhoodId ? String(p.neighborhoodId) : null,
        neighborhoodName,
        extraLabel,
        displayName: composeDisplayName(cityName, cityType, neighborhoodName, extraLabel),
        vip: p.vip,
        active: p.active !== false,
        googleMapUrl: p.googleMapUrl,
        lat: p.lat ?? null,
        lng: p.lng ?? null,
      }
    })

    const filtered = resolved.filter((p) => {
      if (vip === 'true' && !p.vip) return false
      if (q) {
        const needle = q.toLowerCase()
        const haystack = [p.displayName, p.cityName, p.neighborhoodName, p.extraLabel]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      return true
    })

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

    const body = await request.json()
    // coerce empty-string optionals to null before validation
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
    const now = new Date()
    const doc = {
      cityId: new ObjectId(data.cityId),
      neighborhoodId: data.neighborhoodId ? new ObjectId(data.neighborhoodId) : null,
      extraLabel: data.extraLabel ?? null,
      googleMapUrl: data.googleMapUrl,
      vip: data.vip,
      active: data.active,
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
      legacyId: null,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection('sales_points').insertOne(doc)
    revalidateTag('places')
    return NextResponse.json({ ...doc, _id: result.insertedId }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
