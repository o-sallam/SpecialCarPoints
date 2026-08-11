'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import CityForm, { type CityFormData } from '@/components/admin/CityForm'

export default function EditCityPage() {
  const params = useParams()
  const router = useRouter()
  const [initialData, setInitialData] = useState<CityFormData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/cities/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && d.name) {
          setInitialData({ name: d.name, type: d.type || 'مدينة' })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  async function handleSubmit(data: CityFormData) {
    const res = await fetch(`/api/cities/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      toast.success('تم تحديث المنطقة بنجاح')
      router.push('/admin/cities')
      router.refresh()
    } else {
      const err = await res.json()
      toast.error(err.error || 'تعذر تحديث المنطقة')
      throw new Error(err.error || 'Failed to update')
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-[var(--color-text-secondary)]">جاري التحميل...</div>
    )
  }

  if (!initialData) {
    return (
      <div className="py-12 text-center text-[var(--color-text-secondary)]">المنطقة غير موجودة</div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-text)]">تعديل المنطقة</h1>
      <CityForm initialData={initialData} onSubmit={handleSubmit} isEditing />
    </div>
  )
}
