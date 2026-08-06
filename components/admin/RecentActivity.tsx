import Link from 'next/link'

interface ActivityItem {
  _id: string
  title: string
  timestamp: Date
  type: 'created' | 'updated'
}

interface RecentActivityProps {
  items: ActivityItem[]
  title: string
}

export default function RecentActivity({ items, title }: RecentActivityProps) {
  if (items.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6">
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">{title}</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">لا توجد نشاطات حديثة</p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6">
      <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">{title}</h2>

      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item._id}
            href={`/admin/sales-points/${item._id}`}
            className="block p-3 rounded-[var(--radius-md)] hover:bg-[var(--color-background)] transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text)] truncate">
                  {item.title}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {new Date(item.timestamp).toLocaleString('ar-SA', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  item.type === 'created'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}
              >
                {item.type === 'created' ? 'جديد' : 'محدّث'}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/admin/sales-points"
        className="block text-center text-sm text-[var(--color-primary)] hover:underline mt-4"
      >
        عرض الكل ←
      </Link>
    </div>
  )
}