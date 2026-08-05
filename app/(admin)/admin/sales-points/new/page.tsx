'use client'

import { useRouter } from 'next/navigation'
import SalesPointForm, { type SalesPointData } from '@/components/admin/SalesPointForm'

export default function NewSalesPointPage() {
  const router = useRouter()

  async function handleSubmit(data: SalesPointData) {
    const res = await fetch('/api/sales-points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      router.push('/admin/sales-points')
      router.refresh()
    } else {
      const err = await res.json()
      throw new Error(err.error || 'Failed to create')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">إضافة نقطة بيع جديدة</h1>
      <SalesPointForm onSubmit={handleSubmit} />
    </div>
  )
}
