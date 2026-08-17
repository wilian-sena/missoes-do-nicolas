import { useMemo } from 'react'
import { useApp } from '../../hooks/useApp'
import { Card, Section } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { pendingApprovals } from '../../utils/scoring'
import { formatEuro } from '../../utils/money'
import { formatDayMonth, formatDateTime } from '../../utils/date'

export function ApprovalsPage() {
  const { state, dispatch } = useApp()
  const pending = useMemo(() => pendingApprovals(state), [state])

  if (pending.total === 0) {
    return (
      <div className="space-y-7">
        <Header />
        <EmptyState
          emoji="🎈"
          title="Nada por aprovar"
          description="Tudo em dia. As marcações que exigirem aprovação aparecem aqui."
        />
      </div>
    )
  }

  return (
    <div className="space-y-7">
      <Header count={pending.total} />

      {pending.extraJobs.length > 0 && (
        <Section title="Trabalhos extra" emoji="🪙" hint="Aprovar move o valor para os ganhos da semana.">
          <ul className="space-y-2.5">
            {pending.extraJobs.map((completion) => (
              <Card as="li" key={completion.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">
                    {completion.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold">{completion.label}</p>
                    <p className="text-xs text-ink-soft">
                      Terminado em{' '}
                      {completion.submittedAt ? formatDateTime(completion.submittedAt) : '—'}
                    </p>
                  </div>
                  <span className="rounded-full bg-coin-100 px-3 py-1.5 font-black text-coin-700">
                    {formatEuro(completion.amount)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="success"
                    className="flex-1"
                    onClick={() => dispatch({ type: 'job/approve', completionId: completion.id })}
                  >
                    Aprovar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      dispatch({
                        type: 'job/reject',
                        completionId: completion.id,
                        note: 'Ainda falta um bocadinho — vamos tentar outra vez.',
                      })
                    }
                  >
                    Ainda não
                  </Button>
                </div>
              </Card>
            ))}
          </ul>
        </Section>
      )}

      {pending.responsibilities.length > 0 && (
        <Section title="Responsabilidades" emoji="🧹">
          <ul className="space-y-2.5">
            {pending.responsibilities.map((completion) => {
              const responsibility = state.responsibilities.find(
                (item) => item.id === completion.responsibilityId,
              )
              return (
                <Card as="li" key={completion.id} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl" aria-hidden="true">
                      {responsibility?.emoji ?? '•'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold">{responsibility?.label ?? 'Responsabilidade'}</p>
                      <p className="text-xs text-ink-soft">{formatDayMonth(completion.date)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="success"
                      className="flex-1"
                      onClick={() =>
                        dispatch({ type: 'responsibility/approve', completionId: completion.id })
                      }
                    >
                      Aprovar <span aria-hidden="true">⭐</span>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        dispatch({ type: 'responsibility/reject', completionId: completion.id })
                      }
                    >
                      Ainda não
                    </Button>
                  </div>
                </Card>
              )
            })}
          </ul>
        </Section>
      )}

      {pending.learning.length > 0 && (
        <Section title="Aprendizagem" emoji="🌱">
          <ul className="space-y-2.5">
            {pending.learning.map((completion) => {
              const activity = state.learningActivities.find(
                (item) => item.id === completion.activityId,
              )
              return (
                <Card as="li" key={completion.id} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl" aria-hidden="true">
                      {activity?.emoji ?? '•'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold">{activity?.label ?? 'Atividade'}</p>
                      <p className="text-xs text-ink-soft">
                        {activity?.goal} · {formatDayMonth(completion.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="success"
                      className="flex-1"
                      onClick={() =>
                        dispatch({ type: 'learning/approve', completionId: completion.id })
                      }
                    >
                      Aprovar <span aria-hidden="true">⭐</span>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        dispatch({ type: 'learning/reject', completionId: completion.id })
                      }
                    >
                      Ainda não
                    </Button>
                  </div>
                </Card>
              )
            })}
          </ul>
        </Section>
      )}
    </div>
  )
}

function Header({ count }: { count?: number }) {
  return (
    <header className="px-1">
      <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Aprovações</h1>
      <p className="text-sm font-bold text-ink-soft">
        {count ? `${count} ${count === 1 ? 'pedido' : 'pedidos'} à espera.` : 'Sem pedidos.'}
      </p>
    </header>
  )
}
