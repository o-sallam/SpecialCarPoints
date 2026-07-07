'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface SettingsData {
  storeName: string
  storeUrl: string
  storeDescription: string
}

export default function AdminSettings() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<SettingsData>({
    storeName: '',
    storeUrl: '',
    storeDescription: '',
  })

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.storeName) {
          setForm({
            storeName: data.storeName,
            storeUrl: data.storeUrl,
            storeDescription: data.storeDescription,
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-[var(--color-text-secondary)]">جاري التحميل...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">الإعدادات</h1>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">اسم المتجر</label>
          <input
            type="text"
            value={form.storeName}
            onChange={(e) => setForm((p) => ({ ...p, storeName: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">رابط المتجر</label>
          <input
            type="url"
            value={form.storeUrl}
            onChange={(e) => setForm((p) => ({ ...p, storeUrl: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">وصف المتجر</label>
          <textarea
            value={form.storeDescription}
            onChange={(e) => setForm((p) => ({ ...p, storeDescription: e.target.value }))}
            rows={3}
            className="w-full px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            required
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-full bg-[var(--color-primary)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ'}
        </button>
      </form>
    </div>
  )
}
