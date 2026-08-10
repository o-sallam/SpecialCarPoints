'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { useActiveTheme } from '@/lib/hooks/use-active-theme'

interface MapPoint {
  _id: string
  displayName: string
  cityName: string
  neighborhoodName: string | null
  extraLabel: string | null
  vip: boolean
  googleMapUrl: string
  lat: number | null
  lng: number | null
}

interface MapViewProps {
  points: MapPoint[]
  selectedId: string | null
  onSelect: (id: string) => void
  userLocation?: { lat: number; lng: number } | null
  recenterSignal?: number
  resizeSignal?: number // NEW — feature 003: bump to invalidate after container resize
}

const DEFAULT_CENTER: L.LatLngTuple = [24.7136, 46.6753]

/** Read a CSS token (so markers follow the active theme), with a hex fallback. */
function token(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

export default function MapView({
  points,
  selectedId,
  onSelect,
  userLocation,
  recenterSignal = 0,
  resizeSignal = 0,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const userMarkerRef = useRef<L.Marker | null>(null)
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null)
  const tileRef = useRef<L.TileLayer | null>(null)
  const [activated, setActivated] = useState(false)

  // --- init / teardown ---
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: false,
        dragging: false,
      }).setView(DEFAULT_CENTER, 6)
      mapRef.current = map
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  const theme = useActiveTheme()

  // --- theme-aware tile layer (dark: CARTO dark_all / light: OSM), swapped live ---
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (tileRef.current) {
      map.removeLayer(tileRef.current)
      tileRef.current = null
    }

    const dark = theme === 'dark'
    const layer = dark
      ? L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap &copy; CARTO',
        })
      : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        })
    layer.addTo(map)
    tileRef.current = layer
  }, [theme])


  function activateMap() {
    if (!activated) setActivated(true)
  }

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (activated) {
      map.scrollWheelZoom.enable()
      map.dragging.enable()
    } else {
      map.scrollWheelZoom.disable()
      map.dragging.disable()
    }
  }, [activated])

  // --- points markers (clustered) ---
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const markerMap = markersRef.current
    // teardown previous markers — cluster group (and its markers) or plain markers
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current)
      clusterRef.current = null
    } else {
      markerMap.forEach((m) => map.removeLayer(m))
    }
    markerMap.clear()

    const valid = points.filter((p) => p.lat != null && p.lng != null)
    const primary = token('--color-primary', '#2563eb')
    const accent = token('--color-accent', '#f59e0b')

    // Build the clustering layer; on init failure fall back to plain markers so
    // the map never breaks (rollback safety, spec §10 / T6).
    try {
      const cg = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 40,
        iconCreateFunction: (cluster) => badgeClusterIcon(cluster.getChildCount()),
      }).addTo(map)
      clusterRef.current = cg
    } catch (err) {
      clusterRef.current = null
    }

    const addMarker = (marker: L.Marker) => {
      if (clusterRef.current) clusterRef.current.addLayer(marker)
      else map.addLayer(marker)
    }

    valid.forEach((p) => {
      const selected = selectedId === p._id
      const fill = selected ? accent : primary
      const size: [number, number] = selected ? [34, 44] : [28, 36]
      const anchor: [number, number] = selected ? [17, 41] : [14, 34]
      const icon = L.divIcon({
        className: '',
        html: pinHtml(fill, p.vip),
        iconSize: size,
        iconAnchor: anchor,
        popupAnchor: [0, -size[1] + 6],
      })

      const marker = L.marker([p.lat!, p.lng!], { icon, zIndexOffset: selected ? 1000 : 0 })
      addMarker(marker)
      marker.bindPopup(
        `<div style="font-family:var(--font-body),sans-serif;min-width:160px">
           <strong style="font-size:13px;color:#0f172a">${escapeHtml(p.displayName)}</strong>
           <div style="font-size:12px;color:#64748b;margin-top:2px">${escapeHtml(p.cityName)}${p.neighborhoodName ? ` • حي ${escapeHtml(p.neighborhoodName)}` : p.extraLabel ? ` • ${escapeHtml(p.extraLabel)}` : ''}</div>
           <a href="${p.googleMapUrl}" target="_blank" rel="noopener" style="display:inline-block;margin-top:6px;font-size:12px;font-weight:600;color:${primary}">فتح في خرائط Google ←</a>
         </div>`,
      )
      marker.on('click', () => onSelect(p._id))
      markerMap.set(p._id, marker)
    })

    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid.map((p) => [p.lat!, p.lng!] as L.LatLngTuple))
      map.fitBounds(bounds, { padding: [60, 60] })
    }
  }, [points, selectedId, onSelect])

  // --- user location marker ---
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current)
      userMarkerRef.current = null
    }
    if (!userLocation) return
    const accent = token('--color-accent', '#f59e0b')
    const icon = L.divIcon({
      className: '',
      html: `<div style="position:relative;width:24px;height:24px">
        <span class="sc-locate-pulse" style="position:absolute;inset:0;border-radius:9999px;background:${accent}"></span>
        <span style="position:absolute;inset:4px;border-radius:9999px;background:${accent};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></span>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })
    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
      icon,
      zIndexOffset: 2000,
    }).addTo(map)
  }, [userLocation])

  // --- fly to selected ---
  useEffect(() => {
    if (!selectedId || !mapRef.current) return
    const marker = markersRef.current.get(selectedId)
    if (marker) {
      mapRef.current.flyTo(marker.getLatLng(), 14, { duration: 0.8 })
      marker.openPopup()
    }
  }, [selectedId])

  // --- feature 003: invalidate on wrapper resize (expand/minimize) ---
  // The parent swaps the wrapper's classes (fixed overlay vs in-page card);
  // window resize does NOT fire, so each bump re-measures the container twice:
  // immediately + once in rAF after layout settles (plan R2, contract C1).
  // Guarded to the mounted map; never tears down or rebuilds the instance
  // (FR-016), and never touches center/zoom, markers, or popups (C1).
  useEffect(() => {
    if (resizeSignal === 0) return
    const invalidate = () => mapRef.current?.invalidateSize()
    invalidate()
    requestAnimationFrame(invalidate)
  }, [resizeSignal])

  // --- recenter on user ---
  useEffect(() => {
    if (!recenterSignal || !userLocation || !mapRef.current) return
    mapRef.current.flyTo([userLocation.lat, userLocation.lng], 12, { duration: 0.9 })
  }, [recenterSignal, userLocation])

  function recenterOnUser() {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 12, { duration: 0.9 })
    }
  }

  return (
    <div
      className="map-isolate relative h-full w-full"
      onClick={activateMap}
      onTouchEnd={activateMap}
    >
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {userLocation && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (!activated) setActivated(true)
            recenterOnUser()
          }}
          aria-label="إعادة التوسيط على موقعي"
          className="absolute bottom-5 left-4 z-[700] flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-accent-hover)] shadow-[var(--shadow-md)] transition-transform hover:scale-105"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <circle cx="12" cy="12" r="8" />
          </svg>
        </button>
      )}

      {!activated && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center rounded-[var(--radius-lg)] bg-black/5 backdrop-blur-[1px]">
          <span className="select-none rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-5 py-2.5 text-sm font-medium text-[var(--color-text)] shadow-[var(--shadow-md)]">
            اضغط للتفاعل مع الخريطة
          </span>
        </div>
      )}
    </div>
  )
}

function badgeClusterIcon(count: number): L.DivIcon {
  // brand-styled circular badge — uses the active theme's primary token
  const primary = token('--color-primary', '#2563eb')
  const size = count >= 100 ? 46 : count >= 10 ? 42 : 38
  const fontSize = size - 20
  const label = `${count} نقطة بيع في هذه المنطقة`
  return L.divIcon({
    className: '',
    html: `<div role="img" aria-label="${label}" title="${label}"
      style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:${primary};color:#fff;font-family:var(--font-body),sans-serif;font-weight:700;font-size:${fontSize}px;border:2px solid rgba(255,255,255,0.9);box-shadow:0 4px 12px rgba(0,0,0,0.35)">${count}</div>`,
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
  })
}

function pinHtml(fill: string, vip: boolean): string {
  const star = vip
    ? `<span style="position:absolute;top:1px;right:-4px;width:14px;height:14px;border-radius:9999px;background:#f59e0b;border:2px solid #fff;display:flex;align-items:center;justify-content:center">
        <svg width="8" height="8" viewBox="0 0 20 20" fill="#fff"><path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 0 0 .95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 0 0-.37 1.12l1.07 3.29c.3.92-.76 1.69-1.54 1.12l-2.8-2.03a1 1 0 0 0-1.18 0l-2.8 2.03c-.78.57-1.83-.2-1.54-1.12l1.07-3.29a1 1 0 0 0-.36-1.12L2.98 8.72c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 0 0 .95-.69z"/></svg>
      </span>`
    : ''
  return `<div style="position:relative;width:28px;height:36px;filter:drop-shadow(0 3px 3px rgba(0,0,0,.3))">
    ${star}
    <svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.5 14 22 14 22s14-12.5 14-22C28 6.27 21.73 0 14 0Z" fill="${fill}" stroke="#fff" stroke-width="2.5"/>
      <circle cx="14" cy="14" r="4.5" fill="#fff"/>
    </svg>
  </div>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
