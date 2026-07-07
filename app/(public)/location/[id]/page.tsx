import { notFound } from 'next/navigation'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import dynamic from 'next/dynamic'
import VipBadge from '@/components/public/VipBadge'
import SocialIcons from '@/components/public/SocialIcons'

const DetailMap = dynamic(() => import('./DetailMap'), { ssr: false })

export const revalidate = 60

export async function generateStaticParams() {
  if (!process.env.MONGODB_URI) return []

  try {
    const { db } = await connectToDatabase()
    const points = await db
      .collection('sales_points')
      .find({}, { projection: { _id: 1 } })
      .toArray()

    return points.map((p) => ({ id: p._id.toString() }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  if (!process.env.MONGODB_URI) return { title: 'Special Car' }

  try {
    const { db } = await connectToDatabase()
    const { id } = params

    let doc
    if (ObjectId.isValid(id)) {
      doc = await db.collection('sales_points').findOne({ _id: new ObjectId(id) })
    } else {
      doc = await db.collection('sales_points').findOne({ legacyId: id })
    }

    if (!doc) return { title: 'غير موجود - Special Car' }

    return {
      title: `${doc.name} - Special Car`,
      description: `${doc.location}${doc.neighborhood ? ` - ${doc.neighborhood}` : ''} | نقطة بيع Special Car`,
    }
  } catch {
    return { title: 'Special Car' }
  }
}

export default async function LocationDetailPage({ params }: { params: { id: string } }) {
  const { db } = await connectToDatabase()
  const { id } = params

  let doc
  if (ObjectId.isValid(id)) {
    doc = await db.collection('sales_points').findOne({ _id: new ObjectId(id) })
  } else {
    doc = await db.collection('sales_points').findOne({ legacyId: id })
  }

  if (!doc) {
    notFound()
  }

  const point = {
    _id: doc._id.toString(),
    name: doc.name,
    location: doc.location,
    neighborhood: doc.neighborhood || null,
    vip: doc.vip,
    googleMapUrl: doc.googleMapUrl,
    lat: doc.lat ?? null,
    lng: doc.lng ?? null,
    socialLinks: doc.socialLinks || {},
  }

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-[var(--color-text)]">{point.name}</h1>
            <VipBadge vip={point.vip} />
          </div>

          <div className="space-y-2 mb-6">
            <p className="text-[var(--color-text-secondary)]">{point.location}</p>
            {point.neighborhood && (
              <p className="text-[var(--color-text-secondary)]">{point.neighborhood}</p>
            )}
          </div>

          {point.lat && point.lng && (
            <div className="mb-6 rounded-[var(--radius-md)] overflow-hidden h-[300px]">
              <DetailMap lat={point.lat} lng={point.lng} name={point.name} />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={point.googleMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              فتح في خرائط Google
            </a>

            <SocialIcons links={point.socialLinks} />
          </div>
        </div>
      </div>
    </div>
  )
}
