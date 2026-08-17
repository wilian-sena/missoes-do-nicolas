import type { Responsibility, ResponsibilityCompletion } from '../../types'
import { responsibilityState } from '../../utils/scoring'
import { StatusBadge } from '../ui/StatusBadge'
import { cn } from '../../utils/cn'

interface ResponsibilityCardProps {
  responsibility: Responsibility
  completion: ResponsibilityCompletion | undefined
  onToggle: (part?: 'morning' | 'night') => void
}

export function ResponsibilityCard({
  responsibility,
  completion,
  onToggle,
}: ResponsibilityCardProps) {
  const state = responsibilityState(completion)
  const isTwice = responsibility.mode === 'twice'

  const shell = cn(
    'w-full rounded-[var(--radius-card)] p-4 text-left ring-1 transition',
    state === 'done'
      ? 'bg-grow-50 ring-grow-100'
      : state === 'pending'
        ? 'bg-star-50 ring-star-100'
        : 'bg-paper ring-black/5 hover:bg-brand-50/60',
  )

  const content = (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl',
          state === 'done' ? 'bg-white' : 'bg-cloud',
        )}
        aria-hidden="true"
      >
        {responsibility.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base leading-tight font-extrabold text-ink sm:text-lg">
          {responsibility.shortLabel}
        </span>
        {responsibility.hint && (
          <span className="mt-0.5 block text-xs text-ink-soft">{responsibility.hint}</span>
        )}
        <span className="mt-1.5 block">
          <StatusBadge state={state} />
        </span>
      </span>
      {!isTwice && (
        <span
          aria-hidden="true"
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl font-black ring-2 transition',
            state === 'done'
              ? 'animate-star-pop bg-grow-500 text-white ring-grow-500'
              : state === 'pending'
                ? 'bg-star-400 text-white ring-star-400'
                : 'bg-white text-transparent ring-black/15',
          )}
        >
          {state === 'pending' ? '⏳' : '✓'}
        </span>
      )}
    </div>
  )

  if (!isTwice) {
    return (
      <li>
        <button
          type="button"
          onClick={() => onToggle()}
          aria-pressed={state !== 'todo'}
          className={cn(shell, 'active:scale-[0.99]')}
        >
          {content}
        </button>
      </li>
    )
  }

  return (
    <li className={shell}>
      {content}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <PartButton
          label="Manhã"
          emoji="☀️"
          active={Boolean(completion?.morning)}
          onClick={() => onToggle('morning')}
        />
        <PartButton
          label="Noite"
          emoji="🌙"
          active={Boolean(completion?.night)}
          onClick={() => onToggle('night')}
        />
      </div>
    </li>
  )
}

function PartButton({
  label,
  emoji,
  active,
  onClick,
}: {
  label: string
  emoji: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex min-h-14 items-center justify-center gap-2 rounded-2xl text-base font-extrabold ring-1 transition active:scale-[0.98]',
        active ? 'bg-grow-500 text-white ring-grow-500' : 'bg-white text-ink-soft ring-black/10',
      )}
    >
      <span aria-hidden="true">{emoji}</span>
      {label}
      <span aria-hidden="true">{active ? '✓' : '○'}</span>
    </button>
  )
}
