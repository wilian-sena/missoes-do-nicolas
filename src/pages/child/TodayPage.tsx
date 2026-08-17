import { useCallback, useMemo, useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { useToday } from '../../hooks/useToday'
import { Section } from '../../components/ui/Card'
import { Celebration } from '../../components/ui/Celebration'
import { ResponsibilityCard } from '../../components/child/ResponsibilityCard'
import { LearningCard } from '../../components/child/LearningCard'
import { StarMeter } from '../../components/child/StarMeter'
import {
  activeLearningActivities,
  activeResponsibilities,
  findLearningCompletion,
  findResponsibilityCompletion,
  learningDoneForDay,
  learningStarsForDay,
  nextTier,
  responsibilityStarsForDay,
  responsibilityStreak,
  tierForStars,
  weekTotals,
} from '../../utils/scoring'
import { formatDayMonth, weekdayLong } from '../../utils/date'

export function TodayPage() {
  const { state, dispatch } = useApp()
  const date = useToday()
  const [celebrate, setCelebrate] = useState(false)

  const responsibilities = activeResponsibilities(state)
  const activities = activeLearningActivities(state)

  const respStars = responsibilityStarsForDay(state, date)
  const learnStars = learningStarsForDay(state, date)
  const learnDone = learningDoneForDay(state, date)
  const cap = state.settings.maxLearningStarsPerDay
  const totals = useMemo(() => weekTotals(state), [state])
  const tier = tierForStars(state.rewardTiers, totals.totalStars)
  const upcoming = nextTier(state.rewardTiers, totals.totalStars)
  const streak = state.settings.showStreak ? responsibilityStreak(state, date) : 0

  /**
   * Marca a responsabilidade e, se esta for a que completa o dia, dispara a
   * pequena celebração — decidido aqui, no gesto, e não num efeito.
   */
  const toggleResponsibility = useCallback(
    (responsibilityId: string, part?: 'morning' | 'night') => {
      const responsibility = responsibilities.find((item) => item.id === responsibilityId)
      if (!responsibility) return

      const completion = findResponsibilityCompletion(state, responsibilityId, date)
      const wasDone = completion?.done === true
      const willBeDone =
        responsibility.mode === 'twice'
          ? (part === 'morning' ? !completion?.morning : (completion?.morning ?? false)) &&
            (part === 'night' ? !completion?.night : (completion?.night ?? false))
          : !completion

      dispatch({ type: 'responsibility/toggle', responsibilityId, date, part })

      const completesTheDay =
        !wasDone && willBeDone && respStars + 1 === responsibilities.length
      if (completesTheDay && state.settings.celebrationsEnabled) setCelebrate(true)
    },
    [responsibilities, state, date, dispatch, respStars],
  )

  return (
    <div className="space-y-7">
      <Celebration show={celebrate} duration={1800} onDone={() => setCelebrate(false)} />

      <header className="px-1">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          Olá, {state.profile.name}! <span aria-hidden="true">👋</span>
        </h1>
        <p className="text-sm font-bold text-ink-soft first-letter:uppercase">
          {weekdayLong(date)}, {formatDayMonth(date)}
        </p>
        {streak >= 2 && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-star-50 px-3 py-1 text-sm font-bold text-star-600 ring-1 ring-star-100">
            <span aria-hidden="true">🔥</span> {streak} dias seguidos com tudo feito
          </p>
        )}
      </header>

      <Section
        title="Responsabilidades"
        emoji="🧹"
        hint="Fazem parte da vida cá em casa — dão estrelas, não dinheiro."
        right={
          <span className="shrink-0 rounded-full bg-star-100 px-3 py-1.5 text-base font-black whitespace-nowrap text-star-600">
            <span aria-hidden="true">⭐ </span>
            {respStars} / {responsibilities.length}
          </span>
        }
      >
        <ul className="space-y-2.5">
          {responsibilities.map((responsibility) => (
            <ResponsibilityCard
              key={responsibility.id}
              responsibility={responsibility}
              completion={findResponsibilityCompletion(state, responsibility.id, date)}
              onToggle={(part) => toggleResponsibility(responsibility.id, part)}
            />
          ))}
        </ul>
      </Section>

      <Section
        title="Aprender"
        emoji="🌱"
        hint={`Aprender é investir em ti. No máximo ${cap} estrelas por dia.`}
        right={
          <span className="shrink-0 rounded-full bg-star-100 px-3 py-1.5 text-base font-black whitespace-nowrap text-star-600">
            <span aria-hidden="true">⭐ </span>
            {learnStars} / {cap} hoje
          </span>
        }
      >
        <ul className="space-y-2.5">
          {activities.map((activity) => {
            const completion = findLearningCompletion(state, activity.id, date)
            const isDone = completion?.status === 'approved'
            return (
              <LearningCard
                key={activity.id}
                activity={activity}
                completion={completion}
                overCap={Boolean(isDone) && learnDone > cap}
                onToggle={() => dispatch({ type: 'learning/toggle', activityId: activity.id, date })}
              />
            )
          })}
        </ul>
      </Section>

      <Section title="A minha semana" emoji="⭐">
        <StarMeter stars={totals.totalStars} max={totals.maxStars} tier={tier} next={upcoming} />
      </Section>
    </div>
  )
}
