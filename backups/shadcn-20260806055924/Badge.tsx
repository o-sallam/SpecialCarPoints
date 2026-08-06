import { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'vip'
}

export default function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)]',
    vip: 'bg-[var(--color-primary)] text-white',
  }
  
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-[var(--radius-full)] text-xs font-medium ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
