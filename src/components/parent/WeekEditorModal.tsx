import { useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { useToday } from '../../hooks/useToday'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ResponsibilityCard } from '../child/ResponsibilityCard'
import { LearningCard } from '../child/LearningCard'
import {
  activeLearningActivities,
  activeResponsibilities,
  findLearningCompletion,
  findResponsibilityCompletion,
  learningDoneForDay,
  learningStarsForDay,
  responsibilityStarsForDay,
  weekTotals,
} from '../../utils/scoring'
import { formatDayMonth, weekDays, weekdayShort } from '../../utils/date'
import { cn } from '../../utils/cn'

interface WeekEditorModalProps {
  open: boolean
  onClose: () => void
}

/**
 * Registar dias que já passaram.
 *
 * Serve para quem começa a usar a app a meio da semana: o que o miúdo já fez
 * não se perde. O que um adulto marca aqui fica aprovado à partida.
 */
export function WeekEditorModal({ open, onClose }: WeekEditorModalProps) {
  const { state, dispatch } = useApp()
  const today = useToday()
  const days = weekDays(state.currentWeekStart)
  const [selected, setSelected] = useState(() => (days.includes(today) ? today : days[0]))

  if (!open) return null

  const isFuture = selected > today
  const responsibilities = activeResponsibilities(state)
  const activities = activeLearningActivities(state)
  const cap = state.settings.maxLearningStarsPerDay
  const totals = weekTotals(state)
  const dayStars = responsibilityStarsForDay(state, selected) + learningStarsForDay(state, selected)
  const dayMax = responsibilities.length + cap

  return (
    <Modal
      open
      onClose={onClose}
      title="Editar dias da semana"
      emoji="📝"
      size="lg"
      footer={
        <Button size="lg" block onClick={onClose}>
          Concluído
        </Button>
      }
    >
      <p className="text-sm text-ink-soft">
        Para registar o que o {state.profile.name} já fez antes de começarem a usar a app. O que
        marcarem aqui conta como <strong>aprovado por um adulto</strong>.
      </p>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {days.map((date) => {
          const stars = responsibilityStarsForDay(state, date) + learningStarsForDay(state, date)
          const future = date > today
          return (
            <button
              key={date}
              type="button"
              disabled={future}
              onClick={() => setSelected(date)}
              aria-pressed={selected === date}
              className={cn(
                'flex min-h-16 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 ring-1 transition',
                selected === date
                  ? 'bg-brand-50 ring-2 ring-brand-500'
                  : 'bg-cloud ring-black/10 hover:bg-brand-50/60',
                future && 'opacity-40',
              )}
            >
              <span className="text-xs font-bold text-ink-soft">{weekdayShort(date)}</span>
              <span className="text-base font-black">
                {future ? '–' : stars}
                {!future && <span className="text-xs text-star-600"> ⭐</span>}
              </span>
              {date === today && (
                <span className="text-[10px] font-bold text-brand-700">hoje</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-cloud p-3">
        <p className="text-sm font-bold">
          {formatDayMonth(selected)} ·{' '}
          <span className="text-star-600">
            ⭐ {dayStars} / {dayMax}
          </span>
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={isFuture}
            onClick={() => dispatch({ type: 'day/fill', date: selected })}
          >
            ✓ Marcar tudo
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isFuture}
            onClick={() => dispatch({ type: 'day/clear', date: selected })}
          >
            Limpar dia
          </Button>
        </div>
      </div>

      {isFuture ? (
        <p className="rounded-2xl bg-star-50 p-4 text-sm font-bold text-star-600">
          <span aria-hidden="true">🔮 </span>Este dia ainda não chegou — só se marcam dias que já
          aconteceram.
        </p>
      ) : (
        <>
          <ul className="space-y-2.5">
            {responsibilities.map((responsibility) => (
              <ResponsibilityCard
                key={responsibility.id}
                responsibility={responsibility}
                completion={findResponsibilityCompletion(state, responsibility.id, selected)}
                onToggle={(part) =>
                  dispatch({
                    type: 'responsibility/toggle',
                    responsibilityId: responsibility.id,
                    date: selected,
                    part,
                    byParent: true,
                  })
                }
              />
            ))}
          </ul>

          <ul className="space-y-2.5">
            {activities.map((activity) => {
              const completion = findLearningCompletion(state, activity.id, selected)
              return (
                <LearningCard
                  key={activity.id}
                  activity={activity}
                  completion={completion}
                  overCap={
                    completion?.status === 'approved' && learningDoneForDay(state, selected) > cap
                  }
                  onToggle={() =>
                    dispatch({
                      type: 'learning/toggle',
                      activityId: activity.id,
                      date: selected,
                      byParent: true,
                    })
                  }
                />
              )
            })}
          </ul>
        </>
      )}

      <p className="rounded-2xl bg-brand-50 p-3 text-center font-extrabold text-brand-700">
        Total da semana: ⭐ {totals.totalStars} / {totals.maxStars}
      </p>
    </Modal>
  )
}
