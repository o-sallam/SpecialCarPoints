import { Mail, MessageCircle } from 'lucide-react'
import SocialIcons from './SocialIcons'

const STORE_URL = 'https://specialcarsa.com'

/*
 * Brand/trust assets are hotlinked from the store (Salla) CDN using the EXACT
 * source URLs. TODO(assets): download + self-host these so the footer doesn't
 * depend on the Salla CDN long-term.
 */
const LOGO_URL =
  'https://cdn.salla.sa/cdn-cgi/image/fit=scale-down,width=400,height=400,onerror=redirect,format=auto/jbRel/RqrCUr1zpCl8IQYaRe2KG2E2yBvSvxhBdA1m137A.png'
const COMMERCIAL_REGISTER_URL =
  'https://cdn.salla.network/cdn-cgi/image/fit=scale-down,width=70,height=70,onerror=redirect,format=auto/images/commercial-register.png'
const TAX_URL = 'https://cdn.salla.network/images/tax.png?v=2.0.5'
const SBC_URL = 'https://cdn.salla.network/images/sbc.png?v=2.0.5'
const SBC_LINK =
  'https://eauthenticate.saudibusiness.gov.sa/certificate-details/0000203507'

// TODO(links): confirm the exact Salla page slugs for these.
// Internal routes (leading '/') render as in-app links; everything else opens
// in a new tab (stores keep external-store URLs).
const FOOTER_LINKS: { label: string; href: string; external?: boolean }[] = [
  // Feature: About page now lives in-app at /about (was the store's page slug).
  { label: 'من نحن', href: '/about' },
  { label: 'نقاط بيع معتمدة', href: 'https://specialcarsa.com/%D9%86%D9%82%D8%A7%D8%B7-%D8%A8%D9%8A%D8%B9-%D9%84%D9%84%D9%85%D9%86%D8%AA%D8%AC%D8%A7%D8%AA-%D8%B3%D8%A8%D9%8A%D8%B4%D9%84-%D9%83%D8%A7%D8%B1/page-1685454324' },
  { label: 'تواصل معنا', href: `${STORE_URL}/contact` },
  { label: 'سياسة الاستبدال والاسترجاع', href: 'https://specialcarsa.com/%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D8%B1%D8%AC%D8%A7%D8%B9-%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D8%A8%D8%AF%D8%A7%D9%84/page-1134815720' },
  { label: 'الشروط والأحكام', href: `${STORE_URL}/policies/terms` },
  { label: 'سياسة الخصوصية', href: `${STORE_URL}/policies/privacy` },
]

// TODO(payments): the exact payment ICON image URLs live in the store footer's
// `salla-payments` block, which was NOT included here and is NOT derivable from
// the CDN (every probed path 404s). These text chips are an honest placeholder
// (real method names, NOT substitute icons) — swap in the real <img src> list
// from the source HTML when available.
const PAYMENTS = [
  'mada',
  'Apple Pay',
  'Tamara',
  'Mispay',
  'Emkan',
  'Madfu',
  'بطاقة بنكية',
  'تحويل بنكي',
  'محفظة العميل',
  'الدفع عند الاستلام',
]

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="container py-10 md:py-14">
        {/* Centered, symmetric single column */}
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          {/* Brand — logo only (the wordmark already says "Special Car") */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_URL}
            alt="Special Car"
            className="h-16 w-auto max-w-full md:h-20"
          />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--color-text-secondary)]">
            سبيشـل كـار وجهتك الاولى للعناية بسيـارتك تسوق وأنـت في بيـتك..
          </p>
          <div className="mt-5">
            <SocialIcons
              links={{
                instagram: 'https://www.instagram.com/special.carsa',
                snapchat: 'https://www.snapchat.com/add/special.carsa',
                tiktok: 'https://www.tiktok.com/@special.carsa',
              }}
            />
          </div>

          {/* Quick links */}
          <div className="mt-8 w-full">
            <h3 className="mb-3 text-sm font-bold text-[var(--color-text)]">روابط سريعة</h3>
            <ul className="flex flex-col items-center gap-2.5 text-sm">
              {FOOTER_LINKS.map((link) => {
                const internal = link.href.startsWith('/')
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      {...(internal ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                      className="text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
                    >
                      {link.label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Contact */}
          <div className="mt-8 w-full">
            <h3 className="mb-3 text-sm font-bold text-[var(--color-text)]">تواصل معنا</h3>
            <ul className="flex flex-col items-center gap-2.5 text-sm">
              <li>
                <a
                  href="https://wa.me/966501930897"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  <span dir="ltr">+966 50 193 0897</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:special.carsa1@gmail.com"
                  className="inline-flex items-center gap-2 break-all text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
                >
                  <Mail className="h-4 w-4 shrink-0" aria-hidden />
                  <span>special.carsa1@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Trust / legal badges (exact source images) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={COMMERCIAL_REGISTER_URL} alt="السجل التجاري" className="h-11 w-auto" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={TAX_URL} alt="الرقم الضريبي" className="h-11 w-auto" />
            <a href={SBC_LINK} target="_blank" rel="noopener noreferrer" aria-label="موثق لدى منصة الأعمال">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={SBC_URL} alt="موثق لدى منصة الأعمال" className="h-11 w-auto" />
            </a>
          </div>
          <div className="mt-3 space-y-1 text-xs text-[var(--color-text-secondary)]">
            <p>
              السجل التجاري: <span className="tnum font-semibold text-[var(--color-text)]">1010674447</span>
            </p>
            <p>
              الرقم الضريبي: <span className="tnum font-semibold text-[var(--color-text)]">310802151800003</span>
            </p>
          </div>

          {/* Payment methods */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {PAYMENTS.map((method) => (
              <span
                key={method}
                className="inline-flex items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-secondary)]"
              >
                {method}
              </span>
            ))}
          </div>

          {/* Copyright */}
          <div className="mt-8 flex w-full flex-col items-center gap-2 border-t border-[var(--color-border)] pt-5">
            <p className="text-sm text-[var(--color-text-secondary)]">
              © Special Car 2026. جميع الحقوق محفوظة
            </p>
            <a
              href="https://specialcarsa.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[var(--color-primary)] hover:underline"
            >
              specialcarsa.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
