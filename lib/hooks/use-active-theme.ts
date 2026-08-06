'use client'

import { useEffect, useState } from 'react'

/**
 * Reactive read of the active theme.
 *
 * SPEC-DEVIATION (from spec assumption A5): the app does NOT use `next-themes`.
 * Theme is driven by the inline script in `app/layout.tsx` + `ThemeSwitcher`,
 * which set BOTH the `.dark` class and the `data-theme` attribute on
 * `document.documentElement`. This hook observes `data-theme` via a
 * MutationObserver so components (e.g. MapView tile layer) can react live.
 *
 * Server-side / first render: returns 'light' (safe default); the observer
 * corrects it immediately after hydration if the stored/system theme is dark.
 */
export function useActiveTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const el = document.documentElement

    const read = () => (el.dataset.theme === 'dark' ? 'dark' : 'light')
    setTheme(read())

    const observer = new MutationObserver(() => setTheme(read()))
    observer.observe(el, { attributes: true, attributeFilter: ['data-theme'] })

    return () => observer.disconnect()
  }, [])

  return theme
}
