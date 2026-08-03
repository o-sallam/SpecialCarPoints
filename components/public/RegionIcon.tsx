'use client'

import type { RegionId } from '@/lib/geo'

/*
 * RegionIcon — custom SVG marks for each Saudi administrative region.
 * One 24×24 glyph per region keeps the category bar and cards distinctive
 * (no generic emoji / stock icons).
 */

interface Props {
  region: Exclude<RegionId, 'all'>
  className?: string
}

export default function RegionIcon({ region, className = 'w-5 h-5' }: Props) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (region) {
    case 'riyadh':
      // Capital towers skyline
      return (
        <svg {...common}>
          <path d="M3 21h18" />
          <path d="M6 21V10l3-2 3 3v10" />
          <path d="M12 21V8l3-4 3 4v13" />
          <path d="M9 11v.01M15 7v.01" />
        </svg>
      )
    case 'makkah':
      // Kaaba cube + minaret
      return (
        <svg {...common}>
          <rect x="8" y="11" width="8" height="9" rx="1" />
          <path d="M8 14h8" />
          <path d="M12 11V8M12 8a2 2 0 0 0 2-2M12 8a2 2 0 0 1-2-2" />
          <path d="M4 20h2M18 20h2" />
        </svg>
      )
    case 'madinah':
      // Mosque dome + crescent
      return (
        <svg {...common}>
          <path d="M12 3a3 3 0 0 0-3 3" />
          <path d="M5 21v-7a7 7 0 0 1 14 0v7" />
          <path d="M3 21h18" />
          <path d="M10 21v-3a2 2 0 0 1 4 0v3" />
        </svg>
      )
    case 'eastern':
      // Offshore platform / wave + drop
      return (
        <svg {...common}>
          <path d="M2 16c2 0 2-1.5 4-1.5S10 16 12 16s2-1.5 4-1.5S20 16 22 16" />
          <path d="M2 19.5c2 0 2-1.5 4-1.5S10 19.5 12 19.5s2-1.5 4-1.5 4 1.5 4 1.5" />
          <path d="M12 3c-2 2.5-2 5 0 6 2-1 2-3.5 0-6Z" />
          <path d="M12 9v6" />
        </svg>
      )
    case 'qassim':
      // Wheat sheaf — agricultural heartland
        return (
        <svg {...common}>
          <path d="M12 21V10" />
          <path d="M12 13c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4Z" />
          <path d="M12 13c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4Z" />
          <path d="M12 17c-3 0-5-2-5-5M12 17c3 0 5-2 5-5" />
          <path d="M9 21h6" />
        </svg>
      )
    case 'asir':
    case 'bahah':
      // Mountains (Asir & Al-Bahah highlands)
      return (
        <svg {...common}>
          <path d="M3 20l5-9 4 5 3-4 6 8Z" />
          <path d="M8 11l1.5-2.5L12 12" />
        </svg>
      )
    case 'jazan':
      // Coastline palm
      return (
        <svg {...common}>
          <path d="M12 20v-9" />
          <path d="M12 11c-4-1-6-3-6-5 3 0 5 2 6 5Z" />
          <path d="M12 11c4-1 6-3 6-5-3 0-5 2-6 5Z" />
          <path d="M12 11c-2-2.5-2-5 0-7 2 2 2 4.5 0 7Z" />
          <path d="M4 20h16" />
        </svg>
      )
    case 'tabuk':
      // Desert dunes + castle
      return (
        <svg {...common}>
          <path d="M3 18c2-3 4-3 6 0M15 18c2-3 4-3 6 0" />
          <path d="M9 18V9l3-2 3 2v9" />
          <path d="M8 12h8" />
          <path d="M11 14h2" />
        </svg>
      )
    case 'hail':
      // Hatim rock inscription / plateau
      return (
        <svg {...common}>
          <path d="M3 19h18" />
          <path d="M4 19l4-7 4 4 3-5 5 8" />
          <path d="M16 8l1.5-2 1.5 2" />
        </svg>
      )
    case 'northern':
      // Compass rose — northern borders
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 4l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" />
        </svg>
      )
    case 'najran':
      // Sun + ruin arch
      return (
        <svg {...common}>
          <path d="M4 21V11a8 8 0 0 1 16 0v10" />
          <path d="M4 21h16" />
          <path d="M8 21v-4h8v4" />
        </svg>
      )
    case 'jawf':
      // Crenellated wall / historic
      return (
        <svg {...common}>
          <path d="M3 21V8l2 2 2-2 2 2 2-2 2 2 2-2 2 2 2-2v13" />
          <path d="M3 21h18" />
          <path d="M7 21v-4h2v4M15 21v-4h2v4" />
        </svg>
      )
    case 'other':
    default:
      return (
        <svg {...common}>
          <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
          <circle cx="12" cy="9" r="2.2" />
        </svg>
      )
  }
}
