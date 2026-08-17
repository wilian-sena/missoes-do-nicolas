import type { ReactNode } from 'react'

interface EmptyStateProps {
  emoji: string
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[var(--radius-card)] border-2 border-dashed border-black/10 bg-white/60 p-6 text-center">
      <div className="text-4xl" aria-hidden="true">
        {emoji}
      </div>
      <p className="mt-2 font-bold text-ink">{title}</p>
      {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
