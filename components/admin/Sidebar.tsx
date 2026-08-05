'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const links = [
  { href: '/admin', label: 'لوحة التحكم' },
  { href: '/admin/sales-points', label: 'نقاط البيع' },
  { href: '/admin/settings', label: 'الإعدادات' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-[var(--color-surface)] border-l border-[var(--color-border)] p-6 flex flex-col">
      <Link href="/admin" className="text-xl font-bold text-[var(--color-primary)] mb-8 block">
        لوحة التحكم
      </Link>

      <nav className="flex-1 space-y-2">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-2.5 rounded-[var(--radius-md)] text-sm transition-colors ${
                isActive
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text)] hover:bg-[var(--color-background)]'
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="w-full px-4 py-2.5 rounded-[var(--radius-md)] text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-right"
      >
        تسجيل الخروج
      </button>
    </aside>
  )
}
