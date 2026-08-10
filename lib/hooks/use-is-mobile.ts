'use client'

import { useSyncExternalStore } from 'react'

/**
 * SSR-safe breakpoint hook — `true` when the viewport is < 768px (feature 001's
 * mobile breakpoint, spec A2 / contract C5).
 *
 * Used ONLY for behavior (control visibility + expand gating), never for
 * styling — all full-bleed/fullscreen styling stays CSS-media-driven.
 *
 * Server and first render return `false` (no hydration mismatch); the
 * matchMedia subscription corrects the value immediately after hydration when
 * the real viewport is mobile.
 */
const MOBILE_QUERY = '(max-width: 767px)'

function subscribe(callback: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function getSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches
}

function getServerSnapshot() {
  return false
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}