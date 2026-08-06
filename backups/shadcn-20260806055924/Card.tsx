import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export default function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
