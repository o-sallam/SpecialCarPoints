'use client'

import { useState } from 'react'

interface Props {
  active: boolean
  onLocated: (coords: { lat: number; lng: number }) => void
}

type Status = 'idle' | 'loading' | 'error'

export default function GeolocationButton({ active, onLocated }: Props) {
  const [status, setStatus] = useState<Status>('idle')

  function locate() {
    if (!('geolocation' in navigator)) {
      setStatus('error')
      return
    }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus('idle')
        onLocated({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => setStatus('error'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  const label =
    status === 'loading'
      ? 'جارٍ تحديد موقعك…'
      : status === 'error'
        ? 'تعذّر الوصول للموقع'
        : active
          ? 'تم التحديد — أعد التوسيط'
          : 'استخدم موقعي'

  return (
    <button
      type="button"
      onClick={locate}
      disabled={status === 'loading'}
      aria-pressed={active}
      className={[
        'inline-flex items-center gap-2 rounded-[var(--radius-pill)] border px-4 py-2.5 text-sm font-medium transition-all duration-[var(--duration)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]',
        active
          ? 'border-transparent bg-[var(--color-accent)] text-[var(--neutral-900)] shadow-[var(--shadow-accent)] hover:bg-[var(--color-accent-hover)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-border-strong)]',
        status === 'error' ? 'text-[var(--color-error)]' : '',
      ].join(' ')}
    >
      <span className="relative flex h-4 w-4 items-center justify-center">
        {status === 'loading' ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <circle cx="12" cy="12" r="8" />
          </svg>
        )}
        {active && (
          <span className="sc-locate-pulse absolute inset-0 rounded-full bg-[var(--color-accent)]" aria-hidden />
        )}
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  )
}
