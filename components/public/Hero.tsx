'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Hero() {
  const router = useRouter()
  const [count, setCount] = useState<number | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch('/api/sales-points')
      .then((r) => r.json())
      .then((data) => setCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setCount(0))
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/sales-points?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <section className="container py-16 md:py-24 text-center">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold text-[var(--color-text)] mb-4">
          Special Car
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] mb-8">
          اعثر على أقرب نقطة بيع لمنتجات Special Car في جميع أنحاء المملكة العربية السعودية
        </p>

        <form onSubmit={handleSearch} className="relative max-w-md mx-auto mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن مدينة أو حي..."
            className="w-full px-5 py-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </form>

        {count !== null && (
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-primary)] text-white text-sm font-medium">
            <span className="text-xl font-bold">{count}</span>
            <span>نقطة بيع في جميع أنحاء المملكة</span>
          </div>
        )}

        <div className="mt-8">
          <a
            href="/sales-points"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[var(--color-primary)] text-white font-medium hover:opacity-90 transition-opacity"
          >
            عرض جميع نقاط البيع
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
