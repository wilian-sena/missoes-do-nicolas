import { useMemo } from 'react'
import { useApp } from '../../hooks/useApp'
import { Card, Section } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { ExtraJobCard } from '../../components/child/ExtraJobCard'
import { formatEuro } from '../../utils/money'
import { weekExtrasEarned } from '../../utils/scoring'
import type { ExtraJobCompletion } from '../../types'

/** Missão ativa de cada trabalho: a última que não foi rejeitada. */
function pickCompletion(completions: ExtraJobCompletion[]): ExtraJobCompletion | undefined {
  const ordered = [...completions].sort((a, b) => a.claimedAt.localeCompare(b.claimedAt))
  const live = ordered.filter((item) => item.status !== 'rejected')
  return live.at(-1) ?? ordered.at(-1)
}

export function ExtrasPage() {
  const { state, dispatch } = useApp()
  const earned = weekExtrasEarned(state)

  const byJob = useMemo(() => {
    const map = new Map<string, ExtraJobCompletion[]>()
    for (const completion of state.extraJobCompletions) {
      if (completion.weekStart !== state.currentWeekStart) continue
      const list = map.get(completion.jobId) ?? []
      list.push(completion)
      map.set(completion.jobId, list)
    }
    return map
  }, [state.extraJobCompletions, state.currentWeekStart])

  const jobs = state.extraJobs
    .filter((job) => job.available || byJob.has(job.id))
    .sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-7">
      <header className="px-1">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Trabalhos extra</h1>
        <p className="text-sm font-bold text-ink-soft">
          Estes não são as tuas responsabilidades — é trabalho a mais, e dá dinheiro.
        </p>
      </header>

      <Card className="flex items-center justify-between gap-3 bg-gradient-to-br from-coin-100 to-coin-50">
        <div>
          <p className="text-sm font-bold text-coin-700">Ganhos desta semana</p>
          <p className="text-3xl font-black text-ink">{formatEuro(earned)}</p>
        </div>
        <span className="text-4xl" aria-hidden="true">
          🪙
        </span>
      </Card>

      <Section title="Missões disponíveis" emoji="🧹">
        {jobs.length === 0 ? (
          <EmptyState
            emoji="😴"
            title="Não há missões extra agora"
            description="Os pais podem abrir novas missões quando houver trabalho a fazer."
          />
        ) : (
          <ul className="space-y-2.5">
            {jobs.map((job) => (
              <ExtraJobCard
                key={job.id}
                job={job}
                completion={pickCompletion(byJob.get(job.id) ?? [])}
                onClaim={() => dispatch({ type: 'job/claim', jobId: job.id })}
                onSubmit={() => {
                  const completion = pickCompletion(byJob.get(job.id) ?? [])
                  if (completion) dispatch({ type: 'job/submit', completionId: completion.id })
                }}
                onGiveUp={() => {
                  const completion = pickCompletion(byJob.get(job.id) ?? [])
                  if (completion) dispatch({ type: 'job/giveUp', completionId: completion.id })
                }}
              />
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}
