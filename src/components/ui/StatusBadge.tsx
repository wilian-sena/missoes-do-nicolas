import type { ItemState } from '../../utils/scoring'
import { cn } from '../../utils/cn'

/**
 * O estado nunca é indicado apenas por cor: há sempre símbolo + palavra.
 */
const STATES: Record<ItemState, { symbol: string; text: string; classes: string }> = {
  done: { symbol: '✓', text: 'Feito', classes: 'bg-grow-50 text-grow-700 ring-grow-100' },
  pending: {
    symbol: '⏳',
    text: 'A aguardar aprovação',
    classes: 'bg-star-50 text-star-600 ring-star-100',
  },
  todo: { symbol: '○', text: 'Por fazer', classes: 'bg-black/5 text-ink-soft ring-black/5' },
}

interface StatusBadgeProps {
  state: ItemState
  compact?: boolean
  className?: string
}

export function StatusBadge({ state, compact = false, className }: StatusBadgeProps) {
  const config = STATES[state]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1',
        config.classes,
        className,
      )}
    >
      <span aria-hidden="true">{config.symbol}</span>
      <span className={cn(compact && 'sr-only')}>{config.text}</span>
    </span>
  )
}
