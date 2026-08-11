'use client'

import { toWhatsAppLink, isCallablePhone, type POSEntry } from '@/lib/points'

interface Props {
  entry: POSEntry
  isSelected?: boolean
  onSelect?: (id: string) => void
}

/*
 * EntryCard — one POS row inside an expanded region.
 * Action icons are field-driven: each renders only when its data exists
 * (graceful hide), matching the reference behavior for missing phone numbers.
 */
export default function EntryCard({ entry, isSelected, onSelect }: Props) {
  const phone = (entry.phone ?? '').trim()
  const whatsapp = (entry.whatsapp ?? '').trim()
  const email = (entry.email ?? '').trim()

  const showCall = isCallablePhone(phone) || isCallablePhone(whatsapp)
  const callTarget = isCallablePhone(phone) ? phone : whatsapp
  const showWhatsApp = whatsapp.length > 0
  const showEmail = email.length > 0

  return (
    <div
      onClick={() => onSelect?.(entry._id)}
      className={[
        'group flex items-center gap-3 rounded-[var(--radius-md)] border bg-[var(--color-surface)] p-3 transition-all duration-[var(--duration)] ease-[var(--ease)] sm:p-4',
        isSelected
          ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]'
          : 'border-[var(--color-border)] hover:-translate-y-0.5 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface-raised)] hover:shadow-[var(--shadow-md)]',
        onSelect ? 'cursor-pointer' : '',
      ].join(' ')}
    >
      {/* Accent stripe by tier */}
      <span
        aria-hidden
        className={[
          'h-9 w-1 shrink-0 rounded-[var(--radius-pill)]',
          entry.vip ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border-strong)]',
        ].join(' ')}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="truncate text-sm font-bold text-[var(--color-text)]">{entry.displayName}</h4>
          {entry.vip && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-pill)] bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[var(--color-accent-hover)]">
              VIP
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--color-text-secondary)]">
          <span className="truncate">
            {entry.cityName}
            {entry.neighborhoodName ? <span className="text-[var(--color-text-muted)]"> • حي {entry.neighborhoodName}</span> : entry.extraLabel ? <span className="text-[var(--color-text-muted)]"> • {entry.extraLabel}</span> : null}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <ActionIcon
          label="الاتجاهات"
          href={entry.googleMapUrl}
          external
          className="hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
        >
          <path d="M9 20 3 17V4l6 3M9 7l6 3 6-3v13l-6 3-6-3Zm0 0v13m6-10v13" />
        </ActionIcon>

        {showCall && (
          <ActionIcon
            label="اتصال"
            href={`tel:${callTarget.replace(/\s+/g, '')}`}
            className="hover:text-[var(--color-success)] hover:bg-[var(--color-success-soft)]"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
          </ActionIcon>
        )}

        {showWhatsApp && (
          <ActionIcon
            label="واتساب"
            href={toWhatsAppLink(whatsapp)}
            external
            className="hover:text-[var(--color-success)] hover:bg-[var(--color-success-soft)]"
          >
            <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2Z" />
            <path d="M8.5 8.2c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2 0 .4 0 .5l-.4.5c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 1.8 1 .6 1.3.5 1.5.4l.5-.6c.2-.2.4-.2.6-.1l1.5.8c.2.1.4.2.4.4 0 .2 0 .9-.3 1.3-.3.4-1 .8-1.5.8s-1.6.1-3.3-.7c-2-1-3.3-3-3.4-3.2-.1-.2-.8-1.1-.8-2 0-.9.5-1.4.7-1.6Z" />
          </ActionIcon>
        )}

        {showEmail && (
          <ActionIcon
            label="بريد"
            href={`mailto:${email}`}
            className="hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m2 6 10 7L22 6" />
          </ActionIcon>
        )}
      </div>
    </div>
  )
}

function ActionIcon({
  href,
  label,
  external,
  className = '',
  children,
}: {
  href: string
  label: string
  external?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      onClick={(e) => e.stopPropagation()}
      className={[
        'flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] transition-colors duration-[var(--duration)] sm:h-10 sm:w-10',
        className,
      ].join(' ')}
    >
      <svg
        className="h-[18px] w-[18px] sm:h-5 sm:w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {children}
      </svg>
    </a>
  )
}
