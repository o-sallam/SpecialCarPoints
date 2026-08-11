'use client'

import { useRef, useState } from 'react'
import { Star } from 'lucide-react'

/*
 * Testimonials — "آراء العملاء" section for the About page.
 *
 * Mobile: horizontally swipeable snap-scroll carousel, one card at a time,
 * with dot indicators (touch-friendly, RTL-aware — dot navigation uses
 * scrollIntoView which honors RTL flow; active tracking normalizes scrollLeft
 * via Math.abs).
 * Desktop (≥768px): the same cards become a plain grid (CSS display swap).
 *
 * Avatars: initials circles — customer profile photos are intentionally NOT
 * hotlinked (no rights), so a neutral colored-initial placeholder stands in.
 *
 * Curated set (requester decision — Option B): خالد العنزي's 5/5 review with
 * the defect/unclean-delivery complaint text was OMITTED to keep the public
 * landing page positive-only. Add it back here if authenticity is preferred.
 */

interface Testimonial {
  name: string
  rating: number
  text: string
}

const TESTIMONIALS: Testimonial[] = [
  { name: 'محمد الغامري', rating: 5, text: 'منتجات على مستوى' },
  {
    name: 'eyad almalki',
    rating: 5,
    text: 'شكرا لكم على العروض وصراحة اول مره اطلب من عندهم وأن شاء الله مهي أخرى مره و خدمة العملاء سريعه جدآ اول ب اول',
  },
  { name: 'عبدالله ناصر', rating: 5, text: 'جودة ممتازه وتعامل ممتاز' },
  { name: 'انس ثامر', rating: 5, text: 'فوق الوصف 🤩' },
]

export default function Testimonials() {
  const scrollerRef = useRef<HTMLUListElement | null>(null)
  const cardRefs = useRef<(HTMLLIElement | null)[]>([])
  const [active, setActive] = useState(0)

  function onScroll() {
    const el = scrollerRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    if (max <= 0) return
    const progress = Math.min(1, Math.abs(el.scrollLeft) / max)
    setActive(Math.round(progress * (TESTIMONIALS.length - 1)))
  }

  function goTo(index: number) {
    cardRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start',
    })
  }

  return (
    <section aria-labelledby="about-testimonials-heading" className="pt-2">
      <h2
        id="about-testimonials-heading"
        className="text-2xl font-extrabold tracking-tight text-[var(--color-text)] md:text-3xl"
      >
        آراء العملاء
      </h2>

      <ul
        ref={scrollerRef}
        onScroll={onScroll}
        className="no-scrollbar mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:mt-6 md:grid md:grid-cols-2 md:snap-none md:gap-4 md:overflow-visible md:pb-0 lg:grid-cols-3"
      >
        {TESTIMONIALS.map((t, i) => (
          <li
            key={t.name}
            ref={(el) => {
              cardRefs.current[i] = el
            }}
            className="w-[85%] shrink-0 snap-start rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-md)] transition-colors hover:border-[var(--color-primary)]/40 md:w-auto md:shrink"
          >
            {/* avatar + name + rating row (doesn't wrap: avatar fixed, name
                truncates, stars shrink-0) */}
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-lg font-bold text-[var(--color-primary)]"
              >
                {t.name.charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--color-text)]">{t.name}</p>
                <div
                  role="img"
                  aria-label={`تقييم ${t.rating} من 5`}
                  className="mt-1 flex items-center gap-0.5"
                >
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      aria-hidden
                      className="h-4 w-4 fill-[var(--color-accent)] text-[var(--color-accent)]"
                    />
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {t.text}
            </p>
          </li>
        ))}
      </ul>

      {/* dot indicator — mobile carousel only */}
      <div className="mt-3 flex items-center justify-center gap-1.5 md:hidden" aria-hidden>
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            type="button"
            tabIndex={-1}
            onClick={() => goTo(i)}
            aria-label={`الانتقال إلى التقييم ${i + 1}`}
            className={[
              'h-1.5 rounded-[var(--radius-pill)] transition-all duration-[var(--duration)] ease-[var(--ease)]',
              i === active
                ? 'w-5 bg-[var(--color-primary)]'
                : 'w-1.5 bg-[var(--color-border-strong)]',
            ].join(' ')}
          />
        ))}
      </div>
    </section>
  )
}