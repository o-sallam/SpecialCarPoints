interface SocialLinks {
  x?: string
  facebook?: string
  whatsapp?: string
  linkedin?: string
  email?: string
  messenger?: string
  snapchat?: string
}

interface SocialIconsProps {
  links: SocialLinks
}

const platforms: { key: keyof SocialLinks; label: string; href: (v: string) => string }[] = [
  { key: 'x', label: 'X', href: (v) => v },
  { key: 'facebook', label: 'Facebook', href: (v) => v },
  { key: 'whatsapp', label: 'WhatsApp', href: (v) => `https://wa.me/${v.replace(/[^0-9]/g, '')}` },
  { key: 'linkedin', label: 'LinkedIn', href: (v) => v },
  { key: 'email', label: 'Email', href: (v) => `mailto:${v}` },
  { key: 'messenger', label: 'Messenger', href: (v) => v },
  { key: 'snapchat', label: 'Snapchat', href: (v) => v },
]

export default function SocialIcons({ links }: SocialIconsProps) {
  const valid = platforms.filter((p) => links[p.key])

  if (valid.length === 0) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {valid.map((p) => (
        <a
          key={p.key}
          href={p.href(links[p.key]!)}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface)] transition-colors text-xs"
          title={p.label}
        >
          {p.label}
        </a>
      ))}
    </div>
  )
}
