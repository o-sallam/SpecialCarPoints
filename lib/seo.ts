export function generateMetadata({
  title,
  description,
  path,
}: {
  title: string
  description: string
  path: string
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://specialcarsa.com'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}${path}`,
      siteName: 'Special Car',
      locale: 'ar_SA',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${siteUrl}${path}`,
    },
  }
}
