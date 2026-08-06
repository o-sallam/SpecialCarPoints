'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

const pill =
  'rounded-full bg-[var(--color-background)] text-[var(--color-text)] border-[var(--color-border)] focus:ring-[var(--color-primary)]'

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
        <div className="space-y-2">
          <Label>المدينة</Label>
          <Select value={form.cityId} onValueChange={(v) => update('cityId', v)}>
            <SelectTrigger className={pill}>
              <SelectValue placeholder="اختر المدينة" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>الحي</Label>
          <Select
            value={form.neighborhoodId ?? ''}
            onValueChange={(v) => update('neighborhoodId', v || null)}
            disabled={!form.cityId}
          >
            <SelectTrigger className={pill}>
              <SelectValue placeholder="— لا يوجد (مدينة فقط) —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">— لا يوجد (مدينة فقط) —</SelectItem>
              {cityNeighborhoods.map((n) => (
                <SelectItem key={n._id} value={n._id}>
                  {n.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>
            نص إضافي (شارع / منطقة فرعية)
            {!noNeighborhood && <span className="text-[var(--color-text-muted)]"> — يُستخدم فقط بدون حي</span>}
          </Label>
          <Input
            type="text"
            value={form.extraLabel ?? ''}
            onChange={(e) => update('extraLabel', e.target.value)}
            disabled={!noNeighborhood}
            placeholder={noNeighborhood ? 'مثال: شارع الاصفر، عريعرة' : ''}
            className={pill}
          />
        </div>
        <div className="space-y-2">
          <Label>Google Maps URL</Label>
          <Input
            type="url"
            value={form.googleMapUrl}
            onChange={(e) => update('googleMapUrl', e.target.value)}
            className={pill}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>خط العرض (Lat)</Label>
          <Input
            type="number"
            step="any"
            value={form.lat ?? ''}
            onChange={(e) => update('lat', e.target.value ? parseFloat(e.target.value) : null)}
            className={pill}
          />
        </div>
        <div className="space-y-2">
          <Label>خط الطول (Lng)</Label>
          <Input
            type="number"
            step="any"
            value={form.lng ?? ''}
            onChange={(e) => update('lng', e.target.value ? parseFloat(e.target.value) : null)}
            className={pill}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="vip"
          checked={form.vip}
          onCheckedChange={(v) => update('vip', v)}
          className="data-[state=checked]:bg-[var(--color-primary)]"
        />
        <Label htmlFor="vip">VIP</Label>
      </div>

      <div>
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-3">روابط التواصل الاجتماعي</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {socialFields.map(({ key, label }) => (
            <div className="space-y-1.5" key={key}>
              <Label className="text-xs text-[var(--color-text-secondary)]">{label}</Label>
              <Input
                type={key === 'email' ? 'email' : 'text'}
                value={form.socialLinks[key]}
                onChange={(e) => updateSocial(key, e.target.value)}
                className={`${pill} text-sm`}
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