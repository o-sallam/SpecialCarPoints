'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapViewProps {
  points: {
    _id: string
    name: string
    location: string
    neighborhood: string | null
    googleMapUrl: string
    lat: number | null
    lng: number | null
  }[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function MapView({ points, selectedId, onSelect }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([24.7136, 46.6753], 6)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(mapRef.current)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const markerMap = markersRef.current

    const validPoints = points.filter((p) => p.lat != null && p.lng != null)

    const bounds = L.latLngBounds(validPoints.map((p) => [p.lat!, p.lng!] as L.LatLngTuple))

    validPoints.forEach((p) => {
      const existing = markerMap.get(p._id)
      if (existing) {
        map.removeLayer(existing)
      }

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width: 32px; height: 32px;
          border-radius: 50%;
          background: ${selectedId === p._id ? 'var(--color-primary, #1976d2)' : 'var(--color-text-secondary, #757575)'};
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
        "></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const marker = L.marker([p.lat!, p.lng!], { icon }).addTo(map)
      marker.bindPopup(
        `<b>${p.name}</b><br/>${p.location}${p.neighborhood ? `<br/>${p.neighborhood}` : ''}<br/><a href="${p.googleMapUrl}" target="_blank" rel="noopener">فتح في خرائط Google</a>`
      )
      marker.on('click', () => onSelect(p._id))
      markerMap.set(p._id, marker)
    })

    if (validPoints.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }

    return () => {
      markerMap.forEach((m) => map.removeLayer(m))
      markerMap.clear()
    }
  }, [points, selectedId, onSelect])

  useEffect(() => {
    const marker = selectedId ? markersRef.current.get(selectedId) : null
    if (marker && mapRef.current) {
      mapRef.current.flyTo(marker.getLatLng(), 14, { duration: 1 })
      marker.openPopup()
    }
  }, [selectedId])

  return <div ref={mapContainerRef} className="w-full h-full min-h-[400px] rounded-[var(--radius-lg)] overflow-hidden z-0" />
}
