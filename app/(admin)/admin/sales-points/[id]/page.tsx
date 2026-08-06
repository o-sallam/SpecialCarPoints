'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import SalesPointForm, { type SalesPointData } from '@/components/admin/SalesPointForm'

const defaultSocial = {
  x: '',
  facebook: '',
  whatsapp: '',
  linkedin: '',
  email: '',
  messenger: '',
  snapchat: '',
}

export default function EditSalesPointPage() {
  const params = useParams()
  const router = useRouter()
  const [initialData, setInitialData] = useState<SalesPointData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/sales-points/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        // The [id] GET returns the raw doc; pick the fields the form edits.
        // (cityId/neighborhoodId arrive as hex strings, ObjectId->JSON.)
        setInitialData({
          cityId: d.cityId || '',
          neighborhoodId: d.neighborhoodId ?? null,
          extraLabel: d.extraLabel ?? null,
          googleMapUrl: d.googleMapUrl || '',
          vip: !!d.vip,
          lat: d.lat ?? null,
          lng: d.lng ?? null,
          socialLinks: d.socialLinks || { ...defaultSocial },
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  async function handleSubmit(data: SalesPointData) {
    const res = await fetch(`/api/sales-points/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      toast.success('تم تحديث نقطة البيع بنجاح')
      router.push('/admin/sales-points')
      router.refresh()
    } else {
      const err = await res.json()
      toast.error(err.error || 'تعذر تحديث نقطة البيع')
      throw new Error(err.error || 'Failed to update')
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-[var(--color-text-secondary)]">جاري التحميل...</div>
  }

  if (!initialData) {
    return <div className="text-center py-12 text-[var(--color-text-secondary)]">نقطة البيع غير موجودة</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">تعديل نقطة البيع</h1>
      <SalesPointForm initialData={initialData} onSubmit={handleSubmit} isEditing />
    </div>
  )
}
