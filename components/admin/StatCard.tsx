interface StatCardProps {
  title: string
  value: number | string
  description?: string
}

export default function StatCard({ title, value, description }: StatCardProps) {
  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6">
      <p className="text-sm text-[var(--color-text-secondary)] mb-1">{title}</p>
      <p className="text-3xl font-bold text-[var(--color-text)]">{value}</p>
      {description && (
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">{description}</p>
      )}
    </div>
  )
}
