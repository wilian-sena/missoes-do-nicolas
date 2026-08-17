import type { LearningActivity, LearningCompletion } from '../../types'
import { learningState } from '../../utils/scoring'
import { StatusBadge } from '../ui/StatusBadge'
import { cn } from '../../utils/cn'

interface LearningCardProps {
  activity: LearningActivity
  completion: LearningCompletion | undefined
  /** Verdadeiro quando o limite diário de estrelas já foi atingido por outras atividades. */
  overCap: boolean
  onToggle: () => void
}

export function LearningCard({ activity, completion, overCap, onToggle }: LearningCardProps) {
  const state = learningState(completion)

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={state !== 'todo'}
        className={cn(
          'w-full rounded-[var(--radius-card)] p-4 text-left ring-1 transition active:scale-[0.99]',
          state === 'done'
            ? 'bg-grow-50 ring-grow-100'
            : state === 'pending'
              ? 'bg-star-50 ring-star-100'
              : 'bg-paper ring-black/5 hover:bg-brand-50/60',
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl',
              state === 'done' ? 'bg-white' : 'bg-cloud',
            )}
            aria-hidden="true"
          >
            {activity.emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base leading-tight font-extrabold text-ink sm:text-lg">
              {activity.label}
            </span>
            <span className="mt-0.5 block text-xs text-ink-soft">{activity.goal}</span>
            <span className="mt-1.5 flex flex-wrap items-center gap-2">
              <StatusBadge state={state} />
              {state === 'done' && overCap && (
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                  Feito por gosto — sem estrela extra
                </span>
              )}
            </span>
          </span>
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
        </div>
      </button>
    </li>
  )
}
