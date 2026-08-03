'use client'

/*
 * PricingTiers — OPTIONAL reference component (not mounted on the live page).
 *
 * Special Car is a points-of-sale locator and has no public price list today,
 * so this is intentionally generic: pass real tiers/categories via props when
 * you need a pricing section. Defaults are clearly-placeholder copy.
 */

export interface PriceTier {
  label: string
  unit: string
  price: string
  note?: string
  featured?: boolean
}

export interface PriceCategory {
  id: string
  title: string
  icon?: string
  tiers: PriceTier[]
}

interface Props {
  categories?: PriceCategory[]
}

const PLACEHOLDER: PriceCategory[] = [
  {
    id: 'example',
    title: 'مثال على فئة خدمة',
    tiers: [
      { label: 'الأساسي', unit: 'للقطعة', price: '—', note: 'أضف السعر الفعلي هنا' },
      { label: 'المتقدم', unit: 'للقطعة', price: '—', note: 'يشمل التركيب', featured: true },
    ],
  },
]

export default function PricingTiers({ categories = PLACEHOLDER }: Props) {
  return (
    <section className="container py-10">
      <h2 className="mb-2 text-2xl font-extrabold text-[var(--color-text)]">الأسعار والباقات</h2>
      <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
        أسعار مرجعية حسب نوع الخدمة. تُحدَّث عند توفّر التسعير الرسمي.
      </p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]"
          >
            <h3 className="mb-4 text-base font-bold text-[var(--color-text)]">{cat.title}</h3>
            <ul className="space-y-3">
              {cat.tiers.map((tier) => (
                <li
                  key={tier.label}
                  className={[
                    'flex items-baseline justify-between gap-3 rounded-[var(--radius-md)] border px-3 py-2.5',
                    tier.featured
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                      : 'border-[var(--color-border)] bg-[var(--color-background)]',
                  ].join(' ')}
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{tier.label}</p>
                    {tier.note && <p className="text-xs text-[var(--color-text-muted)]">{tier.note}</p>}
                  </div>
                  <div className="text-end">
                    <span className="tnum text-base font-extrabold text-[var(--color-primary)]">{tier.price}</span>
                    <span className="ms-1 text-xs text-[var(--color-text-muted)]">{tier.unit}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
