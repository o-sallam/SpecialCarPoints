'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import SalesPointForm from '@/components/admin/SalesPointForm'

interface SalesPointData {
  districtId: string
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

export default function EditSalesPointPage() {
  const params = useParams()
  const router = useRouter()
  const [initialData, setInitialData] = useState<SalesPointData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/sales-points/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setInitialData(data)
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
      router.push('/admin/sales-points')
      router.refresh()
    } else {
      const err = await res.json()
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
