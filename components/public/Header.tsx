import Link from 'next/link'
import ThemeSwitcher from './ThemeSwitcher'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="text-xl font-bold text-[var(--color-primary)]">
          Special Car
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors">
            الرئيسية
          </Link>
          <Link href="/sales-points" className="text-sm text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors">
            نقاط البيع
          </Link>
          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  )
}
