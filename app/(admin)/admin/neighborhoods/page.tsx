'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import DataTable from '@/components/admin/DataTable'
import ConfirmModal from '@/components/admin/ConfirmModal'

export default function AdminNeighborhoodsList() {
  const router = useRouter()
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/neighborhoods')
    const json = await res.json()
    setData(Array.isArray(json) ? json : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const res = await fetch(`/api/neighborhoods/${deleteId}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteId(null)
    if (res.ok) {
      toast.success('تم حذف الحي')
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'تعذر حذف الحي')
    }
    fetchData()
  }

  const columns = [
    { key: 'name', label: 'الاسم' },
    {
      key: 'cityName',
      label: 'المنطقة',
      render: (item: Record<string, unknown>) => (
        <span className="text-[var(--color-text-secondary)]">
          {(item.cityName as string) || '—'}
        </span>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="py-12 text-center text-[var(--color-text-secondary)]">جاري التحميل...</div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">الأحياء</h1>
        <button
          onClick={() => router.push('/admin/neighborhoods/new')}
          className="rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          إضافة حي
        </button>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <DataTable
          columns={columns}
          data={data}
          onEdit={(item) => router.push(`/admin/neighborhoods/${item._id}`)}
          onDelete={(item) => setDeleteId(item._id as string)}
        />
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف الحي"
        message="هل أنت متأكد من حذف هذا الحي؟ لا يمكن الحذف إذا كان مستخدماً في نقاط بيع."
        loading={deleting}
      />
    </div>
  )
}
