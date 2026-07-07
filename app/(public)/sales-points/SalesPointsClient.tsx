'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import SalesPointCard from '@/components/public/SalesPointCard'
import SearchBar from '@/components/public/SearchBar'

const MapView = dynamic(() => import('@/components/public/MapView'), { ssr: false })

interface SalesPoint {
  _id: string
  name: string
  location: string
  neighborhood: string | null
  vip: boolean
  googleMapUrl: string
  lat: number | null
  lng: number | null
}

interface Props {
  initialPoints: SalesPoint[]
}

export default function SalesPointsClient({ initialPoints }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [vipOnly, setVipOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '')
  }, [searchParams])

  const filtered = useMemo(() => {
    let result = initialPoints

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          (p.neighborhood && p.neighborhood.toLowerCase().includes(q))
      )
    }

    if (vipOnly) {
      result = result.filter((p) => p.vip)
    }

    return result
  }, [initialPoints, searchQuery, vipOnly])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    router.replace(`/sales-points?${params.toString()}`, { scroll: false })
  }, [router])

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id))
    const el = document.getElementById(`card-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">نقاط البيع</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchBar onSearch={handleSearch} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
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
          {filtered.length === 0 ? (
            <p className="text-center text-[var(--color-text-secondary)] py-12">
              لا توجد نقاط بيع تطابق بحثك
            </p>
          ) : (
            filtered.map((point) => (
              <SalesPointCard
                key={point._id}
                point={point}
                isSelected={selectedId === point._id}
                onSelect={handleSelect}
              />
            ))
          )}
        </div>
        <div className="sticky top-20 h-[calc(100vh-6rem)] rounded-[var(--radius-lg)] overflow-hidden">
          <MapView
            points={filtered}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </div>
      </div>
    </div>
  )
}
