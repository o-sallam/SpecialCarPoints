'use client'

import { useState } from 'react'
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
import type { CityType } from '@/lib/data/cities'

export interface CityFormData {
  name: string
  type: CityType
}

interface CityFormProps {
  initialData?: CityFormData
  onSubmit: (data: CityFormData) => Promise<void>
  isEditing?: boolean
}

const pill =
  'rounded-full bg-[var(--color-background)] text-[var(--color-text)] border-[var(--color-border)] focus:ring-[var(--color-primary)]'

const TYPES: { value: CityType; label: string }[] = [
  { value: 'مدينة', label: 'مدينة' },
  { value: 'محافظة', label: 'محافظة' },
  { value: 'منطقة', label: 'منطقة' },
]

/*
 * CityForm — create/edit a city (المنطقة). Mirrors SalesPointForm's styling
 * (pill inputs, single column on mobile / two columns on desktop, same
 * submit/cancel buttons).
 */
export default function CityForm({ initialData, onSubmit, isEditing }: CityFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<CityFormData>(initialData || { name: '', type: 'مدينة' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('الاسم مطلوب')
      return
    }
    setError('')
    setLoading(true)
    try {
      await onSubmit({ name: form.name.trim(), type: form.type })
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
          <Label>الاسم</Label>
          <Input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="مثال: الرياض"
            className={pill}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>النوع</Label>
          <Select
            value={form.type}
            onValueChange={(v) => setForm((p) => ({ ...p, type: v as CityType }))}
          >
            <SelectTrigger className={pill}>
              <SelectValue placeholder="اختر النوع" />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
