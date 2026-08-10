'use client'

import { useEffect } from 'react'

/**
 * Locks page scrolling while `locked` is true (FR-009): saves the current
 * `document.body.style.overflow` and `overscrollBehavior`, sets `hidden` /
 * `none` (suppresses rubber-band / pull-to-refresh chaining over a fixed
 * overlay), and restores the saved values on unlock AND on unmount (FR-015).
 *
 * Safe under React 18 StrictMode double-effects — each run saves whatever is
 * current at activation time and restores exactly that on cleanup, never
 * permanently locking the page (contract C6).
 */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return
    const body = document.body
    const prevOverflow = body.style.overflow
    const prevOverscrollBehavior = body.style.overscrollBehavior

    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'

    return () => {
      body.style.overflow = prevOverflow
      body.style.overscrollBehavior = prevOverscrollBehavior
    }
  }, [locked])
}