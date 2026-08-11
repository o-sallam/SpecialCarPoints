'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

const links = [
  { href: '/admin', label: 'لوحة التحكم' },
  { href: '/admin/sales-points', label: 'نقاط البيع' },
  { href: '/admin/cities', label: 'المدن والمناطق' },
  { href: '/admin/neighborhoods', label: 'الأحياء' },
  { href: '/admin/settings', label: 'الإعدادات' },
]

/*
 * NavContent — the shared navigation list rendered inside both the desktop
 * sidebar and the mobile Sheet. `onNavigate` lets the mobile drawer close
 * itself after a link is tapped (event delegation on the <nav>).
 */
function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex-1 space-y-2" onClick={onNavigate}>
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
  )
}

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const brand = (
    <Link href="/admin" className="text-xl font-bold text-[var(--color-primary)] mb-8 block">
      لوحة التحكم
    </Link>
  )

  const logoutButton = (
    <button
      onClick={handleLogout}
      className="w-full px-4 py-2.5 rounded-[var(--radius-md)] text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-right"
    >
      تسجيل الخروج
    </button>
  )

  return (
    <>
      {/* Mobile top bar — replaces the sidebar below the `md` breakpoint */}
      <div className="md:hidden sticky top-0 z-[var(--z-sticky)] flex items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <span className="text-lg font-bold text-[var(--color-primary)]">لوحة التحكم</span>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="فتح القائمة">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          {/*
            side="right" gives the physical slide-in-from-right animation, but its
            logical `end-0` anchor flips to the left edge under dir="rtl". Neutralize
            it (`end-auto`) and pin to the physical right edge so the drawer both
            anchors and slides from the right — matching the desktop sidebar.
          */}
          <SheetContent side="right" className="flex flex-col p-6 end-auto right-0">
            <SheetTitle className="sr-only">قائمة التنقل</SheetTitle>
            <div onClick={() => setOpen(false)}>{brand}</div>
            <NavContent onNavigate={() => setOpen(false)} />
            {logoutButton}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar — unchanged on md+ */}
      <aside className="hidden md:flex w-64 shrink-0 min-h-screen bg-[var(--color-surface)] border-l border-[var(--color-border)] p-6 flex-col">
        {brand}
        <NavContent />
        {logoutButton}
      </aside>
    </>
  )
}
