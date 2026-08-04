'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DataTable from '@/components/admin/DataTable'
import ConfirmModal from '@/components/admin/ConfirmModal'

export default function AdminDistrictsList() {
  const router = useRouter()
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  // Verbatim backend "Cannot delete: N sales points..." message shown in the
  // modal when deletion is blocked. Empty → show the generic confirm message.
  const [blockMessage, setBlockMessage] = useState('')

  const fetchData = useCallback(async () => {
    const [districtsRes, pointsRes] = await Promise.all([
      fetch('/api/districts'),
      fetch('/api/sales-points'),
    ])
    const districts = await districtsRes.json()
    const points = await pointsRes.json()

    // Count sales points per districtId — both come back as hex strings.
    const counts = new Map<string, number>()
    for (const p of Array.isArray(points) ? points : []) {
      const id = p.districtId
      if (!id) continue
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }

    const rows: Record<string, unknown>[] = (Array.isArray(districts) ? districts : []).map((d) => ({
      _id: d._id,
      name: d.name,
      count: counts.get(d._id) ?? 0,
    }))
    setData(rows)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    setBlockMessage('')
    const res = await fetch(`/api/districts/${deleteId}`, { method: 'DELETE' })
    setDeleting(false)

    if (res.ok) {
      setDeleteId(null)
      fetchData()
      return
    }

    // 400 with the "Cannot delete: N sales points..." message → show it
    // verbatim and keep the modal open (block the deletion).
    if (res.status === 400) {
      const err = await res.json().catch(() => ({}))
      setBlockMessage(err.error || 'تعذّر حذف المنطقة')
      return
    }

    setBlockMessage('تعذّر حذف المنطقة')
  }

  function handleClose() {
    setDeleteId(null)
    setBlockMessage('')
  }

  const columns = [
    { key: 'name', label: 'الاسم' },
    {
      key: 'count',
      label: 'عدد نقاط البيع',
      render: (item: Record<string, unknown>) => (
        <span className="tnum text-[var(--color-text-secondary)]">{Number(item.count)}</span>
      ),
    },
  ]

  if (loading) {
    return <div className="text-center py-12 text-[var(--color-text-secondary)]">جاري التحميل...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">المناطق</h1>
        <button
          onClick={() => router.push('/admin/districts/new')}
          className="px-5 py-2.5 rounded-full bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          إضافة منطقة
        </button>
      </div>

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          onEdit={(item) => router.push(`/admin/districts/${item._id}`)}
          onDelete={(item) => setDeleteId(item._id as string)}
        />
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={handleClose}
        onConfirm={handleDelete}
        title="حذف منطقة"
        message={blockMessage || 'هل أنت متأكد من حذف هذه المنطقة؟'}
        loading={deleting}
      />
    </div>
  )
}
