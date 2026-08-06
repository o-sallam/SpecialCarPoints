'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useActiveTheme } from '@/lib/hooks/use-active-theme'
import { LAT_RANGE, LNG_RANGE, KSA_DEFAULT_CENTER } from '@/lib/coordinates'
import { haversineKm, formatDistance } from '@/lib/geo'

interface MapPickerTabProps {
  /** shared PickedLocation (controlled) — single source of truth */
  value: { lat: number; lng: number } | null
  onChange: (next: { lat: number; lng: number }) => void
  /** saved coordinates of the point being edited (for the optional distance readout) */
  savedCoords?: { lat: number; lng: number } | null
}

/** Read a CSS token at runtime so the marker follows the active theme. */
function primaryToken(): string {
  if (typeof window === 'undefined') return '#2563eb'
  return getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#2563eb'
}

function makePinIcon(theme: string): L.DivIcon {
  const primary = primaryToken()
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:28px;height:36px;filter:drop-shadow(0 3px 3px rgba(0,0,0,.3))">
      <svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.27 0 0 6.27 0 14c0 9.5 14 22 14 22s14-12.5 14-22C28 6.27 21.73 0 14 0Z" fill="${primary}" stroke="#fff" stroke-width="2.5"/>
        <circle cx="14" cy="14" r="4.5" fill="#fff"/>
      </svg>
    </div>`,
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    popupAnchor: [0, -34],
  })
}

/** Place/move the single marker on map click. */
function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

/**
 * Pan to the picked location when it changes a lot (e.g. a distant typed
 * coordinate). Small drags/typing corrections don't fly — no jarring.
 */
function FlyToOnValue({ value }: { value: { lat: number; lng: number } | null }) {
  const map = useMap()
  const prevRef = useRef<{ lat: number; lng: number } | null | undefined>(undefined)

  useEffect(() => {
    if (!value) return
    const prev = prevRef.current
    prevRef.current = value
    if (!prev) return // initial center already applied on mount
    if (Math.abs(prev.lat - value.lat) > 0.05 || Math.abs(prev.lng - value.lng) > 0.05) {
      map.flyTo([value.lat, value.lng], Math.max(map.getZoom(), 13), { duration: 0.6 })
    }
  }, [value?.lat, value?.lng, map])

  return null
}

export default function MapPickerTab({ value, onChange, savedCoords }: MapPickerTabProps) {
  const theme = useActiveTheme()
  const icon = useMemo(() => makePinIcon(theme), [theme])

  // Initial center/zoom: saved coords → close zoom; none → KSA default, never (0,0).
  const initialCenter: [number, number] = value
    ? [value.lat, value.lng]
    : [KSA_DEFAULT_CENTER.lat, KSA_DEFAULT_CENTER.lng]
  const initialZoom = value ? 14 : 5.5

  // Editable coordinate fields (two-way synced with the marker).
  const [latText, setLatText] = useState(value ? String(value.lat) : '')
  const [lngText, setLngText] = useState(value ? String(value.lng) : '')
  const [latErr, setLatErr] = useState('')
  const [lngErr, setLngErr] = useState('')
  const [pairErr, setPairErr] = useState('')

  // Sync the text fields when the marker moves (drag/click/URL-parse success),
  // without stomping on in-progress typing ("24." must stay "24.").
  useEffect(() => {
    if (!value) return
    const curLat = parseFloat(latText)
    const curLng = parseFloat(lngText)
    if (!Number.isFinite(curLat) || Math.abs(curLat - value.lat) > 1e-9) setLatText(String(value.lat))
    if (!Number.isFinite(curLng) || Math.abs(curLng - value.lng) > 1e-9) setLngText(String(value.lng))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function commitPair(lat: number | null, lng: number | null) {
    if (lat == null && lng == null) return
    if (lat == null || lng == null) {
      setPairErr('أدخل كلا الإحداثيين (خط العرض وخط الطول) معاً')
      return
    }
    if (lat < LAT_RANGE[0] || lat > LAT_RANGE[1]) {
      setLatErr(`خط العرض يجب أن يكون بين ${LAT_RANGE[0]} و ${LAT_RANGE[1]}`)
      return
    }
    if (lng < LNG_RANGE[0] || lng > LNG_RANGE[1]) {
      setLngErr(`خط الطول يجب أن يكون بين ${LNG_RANGE[0]} و ${LNG_RANGE[1]}`)
      return
    }
    setPairErr('')
    onChange({ lat, lng })
  }

  function handleLatChange(v: string) {
    setLatText(v)
    setLatErr('')
    setPairErr('')
    if (!v.trim()) return
    const num = parseFloat(v)
    if (!Number.isFinite(num)) return
    if (num < LAT_RANGE[0] || num > LAT_RANGE[1]) {
      setLatErr(`خط العرض يجب أن يكون بين ${LAT_RANGE[0]} و ${LAT_RANGE[1]}`)
      return
    }
    commitPair(num, parseFloat(lngText) || null)
  }

  function handleLngChange(v: string) {
    setLngText(v)
    setLngErr('')
    setPairErr('')
    if (!v.trim()) return
    const num = parseFloat(v)
    if (!Number.isFinite(num)) return
    if (num < LNG_RANGE[0] || num > LNG_RANGE[1]) {
      setLngErr(`خط الطول يجب أن يكون بين ${LNG_RANGE[0]} و ${LNG_RANGE[1]}`)
      return
    }
    commitPair(parseFloat(latText) || null, num)
  }

  // Optional (R8): distance from the saved location when moved > 0.5 km.
  const distanceKm = useMemo(() => {
    if (!savedCoords || !value) return null
    if (savedCoords.lat === value.lat && savedCoords.lng === value.lng) return null
    const km = haversineKm(savedCoords, value)
    return km >= 0.5 ? km : null
  }, [savedCoords, value])

  return (
    <div className="space-y-3">
      <div className="h-72 w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] md:h-80">
        <MapContainer
          center={initialCenter}
          zoom={initialZoom}
          scrollWheelZoom
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
        >
          {/* SPEC-DEVIATION: no next-themes — theme via useActiveTheme() (see use-active-theme.ts) */}
          <TileLayer
            key={theme}
            url={
              theme === 'dark'
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            }
            attribution={theme === 'dark' ? '&copy; OpenStreetMap &copy; CARTO' : '&copy; OpenStreetMap contributors'}
          />
          <MapClickHandler
            onPick={(lat, lng) => {
              setLatErr('')
              setLngErr('')
              setPairErr('')
              onChange({ lat, lng })
            }}
          />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={icon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const ll = (e.target as L.Marker).getLatLng()
                  setLatErr('')
                  setLngErr('')
                  setPairErr('')
                  onChange({ lat: ll.lat, lng: ll.lng })
                },
              }}
            />
          )}
          <FlyToOnValue value={value} />
        </MapContainer>
      </div>

      {/* editable coordinate fields — two-way synced with the marker */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="space-y-1">
          <label htmlFor="mp-lat" className="block text-xs font-medium text-[var(--color-text-secondary)]">
            خط العرض (Lat)
          </label>
          <input
            id="mp-lat"
            type="number"
            step="any"
            inputMode="decimal"
            value={latText}
            onChange={(e) => handleLatChange(e.target.value)}
            aria-invalid={latErr ? true : undefined}
            aria-describedby={latErr ? 'mp-lat-error' : undefined}
            className="w-36 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
          {latErr && (
            <p id="mp-lat-error" className="text-xs text-[var(--color-error)]">{latErr}</p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor="mp-lng" className="block text-xs font-medium text-[var(--color-text-secondary)]">
            خط الطول (Lng)
          </label>
          <input
            id="mp-lng"
            type="number"
            step="any"
            inputMode="decimal"
            value={lngText}
            onChange={(e) => handleLngChange(e.target.value)}
            aria-invalid={lngErr ? true : undefined}
            aria-describedby={lngErr ? 'mp-lng-error' : undefined}
            className="w-36 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
          {lngErr && (
            <p id="mp-lng-error" className="text-xs text-[var(--color-error)]">{lngErr}</p>
          )}
        </div>
        {pairErr && <p className="text-xs text-[var(--color-error)] pt-6">{pairErr}</p>}
      </div>

      {/* live 6-decimal readout */}
      <p className="tnum text-xs text-[var(--color-text-secondary)]">
        {value ? (
          <>
            الإحداثيات المحددة: <span className="font-bold text-[var(--color-text)]">{value.lat.toFixed(6)}</span>,{' '}
            <span className="font-bold text-[var(--color-text)]">{value.lng.toFixed(6)}</span>
          </>
        ) : (
          'لم يتم تحديد موقع بعد — انقر على الخريطة لوضع العلامة'
        )}
      </p>

      {distanceKm != null && (
        <p className="text-xs text-[var(--color-accent-hover)]">
          عن الموقع السابق: ~{formatDistance(distanceKm)}
        </p>
      )}
    </div>
  )
}