'use client'

import VipBadge from './VipBadge'
import RegionIcon from './RegionIcon'
import type { RegionId } from '@/lib/geo'
import { formatDistance } from '@/lib/geo'

export interface PointLike {
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
  point: PointLike
  region: Exclude<RegionId, 'all'>
  /** Distance in km from the user's location, when geolocation is active. */
  distanceKm?: number | null
  rank?: number
  isSelected?: boolean
  onSelect?: (id: string) => void
}

export default function SalesPointCard({
  point,
  region,
  distanceKm,
  rank,
  isSelected,
  onSelect,
}: Props) {
  return (
    <div
      id={`card-${point._id}`}
      data-id={point._id}
      onClick={() => onSelect?.(point._id)}
      className={[
        'group relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-surface)] p-4 transition-all duration-[var(--duration)]',
        isSelected
          ? 'border-[var(--color-primary)] shadow-[var(--shadow-md)] ring-1 ring-[var(--color-primary)]'
          : 'border-[var(--color-border)] shadow-[var(--shadow-xs)] hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-md)]',
      ].join(' ')}
    >
      {/* Region mark */}
      <div
        className={[
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] border transition-colors',
          isSelected
            ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
            : 'border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)]',
        ].join(' ')}
      >
        <RegionIcon region={region} className="h-6 w-6" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[var(--color-text)]">
            {rank != null && (
              <span className="tnum me-1 text-[var(--color-text-muted)]">#{rank}</span>
            )}
            {point.name}
          </h3>
          <VipBadge vip={point.vip} />
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-text-secondary)]">
          <span className="inline-flex items-center gap-1">
            <svg className="h-3.5 w-3.5 text-[var(--color-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {point.location}
          </span>
          {point.neighborhood && (
            <span className="text-[var(--color-text-muted)]">• {point.neighborhood}</span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <a
            href={point.googleMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:underline"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 20 3 17V4l6 3M9 7l6 3 6-3v13l-6 3-6-3Zm0 0v13m6-10v13" />
            </svg>
            خرائط Google
          </a>

          {distanceKm != null && (
            <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-[var(--color-accent-soft)] px-2 py-0.5 text-xs font-bold text-[var(--color-accent-hover)]">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
              <span className="tnum">{formatDistance(distanceKm)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Active indicator strip */}
      {isSelected && (
        <span className="absolute inset-y-0 right-0 w-1 bg-[var(--color-primary)]" aria-hidden />
      )}
    </div>
  )
}
