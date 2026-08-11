'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import NeighborhoodForm, { type NeighborhoodFormData } from '@/components/admin/NeighborhoodForm'

export default function EditNeighborhoodPage() {
  const params = useParams()
  const router = useRouter()
  const [initialData, setInitialData] = useState<NeighborhoodFormData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/neighborhoods/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && d.name && d.cityId) {
          setInitialData({ name: d.name, cityId: d.cityId })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  async function handleSubmit(data: NeighborhoodFormData) {
    const res = await fetch(`/api/neighborhoods/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      toast.success('تم تحديث الحي بنجاح')
      router.push('/admin/neighborhoods')
      router.refresh()
    } else {
      const err = await res.json()
      toast.error(err.error || 'تعذر تحديث الحي')
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
      <div className="py-12 text-center text-[var(--color-text-secondary)]">الحي غير موجود</div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-text)]">تعديل الحي</h1>
      <NeighborhoodForm initialData={initialData} onSubmit={handleSubmit} isEditing />
    </div>
  )
}
