'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DistrictForm from '@/components/admin/DistrictForm'

interface DistrictData {
  name: string
}

export default function EditDistrictPage() {
  const params = useParams()
  const router = useRouter()
  const [initialData, setInitialData] = useState<DistrictData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    // No GET /api/districts/[id] exists, so load the list and pick by id.
    fetch('/api/districts')
      .then((r) => r.json())
      .then((districts) => {
        const found = (Array.isArray(districts) ? districts : []).find((d) => d._id === params.id)
        if (found) {
          setInitialData({ name: found.name })
        } else {
          setNotFound(true)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  async function handleSubmit(data: DistrictData) {
    const res = await fetch(`/api/districts/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      router.push('/admin/districts')
      router.refresh()
    } else {
      const err = await res.json()
      throw new Error(err.error || 'Failed to update')
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-[var(--color-text-secondary)]">جاري التحميل...</div>
  }

  if (notFound || !initialData) {
    return <div className="text-center py-12 text-[var(--color-text-secondary)]">المنطقة غير موجودة</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">تعديل المنطقة</h1>
      <DistrictForm initialData={initialData} onSubmit={handleSubmit} isEditing />
    </div>
  )
}
