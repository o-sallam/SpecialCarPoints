'use client'

import { useState } from 'react'

export interface FaqItem {
  q: string
  a: string
}

interface Props {
  items?: FaqItem[]
  title?: string
}

const DEFAULT_ITEMS: FaqItem[] = [
  {
    q: 'كيف أجد أقرب نقطة بيع إلي؟',
    a: 'اضغط على زر «استخدم موقعي» أعلى الخريطة، وستقوم الخريطة بإعادة التوسيط على موقعك وترتيب القائمة حسب الأقرب مسافة.',
  },
  {
    q: 'هل نقاط البيع محدّثة؟',
    a: 'نعمل على تحديث قائمة نقاط البيع باستمرار. إن واجهت نقطة مغلقة أو غير دقيقة، يُرجى التواصل معنا عبر موقعنا الرسمي.',
  },
  {
    q: 'ما الفرق بين النقاط العادية ونقاط VIP؟',
    a: 'نقاط VIP هي نقاط بيع مميّزة توفّر تشكيلة أوسع من منتجات Special Car وخدمة محسّنة. يمكنك تصفيتها من شريط الأدوات.',
  },
  {
    q: 'هل يمكنني فتح الموقع في خرائط Google؟',
    a: 'نعم، من كل بطاقة نقطة بيع يمكنك الضغط على «فتح في خرائط Google» للوصول إلى الاتجاهات والملاحة.',
  },
]

export default function FaqAccordion({ items = DEFAULT_ITEMS, title = 'أسئلة شائعة' }: Props) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="container py-10">
      <h2 className="mb-6 text-2xl font-extrabold text-[var(--color-text)]">{title}</h2>
      <div className="divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
        {items.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={i}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start transition-colors hover:bg-[var(--color-background)]"
              >
                <span className="font-bold text-[var(--color-text)]">{item.q}</span>
                <svg
                  className={[
                    'h-5 w-5 shrink-0 text-[var(--color-text-secondary)] transition-transform duration-[var(--duration)]',
                    isOpen ? 'rotate-180 text-[var(--color-primary)]' : '',
                  ].join(' ')}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div
                className="grid transition-[grid-template-rows] duration-[var(--duration)] ease-[var(--ease)]"
                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
