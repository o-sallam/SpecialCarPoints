'use client'

import { useState } from 'react'
import SalesPointCard from '@/components/public/SalesPointCard'

interface Point {
  _id: string
  name: string
  location: string
  neighborhood: string | null
  vip: boolean
  googleMapUrl: string
  lat: number | null
  lng: number | null
}

export default function SalesPointsInteractive({ points }: { points: Point[] }) {
  const [query, setQuery] = useState('')
  const [vipOnly, setVipOnly] = useState(false)

  const filtered = points.filter((p) => {
    if (vipOnly && !p.vip) return false
    if (query) {
      const q = query.toLowerCase()
      if (
        !p.name.toLowerCase().includes(q) &&
        !p.location.toLowerCase().includes(q) &&
        !(p.neighborhood && p.neighborhood.toLowerCase().includes(q))
      ) return false
    }
    return true
  })

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">نقاط البيع</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن مدينة أو حي..."
          className="flex-1 px-5 py-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={vipOnly}
            onChange={(e) => setVipOnly(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
          />
          <span className="text-sm text-[var(--color-text)]">VIP فقط</span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {filtered.length} من {points.length} نقطة بيع
          </p>
          {filtered.length === 0 ? (
            <p className="text-center text-[var(--color-text-secondary)] py-12">
              لا توجد نقاط بيع تطابق بحثك
            </p>
          ) : (
            filtered.map((point) => (
              <SalesPointCard key={point._id} point={point} />
            ))
          )}
        </div>
        <div className="sticky top-20 h-[calc(100vh-6rem)] rounded-[var(--radius-lg)] overflow-hidden bg-[var(--color-surface)] flex items-center justify-center border border-[var(--color-border)]">
          <p className="text-[var(--color-text-secondary)] text-sm">خريطة تفاعلية</p>
        </div>
      </div>
    </div>
  )
}
