import { cn } from '../../utils/cn'

interface ProgressBarProps {
  value: number
  max: number
  /** Cor da barra. */
  tone?: 'star' | 'brand' | 'grow' | 'coin'
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

const TONES = {
  star: 'bg-star-400',
  brand: 'bg-brand-500',
  grow: 'bg-grow-500',
  coin: 'bg-coin-500',
} as const

const HEIGHTS = { sm: 'h-2', md: 'h-3.5', lg: 'h-6' } as const

export function ProgressBar({
  value,
  max,
  tone = 'star',
  size = 'md',
  label,
  className,
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1
  const percent = Math.max(0, Math.min(100, (value / safeMax) * 100))

  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-black/8', HEIGHTS[size], className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label ?? `${value} de ${max}`}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500 ease-out', TONES[tone])}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
