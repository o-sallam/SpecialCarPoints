import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://specialcarsa.com'

  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
  ]

  if (process.env.MONGODB_URI) {
    try {
      const { connectToDatabase } = await import('@/lib/mongodb')
      const { db } = await connectToDatabase()
      const points = await db
        .collection('sales_points')
        .find({}, { projection: { _id: 1 } })
        .toArray()

      points.forEach((p) => {
        entries.push({
          url: `${siteUrl}/location/${p._id.toString()}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        })
      })
    } catch {
      // skip DB-dependent sitemap entries during build
    }
  }

  return entries
}
