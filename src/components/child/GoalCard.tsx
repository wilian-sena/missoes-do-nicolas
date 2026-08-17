import type { SavingsGoal } from '../../types'
import { formatEuro } from '../../utils/money'
import { goalProgress } from '../../utils/scoring'
import { ProgressBar } from '../ui/ProgressBar'
import { Card } from '../ui/Card'

interface GoalCardProps {
  goal: SavingsGoal
  savedBalance: number
}

export function GoalCard({ goal, savedBalance }: GoalCardProps) {
  const progress = goalProgress(goal.price, savedBalance)

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-4xl" aria-hidden="true">
          {goal.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg leading-tight font-extrabold">{goal.name}</p>
          <p className="text-sm text-ink-soft">Custa {formatEuro(goal.price)}</p>
        </div>
        {progress.reached && (
          <span className="rounded-full bg-grow-50 px-3 py-1.5 text-sm font-extrabold text-grow-700 ring-1 ring-grow-100">
            <span aria-hidden="true">🎉 </span>Conseguiste!
          </span>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex justify-between text-sm font-bold">
          <span className="text-grow-700">{formatEuro(progress.saved)} guardados</span>
          <span className="text-ink-soft">{formatEuro(goal.price)}</span>
        </div>
        <ProgressBar
          value={progress.saved}
          max={goal.price}
          tone="grow"
          size="lg"
          label={`${formatEuro(progress.saved)} de ${formatEuro(goal.price)}`}
        />
      </div>

      <p className="text-sm font-bold text-ink">
        {progress.reached ? (
          <>
            <span aria-hidden="true">✨ </span>Já tens o suficiente! Fala com os pais para comprar.
          </>
        ) : (
          <>
            Faltam <span className="text-base text-brand-700">{formatEuro(progress.missing)}</span>{' '}
            — continua a guardar!
          </>
        )}
      </p>
    </Card>
  )
}
