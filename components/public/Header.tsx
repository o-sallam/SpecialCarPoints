'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ThemeSwitcher from './ThemeSwitcher'

export default function Header() {
  const [hidden, setHidden] = useState(false)
  const lastScroll = useRef(0)

  useEffect(() => {
    function onScroll() {
      const sy = window.scrollY
      const delta = sy - lastScroll.current
      if (delta > 10 && sy > 80) {
        setHidden(true)
      } else if (delta < -10) {
        setHidden(false)
      }
      lastScroll.current = sy
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-40 bg-[var(--color-surface)] border-b border-[var(--color-border)] transition-transform duration-300 ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="container grid grid-cols-3 items-center h-16">
        {/* start (right in RTL) — theme toggle */}
        <div className="flex items-center justify-start">
          <ThemeSwitcher />
        </div>

        {/* center — logo, exactly centered */}
        <Link
          href="/"
          aria-label="Special Car — الصفحة الرئيسية"
          className="flex items-center justify-center justify-self-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/special-car-logo.avif"
            alt="Special Car"
            className="h-8 w-auto object-contain sm:h-9 dark:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/darkmode-special-car-logo.png"
            alt="Special Car"
            className="hidden h-8 w-auto object-contain sm:h-9 dark:block"
          />
        </Link>

        {/* end (left in RTL) — store */}
        <div className="flex items-center justify-end">
          <a
            href="https://specialcarsa.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            المتجر
          </a>
        </div>
      </div>
    </header>
  )
}
