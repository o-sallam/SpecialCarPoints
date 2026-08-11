import Image from 'next/image'

/*
 * components/public/Hero.tsx
 * Full-bleed (100vw) hero for the sales-points directory, carrying the
 * premium brand impression + live summary stat chips above the toolbar.
 *
 * Background: /images/hero/sales-points-hero.png — optimized and served
 * responsively by next/image (priority for LCP). The gradient fallback sits
 * behind it (so transparent regions and the pre-load state still look
 * intentional, never a broken-image icon). A dark gradient scrim on top +
 * white title text keep the copy at WCAG-AA contrast over the photo.
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
      <div className="relative min-h-[280px] w-full md:min-h-[380px]">
        {/* gradient fallback — always rendered so there is never a broken-image icon */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(135deg,var(--color-primary-soft),var(--color-background)_52%,var(--color-accent-soft))]"
        />

        {/* hero background — object-cover keeps it edge-to-edge; object-center
            keeps the focal point framed as the viewport narrows on phones.
            TODO(asset): this PNG has promotional text baked into the image
            itself, which competes with our H1. Replace it with a text-free
            version (same path/name) — the dark scrim + white title below are a
            safety net, not a substitute. */}
        <Image
          src="/images/hero/sales-points-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* dark gradient scrim — sits between the photo and the copy; strongest
            toward the bottom where it backs the title + cards, so the white
            title clears WCAG-AA over every part of the busy photo. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.35),rgba(0,0,0,0.65))]"
        />

        {/* title + stat cards */}
        <div className="relative z-10 container flex min-h-[280px] flex-col justify-center pt-12 pb-6 md:min-h-[380px] md:pt-16 md:pb-8">
          <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.5)] md:text-4xl">
            تصفّح نقاط البيع حسب المنطقة
          </h1>

          {/* live stat cards — always 3-up, even on phones. Dark glass chips
              (#1a202e @ ~57% — matches the scrim) with no border; white/amber
              text keeps WCAG-AA over the busy photo in both themes. */}
          <div className="mt-6 flex flex-nowrap items-stretch gap-2 md:mt-8 md:gap-3">
            <div className="flex-1 min-w-0 rounded-[var(--radius-lg)] border-0 bg-[#1a202e91] px-3 py-4 text-center shadow-[var(--shadow-md)] backdrop-blur-md md:px-5">
              <div className="tnum text-2xl font-extrabold leading-none text-white">{totalPoints}</div>
              <div className="mt-1.5 text-xs font-medium text-white/70">نقطة بيع</div>
            </div>
            <div className="flex-1 min-w-0 rounded-[var(--radius-lg)] border-0 bg-[#1a202e91] px-3 py-4 text-center shadow-[var(--shadow-md)] backdrop-blur-md md:px-5">
              <div className="tnum text-2xl font-extrabold leading-none text-white">{regionCount}</div>
              <div className="mt-1.5 text-xs font-medium text-white/70">منطقة</div>
            </div>
            <div className="flex-1 min-w-0 rounded-[var(--radius-lg)] border-0 bg-[#1a202e91] px-3 py-4 text-center shadow-[var(--shadow-md)] backdrop-blur-md md:px-5">
              <div className="tnum text-2xl font-extrabold leading-none text-[#fcd34d]">{vipCount}</div>
              <div className="mt-1.5 text-xs font-bold text-[#fcd34d]/90">نقطة VIP</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}