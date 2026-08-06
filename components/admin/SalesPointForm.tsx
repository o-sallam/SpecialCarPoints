'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { MapPin } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LAT_RANGE, LNG_RANGE, ksaWarning } from '@/lib/coordinates'

// Leaflet + the picker stay out of the initial form bundle (FR-021): they load
// only when the picker opens. ssr:false is mandatory (Leaflet needs window).
const LocationPickerModal = dynamic(
  () => import('./location-picker/LocationPickerModal'),
  { ssr: false },
)

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
  const [pickerOpen, setPickerOpen] = useState(false)
  const [latError, setLatError] = useState('')
  const [lngError, setLngError] = useState('')
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

  // Client-side range guard (FR-012/FR-017) on the manual lat/lng inputs. The
  // server is still the source of truth (direct-API bypasses are rejected there).
  function handleLatChange(v: string) {
    if (!v.trim()) {
      update('lat', null)
      setLatError('')
      return
    }
    const num = parseFloat(v)
    if (!Number.isFinite(num)) return
    if (num < LAT_RANGE[0] || num > LAT_RANGE[1]) {
      setLatError(`خط العرض يجب أن يكون بين ${LAT_RANGE[0]} و ${LAT_RANGE[1]}`)
      return
    }
    setLatError('')
    update('lat', num)
  }

  function handleLngChange(v: string) {
    if (!v.trim()) {
      update('lng', null)
      setLngError('')
      return
    }
    const num = parseFloat(v)
    if (!Number.isFinite(num)) return
    if (num < LNG_RANGE[0] || num > LNG_RANGE[1]) {
      setLngError(`خط الطول يجب أن يكون بين ${LNG_RANGE[0]} و ${LNG_RANGE[1]}`)
      return
    }
    setLngError('')
    update('lng', num)
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
  const ksaNotice =
    form.lat != null && form.lng != null ? ksaWarning(form.lat, form.lng) : null

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
          <Label htmlFor="form-lat">خط العرض (Lat)</Label>
          <Input
            id="form-lat"
            type="number"
            step="any"
            value={form.lat ?? ''}
            onChange={(e) => handleLatChange(e.target.value)}
            className={pill}
            aria-invalid={latError ? true : undefined}
            aria-describedby={latError ? 'form-lat-error' : undefined}
          />
          {latError && (
            <p id="form-lat-error" className="text-xs text-[var(--color-error)]">{latError}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="form-lng">خط الطول (Lng)</Label>
          <Input
            id="form-lng"
            type="number"
            step="any"
            value={form.lng ?? ''}
            onChange={(e) => handleLngChange(e.target.value)}
            className={pill}
            aria-invalid={lngError ? true : undefined}
            aria-describedby={lngError ? 'form-lng-error' : undefined}
          />
          {lngError && (
            <p id="form-lng-error" className="text-xs text-[var(--color-error)]">{lngError}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setPickerOpen(true)}
          className="gap-2"
        >
          <MapPin className="h-4 w-4" />
          اختر من الخريطة
        </Button>
        {ksaNotice && (
          <p className="text-sm text-amber-600">⚠ {ksaNotice}</p>
        )}
      </div>

      {pickerOpen && (
        <LocationPickerModal
          open
          initialCoords={
            form.lat != null && form.lng != null ? { lat: form.lat, lng: form.lng } : null
          }
          onConfirm={(coords) => {
            update('lat', coords?.lat ?? null)
            update('lng', coords?.lng ?? null)
            setPickerOpen(false)
          }}
          onCancel={() => setPickerOpen(false)}
        />
      )}

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