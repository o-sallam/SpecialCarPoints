'use client'

interface Props {
  onReset?: () => void
}

export default function EmptyState({ onReset }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] px-6 py-16 text-center animate-pop-in">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-background)] text-[var(--color-text-muted)]">
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
          <path d="M8 11h6" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-[var(--color-text)]">لا توجد نقاط مطابقة</h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--color-text-secondary)]">
        لم نعثر على نقاط بيع ضمن الفلتر الحالي. جرّب تعديل الفلتر أو إعادة عرض الكل.
      </p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          عرض جميع نقاط البيع
        </button>
      )}
    </div>
  )
}
