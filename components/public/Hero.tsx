/*
 * components/public/Hero.tsx
 * Full-bleed (100vw) hero for the sales-points directory, carrying the
 * premium brand impression + live summary stat chips above the toolbar.
 *
 * TODO: replace with real hero image. When the asset is ready:
 *   1. Uncomment `import Image from 'next/image'` below.
 *   2. Uncomment the <Image ... /> element (staged at
 *      `public/images/hero/sales-points-hero.jpg`) inside the section.
 *   3. The gradient fallback + scrim below will then sit behind it.
 * Until then, render the gradient fallback (never a broken-image icon) —
 * see research.md R5.
 */

interface HeroProps {
  /** live count of all sales points, e.g. 55 */
  totalPoints: number
  /** live count of regions, e.g. 21 */
  regionCount: number
  /** live count of VIP points */
  vipCount: number
}

export default function Hero({ totalPoints, regionCount, vipCount }: HeroProps) {
  return (
    <section className="relative w-screen overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-background)]">
      {/* reserved height — prevents layout shift while (optional) image loads */}
      <div className="relative min-h-[320px] w-full md:min-h-[420px]">
        {/* gradient fallback — always rendered so there is never a broken-image icon */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(135deg,var(--color-primary-soft),var(--color-background)_52%,var(--color-accent-soft))]"
        />

        {/* TODO: real hero image — uncomment when `public/images/hero/sales-points-hero.jpg` ships
        <Image
          src="/images/hero/sales-points-hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        */}

        {/* legible scrim so copy meets WCAG-AA over the warm/blue fallback */}
        <div aria-hidden className="absolute inset-0 bg-[var(--color-background)]/55" />

        {/* copy + stat chips */}
        <div className="relative z-10 container flex min-h-[320px] flex-col justify-center py-12 md:min-h-[420px] md:py-16">
          <span className="inline-flex w-fit items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
            دليل نقاط البيع
          </span>
          <h1 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-[var(--color-text)] md:text-4xl">
            تصفّح نقاط البيع حسب المنطقة
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--color-text-secondary)] md:text-base">
            استعرض نقاط بيع Special Car مجمّعة حسب المناطق الإدارية في المملكة. بدّل بين العرض
            كقائمة أو خريطة، وفلتر حسب النوع، وحدّد موقعك لترتيب الأقرب إليك.
          </p>

          {/* live stat chips — never hardcoded */}
          <div className="mt-8 flex flex-wrap items-stretch gap-3">
            <div className="min-w-28 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-5 py-4 shadow-[var(--shadow-sm)] backdrop-blur-sm">
              <div className="tnum text-2xl font-extrabold leading-none text-[var(--color-text)]">{totalPoints}</div>
              <div className="mt-1.5 text-xs font-medium text-[var(--color-text-secondary)]">نقطة بيع</div>
            </div>
            <div className="min-w-28 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-5 py-4 shadow-[var(--shadow-sm)] backdrop-blur-sm">
              <div className="tnum text-2xl font-extrabold leading-none text-[var(--color-text)]">{regionCount}</div>
              <div className="mt-1.5 text-xs font-medium text-[var(--color-text-secondary)]">منطقة</div>
            </div>
            <div className="min-w-28 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)]/80 px-5 py-4 shadow-[var(--shadow-sm)]">
              <div className="tnum text-2xl font-extrabold leading-none text-[var(--color-accent-hover)]">{vipCount}</div>
              <div className="mt-1.5 text-xs font-bold text-[var(--color-accent-hover)]">نقطة VIP</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}