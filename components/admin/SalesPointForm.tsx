'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface CityLike {
  _id: string
  name: string
}
interface NeighborhoodLike {
  _id: string
  name: string
  cityId: string
}

export interface SalesPointData {
  cityId: string
  neighborhoodId: string | null
  extraLabel: string | null
  googleMapUrl: string
  vip: boolean
  lat: number | null
  lng: number | null
  socialLinks: {
    x: string
    facebook: string
    whatsapp: string
    linkedin: string
    email: string
    messenger: string
    snapchat: string
  }
}

interface SalesPointFormProps {
  initialData?: SalesPointData
  onSubmit: (data: SalesPointData) => Promise<void>
  isEditing?: boolean
}

const defaultSocial = {
  x: '',
  facebook: '',
  whatsapp: '',
  linkedin: '',
  email: '',
  messenger: '',
  snapchat: '',
}

export default function SalesPointForm({ initialData, onSubmit, isEditing }: SalesPointFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cities, setCities] = useState<CityLike[]>([])
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodLike[]>([])
  const [form, setForm] = useState<SalesPointData>(
    initialData || {
      cityId: '',
      neighborhoodId: null,
      extraLabel: null,
      googleMapUrl: '',
      vip: false,
      lat: null,
      lng: null,
      socialLinks: { ...defaultSocial },
    },
  )

  useEffect(() => {
    Promise.all([fetch('/api/cities'), fetch('/api/neighborhoods')])
      .then(async ([c, n]) => Promise.all([c.json(), n.json()]))
      .then(([c, n]) => {
        setCities(Array.isArray(c) ? c : [])
        setNeighborhoods(Array.isArray(n) ? n : [])
      })
      .catch(() => {
        setCities([])
        setNeighborhoods([])
      })
  }, [])

  function update(field: keyof SalesPointData, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateSocial(key: string, value: string) {
    setForm((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value },
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // A point has EITHER a neighborhood OR an extraLabel (or neither) —
      // never both. extraLabel is for non-neighborhood places (streets etc.).
      const neighborhoodId = form.neighborhoodId || null
      const payload: SalesPointData = {
        ...form,
        neighborhoodId,
        extraLabel: neighborhoodId ? null : form.extraLabel?.trim() ? form.extraLabel.trim() : null,
      }
      await onSubmit(payload)
    } catch {
      setError('حدث خطأ أثناء الحفظ')
    } finally {
      setLoading(false)
    }
  }

  const cityNeighborhoods = neighborhoods.filter((n) => n.cityId === form.cityId)
  const noNeighborhood = !form.neighborhoodId

  const socialFields = [
    { key: 'x', label: 'X (Twitter)' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'email', label: 'Email' },
    { key: 'messenger', label: 'Messenger' },
    { key: 'snapchat', label: 'Snapchat' },
  ] as const

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">المدينة</label>
          <select
            value={form.cityId}
            onChange={(e) => update('cityId', e.target.value)}
            className="w-full px-4 py-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            required
          >
            <option value="" disabled>اختر المدينة</option>
            {cities.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">الحي</label>
          <select
            value={form.neighborhoodId ?? ''}
            onChange={(e) => update('neighborhoodId', e.target.value || null)}
            disabled={!form.cityId}
            className="w-full px-4 py-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
          >
            <option value="">— لا يوجد (مدينة فقط) —</option>
            {cityNeighborhoods.map((n) => (
              <option key={n._id} value={n._id}>{n.name}</option>
            ))}
          </select>
        </div>
        {/* extraLabel: only relevant when no neighborhood is chosen (streets,
            compound place names, etc.). Deliberately NOT a neighborhoods row. */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
            نص إضافي (شارع / منطقة فرعية)
            {!noNeighborhood && <span className="text-[var(--color-text-muted)]"> — يُستخدم فقط بدون حي</span>}
          </label>
          <input
            type="text"
            value={form.extraLabel ?? ''}
            onChange={(e) => update('extraLabel', e.target.value)}
            disabled={!noNeighborhood}
            placeholder={noNeighborhood ? 'مثال: شارع الاصفر، عريعرة' : ''}
            className="w-full px-4 py-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Google Maps URL</label>
          <input
            type="url"
            value={form.googleMapUrl}
            onChange={(e) => update('googleMapUrl', e.target.value)}
            className="w-full px-4 py-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">خط العرض (Lat)</label>
          <input
            type="number"
            step="any"
            value={form.lat ?? ''}
            onChange={(e) => update('lat', e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full px-4 py-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">خط الطول (Lng)</label>
          <input
            type="number"
            step="any"
            value={form.lng ?? ''}
            onChange={(e) => update('lng', e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full px-4 py-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={form.vip}
            onChange={(e) => update('vip', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-[var(--color-border)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]" />
          <span className="mr-3 text-sm font-medium text-[var(--color-text)]">VIP</span>
        </label>
      </div>

      <div>
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-3">روابط التواصل الاجتماعي</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {socialFields.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs text-[var(--color-text-secondary)] mb-1">{label}</label>
              <input
                type={key === 'email' ? 'email' : 'text'}
                value={form.socialLinks[key]}
                onChange={(e) => updateSocial(key, e.target.value)}
                className="w-full px-4 py-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-full bg-[var(--color-primary)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'جاري الحفظ...' : isEditing ? 'تحديث' : 'إضافة'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-full border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-background)] transition-colors"
        >
          إلغاء
        </button>
      </div>
    </form>
  )
}
