'use client'

import dynamic from 'next/dynamic'
import { useState, useRef, useCallback } from 'react'
import SalesPointCard from '@/components/public/SalesPointCard'

const MapView = dynamic(() => import('@/components/public/MapView'), { ssr: false })

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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
    if (window.innerWidth < 1024 && mapRef.current) {
      mapRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

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
        <label
          className={`relative flex items-center gap-3 px-4 py-2.5 rounded-full cursor-pointer select-none transition-all duration-300 border ${
            vipOnly
              ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30'
              : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-text-secondary)]/30'
          }`}
        >
          <input
            type="checkbox"
            checked={vipOnly}
            onChange={(e) => setVipOnly(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`relative w-10 h-6 rounded-full transition-colors duration-300 border ${
              vipOnly
                ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                : 'bg-transparent border-[var(--color-text-secondary)]/40'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                vipOnly ? 'translate-x-[18px]' : 'translate-x-0.5'
              }`}
            />
          </div>
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <svg
              className={`w-4 h-4 transition-colors duration-300 ${
                vipOnly ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className={vipOnly ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}>
              VIP فقط
            </span>
          </span>
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
              <SalesPointCard key={point._id} point={point} isSelected={selectedId === point._id} onSelect={handleSelect} />
            ))
          )}
        </div>
        <div ref={mapRef} className="sticky top-20 h-[calc(100vh-6rem)] min-h-[400px] rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)]">
          <MapView points={filtered} selectedId={selectedId} onSelect={handleSelect} />
        </div>
      </div>
    </div>
  )
}
