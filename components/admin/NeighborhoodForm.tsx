'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface NeighborhoodFormData {
  name: string
  cityId: string
}

interface NeighborhoodFormProps {
  initialData?: NeighborhoodFormData
  onSubmit: (data: NeighborhoodFormData) => Promise<void>
  isEditing?: boolean
}

const pill =
  'rounded-full bg-[var(--color-background)] text-[var(--color-text)] border-[var(--color-border)] focus:ring-[var(--color-primary)]'

interface CityOption {
  _id: string
  name: string
}

/*
 * NeighborhoodForm — create/edit a neighborhood (الحي). The parent city
 * (المنطقة) is a required dropdown, never free text. Mirrors SalesPointForm.
 */
export default function NeighborhoodForm({
  initialData,
  onSubmit,
  isEditing,
}: NeighborhoodFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cities, setCities] = useState<CityOption[]>([])
  const [form, setForm] = useState<NeighborhoodFormData>(
    initialData || { name: '', cityId: '' },
  )

  useEffect(() => {
    fetch('/api/cities')
      .then((r) => r.json())
      .then((c) => setCities(Array.isArray(c) ? c : []))
      .catch(() => setCities([]))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('الاسم مطلوب')
      return
    }
    if (!form.cityId) {
      setError('المنطقة مطلوبة')
      return
    }
    setError('')
    setLoading(true)
    try {
      await onSubmit({ name: form.name.trim(), cityId: form.cityId })
    } catch {
      setError('حدث خطأ أثناء الحفظ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>المنطقة</Label>
          <Select
            value={form.cityId}
            onValueChange={(v) => setForm((p) => ({ ...p, cityId: v }))}
          >
            <SelectTrigger className={pill}>
              <SelectValue placeholder="اختر المنطقة" />
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
          <Label>الاسم</Label>
          <Input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="مثال: العليا"
            className={pill}
            required
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-full bg-[var(--color-primary)] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'جاري الحفظ...' : isEditing ? 'تحديث' : 'إضافة'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-full border border-[var(--color-border)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-background)]"
        >
          إلغاء
        </button>
      </div>
    </form>
  )
}
