import { useMemo } from 'react'
import { useApp } from '../../hooks/useApp'
import { useToday } from '../../hooks/useToday'
import { Card, Section } from '../../components/ui/Card'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { StarMeter } from '../../components/child/StarMeter'
import { nextTier, sortedTiers, tierForStars, weekTotals } from '../../utils/scoring'
import { formatWeekRange, weekdayShort } from '../../utils/date'
import { cn } from '../../utils/cn'

export function WeekPage() {
  const { state } = useApp()
  const today = useToday()
  const totals = useMemo(() => weekTotals(state), [state])
  const tier = tierForStars(state.rewardTiers, totals.totalStars)
  const upcoming = nextTier(state.rewardTiers, totals.totalStars)

  return (
    <div className="space-y-7">
      <header className="px-1">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">A minha semana</h1>
        <p className="text-sm font-bold text-ink-soft">{formatWeekRange(totals.weekStart)}</p>
      </header>

      <StarMeter stars={totals.totalStars} max={totals.maxStars} tier={tier} next={upcoming} />

      <Section title="Dia a dia" emoji="📅">
        <Card>
          <ul className="flex justify-between gap-1">
            {totals.perDay.map((day) => {
              const dayTotal = day.responsibility + day.learning
              const dayMax = totals.responsibilityMax / 7 + totals.learningMax / 7
              const isToday = day.date === today
              return (
                <li key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      'text-xs font-bold',
                      isToday ? 'text-brand-700' : 'text-ink-soft',
                    )}
                  >
                    {weekdayShort(day.date)}
                  </span>
                  <div className="flex h-24 w-full items-end justify-center rounded-xl bg-cloud p-1">
                    <div
                      className={cn(
                        'w-full rounded-lg transition-[height] duration-500',
                        dayTotal === 0 ? 'bg-black/10' : 'bg-star-400',
                      )}
                      style={{ height: `${Math.max(6, (dayTotal / dayMax) * 100)}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      'text-sm font-black',
                      isToday ? 'text-brand-700' : 'text-ink',
                    )}
                  >
                    {dayTotal}
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>
      </Section>

      <Section title="Onde ganhei estrelas" emoji="⭐">
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="space-y-2">
            <p className="font-extrabold">
              <span aria-hidden="true">🧹 </span>Responsabilidades
            </p>
            <p className="text-2xl font-black text-star-600">
              {totals.responsibilityStars}{' '}
              <span className="text-base text-ink-soft">/ {totals.responsibilityMax}</span>
            </p>
            <ProgressBar value={totals.responsibilityStars} max={totals.responsibilityMax} />
          </Card>
          <Card className="space-y-2">
            <p className="font-extrabold">
              <span aria-hidden="true">🌱 </span>Aprendizagem
            </p>
            <p className="text-2xl font-black text-star-600">
              {totals.learningStars}{' '}
              <span className="text-base text-ink-soft">/ {totals.learningMax}</span>
            </p>
            <ProgressBar value={totals.learningStars} max={totals.learningMax} />
          </Card>
        </div>
      </Section>

      <Section title="Níveis desta semana" emoji="🏅" hint="Ganhas só o nível mais alto que atingires.">
        <ul className="space-y-2">
          {sortedTiers(state.rewardTiers).map((item) => {
            const reached = totals.totalStars >= item.min
            const isCurrent = item.id === tier?.id
            return (
              <li
                key={item.id}
                className={cn(
                  'flex items-center gap-3 rounded-2xl p-3.5 ring-1 transition',
                  isCurrent
                    ? 'bg-brand-50 ring-2 ring-brand-500'
                    : reached
                      ? 'bg-grow-50 ring-grow-100'
                      : 'bg-paper ring-black/5',
                )}
              >
                <span className="text-2xl" aria-hidden="true">
                  {item.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold">
                    {item.name}{' '}
                    <span className="text-sm font-bold text-ink-soft">
                      ({item.min}–{item.max} ⭐)
                    </span>
                  </p>
                  <p className="text-sm text-ink-soft">{item.privilege}</p>
                </div>
                <span className="shrink-0 text-sm font-bold">
                  {isCurrent ? '👈 aqui' : reached ? '✓' : '○'}
                </span>
              </li>
            )
          })}
        </ul>
      </Section>
    </div>
  )
}
