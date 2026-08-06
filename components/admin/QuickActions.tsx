import Link from 'next/link'

export default function QuickActions() {
  const actions = [
    {
      href: '/admin/sales-points/new',
      label: 'إضافة نقطة بيع جديدة',
      icon: '➕',
      colorClass:
        'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white',
    },
    {
      href: '/admin/sales-points',
      label: 'عرض جميع نقاط البيع',
      icon: '📋',
      colorClass:
        'bg-[var(--color-surface)] hover:bg-[var(--color-background)] text-[var(--color-text)] border border-[var(--color-border)]',
    },
    {
      href: '/admin/settings',
      label: 'إعدادات الموقع',
      icon: '⚙️',
      colorClass:
        'bg-[var(--color-surface)] hover:bg-[var(--color-background)] text-[var(--color-text)] border border-[var(--color-border)]',
    },
  ]

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6">
      <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">إجراءات سريعة</h2>

      <div className="grid grid-cols-1 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] transition-all ${action.colorClass}`}
          >
            <span className="text-xl">{action.icon}</span>
            <span className="text-sm font-medium">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}