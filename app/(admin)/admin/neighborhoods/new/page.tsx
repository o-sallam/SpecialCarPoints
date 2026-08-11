'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import NeighborhoodForm, { type NeighborhoodFormData } from '@/components/admin/NeighborhoodForm'

export default function NewNeighborhoodPage() {
  const router = useRouter()

  async function handleSubmit(data: NeighborhoodFormData) {
    const res = await fetch('/api/neighborhoods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      toast.success('تمت إضافة الحي بنجاح')
      router.push('/admin/neighborhoods')
      router.refresh()
    } else {
      const err = await res.json()
      toast.error(err.error || 'تعذر إنشاء الحي')
      throw new Error(err.error || 'Failed to create')
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-text)]">إضافة حي جديد</h1>
      <NeighborhoodForm onSubmit={handleSubmit} />
    </div>
  )
}
