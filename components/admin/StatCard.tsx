interface StatCardProps {
  title: string
  value: number | string
  description?: string
  icon?: string // Emoji or icon
  trend?: {
    value: number
    isPositive: boolean
  }
  colorScheme?: 'default' | 'primary' | 'success' | 'warning'
}

export default function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  colorScheme = 'default',
}: StatCardProps) {
  const colorClasses = {
    default: 'border-[var(--color-border)]',
    primary: 'border-[var(--color-primary)] bg-[var(--color-primary)]/5',
    success: 'border-green-500 bg-green-500/5',
    warning: 'border-orange-500 bg-orange-500/5',
  }

  return (
    <div
      className={`bg-[var(--color-surface)] rounded-[var(--radius-lg)] border-2 ${colorClasses[colorScheme]} p-6 transition-all hover:shadow-lg`}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm text-[var(--color-text-secondary)]">{title}</p>
        {icon && <span className="text-2xl opacity-70">{icon}</span>}
      </div>

      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-[var(--color-text)]">{value}</p>
        {trend && (
          <span
            className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}
          >
            {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-[var(--color-text-secondary)] mt-2">{description}</p>
      )}
    </div>
  )
}