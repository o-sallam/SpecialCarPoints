import type { Metadata } from 'next'
import { Cairo, Tajawal } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
})

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['500', '700', '800'],
  variable: '--font-tajawal',
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
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`} suppressHydrationWarning>
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
