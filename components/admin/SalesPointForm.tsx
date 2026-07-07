'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SalesPointData {
  name: string
  location: string
  neighborhood: string
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
  const [form, setForm] = useState<SalesPointData>(
    initialData || {
      name: '',
      location: '',
      neighborhood: '',
      googleMapUrl: '',
      vip: false,
      lat: null,
      lng: null,
      socialLinks: { ...defaultSocial },
    }
  )

  function update(field: string, value: unknown) {
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
      await onSubmit(form)
    } catch {
      setError('حدث خطأ أثناء الحفظ')
    } finally {
      setLoading(false)
    }
  }

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
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">الاسم</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full px-4 py-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">الموقع</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            className="w-full px-4 py-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">الحي</label>
          <input
            type="text"
            value={form.neighborhood}
            onChange={(e) => update('neighborhood', e.target.value)}
            className="w-full px-4 py-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
                className="w-full px-4 py-2 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
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
