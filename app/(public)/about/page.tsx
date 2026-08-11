import type { Metadata } from 'next'
import Testimonials from './Testimonials'

export const metadata: Metadata = {
  title: 'من نحن',
  description:
    'سبيشـل كـار وجهتك الاولى للعناية بسيـارتك تسوق وأنـت في بيـتك.. تعرف على Special Car وآراء عملائنا.',
}

/*
 * Banner assets are hotlinked from the store (Salla) CDN using the exact
 * source URLs (same pattern as the Footer's brand/trust assets).
 * TODO(assets): download + self-host so the page doesn't depend on the Salla
 * CDN long-term.
 */
const BANNERS = [
  {
    src: 'https://cdn.salla.sa/form-builder/1zlxSzbpAYwZoV5bKvOM9deWb1rSo6XoyoyhJT3f.png',
    alt: 'بانر تعريفي — Special Car',
  },
  {
    src: 'https://cdn.salla.sa/form-builder/sPGNOIdtO1cPPv98NmS1qUFoemu7EnYQZWZ6wISC.png',
    alt: 'بانر تعريفي — Special Car',
  },
]

export default function AboutPage() {
  return (
    <div className="container max-w-4xl space-y-8 py-10 md:space-y-10 md:py-14">
      {/* 1 — page heading */}
      <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text)] md:text-4xl">
        من نحن
      </h1>

      {/* 2 — banner 1 (full-width, aspect-preserved) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BANNERS[0].src}
        alt={BANNERS[0].alt}
        loading="lazy"
        className="h-auto w-full rounded-[var(--radius-xl)] border border-[var(--color-border)] object-contain shadow-[var(--shadow-md)]"
      />

      {/* 3 — brand intro (same copy as the footer description) */}
      <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)] md:text-base">
        سبيشـل كـار وجهتك الاولى للعناية بسيـارتك تسوق وأنـت في بيـتك..
      </p>

      {/* 4 — banner 2 (full-width, aspect-preserved) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BANNERS[1].src}
        alt={BANNERS[1].alt}
        loading="lazy"
        className="h-auto w-full rounded-[var(--radius-xl)] border border-[var(--color-border)] object-contain shadow-[var(--shadow-md)]"
      />

      {/* 5 — testimonials */}
      <Testimonials />
    </div>
  )
}