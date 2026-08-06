'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

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
  return (
    <section className="container py-10">
      <h2 className="mb-6 text-2xl font-extrabold text-[var(--color-text)]">{title}</h2>
      <Accordion
        type="single"
        collapsible
        defaultValue="item-0"
        className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]"
      >
        {items.map((item, i) => (
          <AccordionItem
            key={i}
            value={`item-${i}`}
            className="border-none px-5 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-[var(--color-border)]"
          >
            <AccordionTrigger className="text-start font-bold text-[var(--color-text)] [&[data-state=open]>svg]:text-[var(--color-primary)]">
              {item.q}
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {item.a}
              </p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}