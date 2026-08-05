'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DataTable from '@/components/admin/DataTable'
import ConfirmModal from '@/components/admin/ConfirmModal'

export default function AdminSalesPointsList() {
  const router = useRouter()
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    const pointsRes = await fetch('/api/sales-points')
    const points = await pointsRes.json()
    setData(Array.isArray(points) ? points : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    await fetch(`/api/sales-points/${deleteId}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteId(null)
    fetchData()
  }

  const columns = [
    { key: 'displayName', label: 'الاسم' },
    { key: 'cityName', label: 'المدينة' },
    {
      key: 'neighborhoodName',
      label: 'الحي',
      render: (item: Record<string, unknown>) => (
        <span className="text-[var(--color-text-secondary)]">
          {(item.neighborhoodName as string) || (item.extraLabel as string) || '—'}
        </span>
      ),
    },
    {
      key: 'vip',
      label: 'VIP',
      render: (item: Record<string, unknown>) =>
        item.vip ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[var(--color-primary)] text-white">
            VIP
          </span>
        ) : (
          <span className="text-[var(--color-text-secondary)]">-</span>
        ),
    },
  ]

  if (loading) {
    return <div className="text-center py-12 text-[var(--color-text-secondary)]">جاري التحميل...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">نقاط البيع</h1>
        <button
          onClick={() => router.push('/admin/sales-points/new')}
          className="px-5 py-2.5 rounded-full bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          إضافة نقطة بيع
        </button>
      </div>

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          onEdit={(item) => router.push(`/admin/sales-points/${item._id}`)}
          onDelete={(item) => setDeleteId(item._id as string)}
        />
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف نقطة بيع"
        message="هل أنت متأكد من حذف نقطة البيع هذه؟"
        loading={deleting}
      />
    </div>
  )
}
