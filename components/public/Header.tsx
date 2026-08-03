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
      <div className="container flex items-center justify-between h-16">
        <Link href="/" aria-label="Special Car — الصفحة الرئيسية" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/special-car-logo.avif"
            alt="Special Car"
            className="h-8 w-auto object-contain sm:h-9"
          />
        </Link>
        <nav className="flex items-center gap-4">
          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  )
}
