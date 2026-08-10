import Image from 'next/image'

/*
 * components/public/Hero.tsx
 * Full-bleed (100vw) hero for the sales-points directory, carrying the
 * premium brand impression + live summary stat chips above the toolbar.
 *
 * Background: /images/hero/sales-points-hero.png — optimized and served
 * responsively by next/image (priority for LCP). The gradient fallback sits
 * behind it (so transparent regions and the pre-load state still look
 * intentional, never a broken-image icon) and a token scrim on top keeps the
 * copy at WCAG-AA contrast, including on small screens.
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

        {/* hero background — object-cover keeps it edge-to-edge; object-center
            keeps the focal point framed as the viewport narrows on phones */}
        <Image
          src="/images/hero/sales-points-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* legible scrim over the photo (tuned for small-screen contrast) */}
        <div aria-hidden className="absolute inset-0 bg-[var(--color-background)]/65" />

        {/* title + stat cards */}
        <div className="relative z-10 container flex min-h-[320px] flex-col justify-center py-12 md:min-h-[420px] md:py-16">
          <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight text-[var(--color-primary)] drop-shadow-sm md:text-4xl">
            تصفّح نقاط البيع حسب المنطقة
          </h1>

          {/* live stat cards — always 3-up, even on phones */}
          <div className="mt-6 flex flex-nowrap items-stretch gap-2 md:mt-8 md:gap-3">
            <div className="flex-1 min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-3 py-4 text-center shadow-[var(--shadow-sm)] backdrop-blur-sm md:px-5">
              <div className="tnum text-2xl font-extrabold leading-none text-[var(--color-primary)]">{totalPoints}</div>
              <div className="mt-1.5 text-xs font-medium text-[var(--color-text-secondary)]">نقطة بيع</div>
            </div>
            <div className="flex-1 min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-3 py-4 text-center shadow-[var(--shadow-sm)] backdrop-blur-sm md:px-5">
              <div className="tnum text-2xl font-extrabold leading-none text-[var(--color-primary)]">{regionCount}</div>
              <div className="mt-1.5 text-xs font-medium text-[var(--color-text-secondary)]">منطقة</div>
            </div>
            <div className="flex-1 min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)]/90 px-3 py-4 text-center shadow-[var(--shadow-sm)] backdrop-blur-sm md:px-5">
              <div className="tnum text-2xl font-extrabold leading-none text-[var(--color-accent-hover)]">{vipCount}</div>
              <div className="mt-1.5 text-xs font-bold text-[var(--color-accent-hover)]">نقطة VIP</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}