'use client'

interface Props {
  title?: string
  description?: string
}

/*
 * TrustCallout — the pattern's highlighted "guarantee / warranty" box.
 * Content is intentionally brand-generic; wire to real copy when available.
 */
export default function TrustCallout({
  title = 'منتجات Special Car الأصلية',
  description = 'جميع نقاط البيع المعتمدة توفّر منتجات Special Car الأصلية بضمان الجودة. ابحث عن أقرب نقطة إليك وتأكّد من أصالة المنتج.',
}: Props) {
  return (
    <section className="container py-10">
      <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-gradient-to-l from-[var(--color-primary)] to-[var(--primary-800)] p-8 text-white shadow-[var(--shadow-lg)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 right-10 h-40 w-40 rounded-full bg-[var(--accent-400)]/20 blur-3xl"
        />
        <div className="relative flex flex-col items-start gap-5 md:flex-row md:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 22s8-4.5 8-11V5l-8-3-8 3v6c0 6.5 8 11 8 11Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold md:text-2xl">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/85 md:text-base">
              {description}
            </p>
          </div>
          <a
            href="/sales-points"
            className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-pill)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--primary-700)] transition-transform hover:scale-[1.02]"
          >
            اعثر على أقرب نقطة
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
