import VipBadge from './VipBadge'

interface SalesPointCardProps {
  point: {
    _id: string
    name: string
    location: string
    neighborhood: string | null
    vip: boolean
    googleMapUrl: string
    lat: number | null
    lng: number | null
  }
  isSelected?: boolean
  onSelect?: (id: string) => void
}

export default function SalesPointCard({ point, isSelected, onSelect }: SalesPointCardProps) {
  return (
    <div
      id={`card-${point._id}`}
      data-id={point._id}
      onClick={() => onSelect?.(point._id)}
      className={`bg-[var(--color-surface)] rounded-[var(--radius-lg)] border p-4 transition-all cursor-pointer hover:shadow-md ${
        isSelected
          ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]'
          : 'border-[var(--color-border)]'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-[var(--color-text)] text-sm leading-tight">
          {point.name}
        </h3>
        <VipBadge vip={point.vip} />
      </div>
      <p className="text-sm text-[var(--color-text-secondary)] mb-1">{point.location}</p>
      {point.neighborhood && (
        <p className="text-xs text-[var(--color-text-secondary)] mb-3">{point.neighborhood}</p>
      )}
      <a
        href={point.googleMapUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        فتح في خرائط Google
      </a>
    </div>
  )
}
