'use client'

import { useRouter } from 'next/navigation'
import DistrictForm from '@/components/admin/DistrictForm'

export default function NewDistrictPage() {
  const router = useRouter()

  async function handleSubmit(data: { name: string }) {
    const res = await fetch('/api/districts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      router.push('/admin/districts')
      router.refresh()
    } else {
      const err = await res.json()
      throw new Error(err.error || 'Failed to create')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">إضافة منطقة جديدة</h1>
      <DistrictForm onSubmit={handleSubmit} />
    </div>
  )
}
