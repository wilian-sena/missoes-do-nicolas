import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article' | 'li'
}

export function Card({ children, className, as: Tag = 'div' }: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-[var(--radius-card)] bg-paper p-4 shadow-[0_6px_24px_-12px_rgba(38,40,58,0.35)] ring-1 ring-black/5 sm:p-5',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

interface SectionProps {
  title: string
  emoji?: string
  right?: ReactNode
  hint?: string
  children: ReactNode
  className?: string
}

export function Section({ title, emoji, right, hint, children, className }: SectionProps) {
  return (
    <section className={cn('space-y-3', className)}>
      <header className="flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-ink sm:text-xl">
            {emoji && <span aria-hidden="true">{emoji} </span>}
            {title}
          </h2>
          {hint && <p className="text-sm text-ink-soft">{hint}</p>}
        </div>
        {right}
      </header>
      {children}
    </section>
  )
}
