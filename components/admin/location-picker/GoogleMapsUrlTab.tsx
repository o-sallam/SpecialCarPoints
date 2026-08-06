'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { parseGoogleMapsUrl, isGoogleShortLink } from '@/lib/google-maps-url-parser'

interface GoogleMapsUrlTabProps {
  /** shared PickedLocation (to keep the marker synced across tabs) */
  value: { lat: number; lng: number } | null
  onChange: (next: { lat: number; lng: number }) => void
}

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; lat: number; lng: number }
  | { kind: 'error'; message: string }

const REASON_MESSAGES = {
  notAUrl: 'الرابط الذي تم لصقه غير صالح',
  notGoogleMaps: 'هذا الرابط لا يبدو رابط خرائط جوجل',
  noCoordinates: 'تعذّر العثور على إحداثيات في هذا الرابط، جرّب نسخ الرابط من شريط العنوان…',
  outOfRange: 'الإحداثيات في هذا الرابط خارج النطاق الصحيح',
} as const

const SHORT_LINK_ERROR = 'تعذّر معالجة الرابط المختصر، حاول مرة أخرى'
const SESSION_EXPIRED = 'انتهت الجلسة، يرجى إعادة تسجيل الدخول'

export default function GoogleMapsUrlTab({ value: _value, onChange }: GoogleMapsUrlTabProps) {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  async function extract() {
    const raw = url.trim()
    if (!raw) {
      setStatus({ kind: 'error', message: 'الرجاء لصق رابط من خرائط جوجل' })
      return
    }

    // Short links resolve through the admin-guarded endpoint (US3), then parse.
    if (isGoogleShortLink(raw)) {
      setStatus({ kind: 'loading' })
      try {
        const res = await fetch('/api/admin/resolve-map-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: raw }),
        })
        if (res.status === 401) {
          setStatus({ kind: 'error', message: SESSION_EXPIRED })
          return
        }
        if (!res.ok) {
          setStatus({ kind: 'error', message: SHORT_LINK_ERROR })
          return
        }
        const { resolvedUrl } = await res.json()
        applyParse(resolvedUrl)
      } catch {
        setStatus({ kind: 'error', message: SHORT_LINK_ERROR })
      }
      return
    }

    // Full URLs parse client-side — zero network requests.
    applyParse(raw)
  }

  function applyParse(raw: string) {
    const result = parseGoogleMapsUrl(raw)
    if (result.ok) {
      onChange({ lat: result.lat, lng: result.lng })
      setStatus({ kind: 'success', lat: result.lat, lng: result.lng })
    } else {
      setStatus({ kind: 'error', message: REASON_MESSAGES[result.reason] })
    }
  }

  const isError = status.kind === 'error'

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          dir="ltr"
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            if (status.kind !== 'idle') setStatus({ kind: 'idle' })
          }}
          placeholder="https://maps.app.goo.gl/… أو https://www.google.com/maps/…"
          className="flex-1 text-left"
          aria-label="رابط خرائط جوجل"
          aria-describedby={isError ? 'gm-url-error' : undefined}
        />
        <Button
          type="button"
          onClick={extract}
          disabled={status.kind === 'loading'}
          className="shrink-0"
        >
          {status.kind === 'loading' ? 'جارٍ الاستخراج…' : 'استخراج الإحداثيات'}
        </Button>
      </div>

      {/* aria-live status region — announces the loading→done transition */}
      <div aria-live="polite">
        {status.kind === 'loading' && (
          <p className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" aria-hidden />
            جارٍ معالجة الرابط المختصر…
          </p>
        )}
        {status.kind === 'success' && (
          <p className="tnum flex items-center gap-2 text-sm text-[var(--color-success)]">
            <span aria-hidden>✓</span>
            تم استخراج الإحداثيات: <span className="font-bold">{status.lat.toFixed(6)}</span>,{' '}
            <span className="font-bold">{status.lng.toFixed(6)}</span>
          </p>
        )}
        {status.kind === 'error' && (
          <p id="gm-url-error" className="text-sm text-[var(--color-error)]">{status.message}</p>
        )}
      </div>

      <p className="text-xs text-[var(--color-text-muted)]">
        الصق رابطًا كاملًا من خرائط جوجل وسيتم استخراج الإحداثيات محليًا دون أي طلبات شبكة
        (باستثناء الروابط المختصرة «goo.gl» التي تُعالج عبر الخادم لأسباب أمنية).
      </p>
    </div>
  )
}