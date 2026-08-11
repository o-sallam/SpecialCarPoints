'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import CityForm, { type CityFormData } from '@/components/admin/CityForm'

export default function NewCityPage() {
  const router = useRouter()

  async function handleSubmit(data: CityFormData) {
    const res = await fetch('/api/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      toast.success('تمت إضافة المنطقة بنجاح')
      router.push('/admin/cities')
      router.refresh()
    } else {
      const err = await res.json()
      toast.error(err.error || 'تعذر إنشاء المنطقة')
      throw new Error(err.error || 'Failed to create')
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-text)]">إضافة منطقة جديدة</h1>
      <CityForm onSubmit={handleSubmit} />
    </div>
  )
}
