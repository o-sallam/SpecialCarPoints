import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

// PingAR LT — self-hosted Arabic typeface (Light 300 / Regular 400 / Bold 700).
// Served through next/font hashed media with font-display: swap; the single
// --font-pingar variable feeds both --font-body and --font-heading so the
// whole app (incl. Leaflet popups/cluster badges) picks it up automatically.
const pingarlt = localFont({
  src: [
    { path: '../fonts/PingARLT-Light.otf', weight: '300', style: 'normal' },
    { path: '../fonts/PingARLT-Regular.otf', weight: '400', style: 'normal' },
    { path: '../fonts/PingARLT-Bold.otf', weight: '700', style: 'normal' },
  ],
  variable: '--font-pingar',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://special-car-points.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Special Car — نقاط البيع',
    template: '%s | Special Car',
  },
  description:
    'اعثر على أقرب نقطة بيع Special Car في المملكة العربية السعودية — تصفّح حسب المنطقة أو على الخريطة، وحدّد موقعك لترتيب الأقرب إليك.',
  icons: {
    icon: '/special-car-logo.avif',
    shortcut: '/special-car-logo.avif',
  },
  openGraph: {
    title: 'Special Car — نقاط البيع',
    description:
      'اعثر على أقرب نقطة بيع Special Car في المملكة العربية السعودية.',
    siteName: 'Special Car',
    type: 'website',
    locale: 'ar_SA',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={pingarlt.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body style={{ fontFamily: 'var(--font-body)' }}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
