import { useMemo, useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { useToday } from '../../hooks/useToday'
import { Card, Section } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { CloseWeekModal } from '../../components/parent/CloseWeekModal'
import { WeekEditorModal } from '../../components/parent/WeekEditorModal'
import { OpeningBalanceModal } from '../../components/parent/OpeningBalanceModal'
import { GoalCard } from '../../components/child/GoalCard'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  nextTier,
  pendingApprovals,
  tierForStars,
  totalBalance,
  walletBalances,
  weekMoney,
  weekTotals,
} from '../../utils/scoring'
import { formatEuro } from '../../utils/money'
import { endOfWeek, formatWeekRange } from '../../utils/date'

interface SummaryPageProps {
  onGoTo: (tab: string) => void
}

export function SummaryPage({ onGoTo }: SummaryPageProps) {
  const { state, dispatch } = useApp()
  const today = useToday()
  const [closing, setClosing] = useState(false)
  const [editingWeek, setEditingWeek] = useState(false)
  const [openingBalance, setOpeningBalance] = useState(false)

  const totals = useMemo(() => weekTotals(state), [state])
  const tier = tierForStars(state.rewardTiers, totals.totalStars)
  const upcoming = nextTier(state.rewardTiers, totals.totalStars)
  const pending = useMemo(() => pendingApprovals(state), [state])
  const money = weekMoney(state)
  const balances = useMemo(() => walletBalances(state.transactions), [state.transactions])
  const goal = state.savingsGoals.find((item) => item.active)

  const weekIsOver = today > endOfWeek(state.currentWeekStart)
  const showOnboarding = !state.settings.onboardingDismissed && state.weeklyRecords.length === 0

  return (
    <div className="space-y-7">
      <header className="px-1">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Resumo</h1>
        <p className="text-sm font-bold text-ink-soft">
          Semana de {formatWeekRange(state.currentWeekStart)}
        </p>
      </header>

      {showOnboarding && (
        <div className="rounded-[var(--radius-card)] bg-brand-50 p-4 ring-1 ring-brand-100">
          <p className="font-extrabold text-brand-700">
            <span aria-hidden="true">👋 </span>Começaram a meio da semana?
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Nada do que o {state.profile.name} já fez se perde: registem os dias que já passaram e o
            dinheiro que ele já tinha.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setEditingWeek(true)}>
              📝 Registar o que já foi feito
            </Button>
            <Button variant="secondary" onClick={() => setOpeningBalance(true)}>
              🏁 Definir saldo inicial
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                dispatch({ type: 'settings/update', patch: { onboardingDismissed: true } })
              }
            >
              Já está
            </Button>
          </div>
        </div>
      )}

      {weekIsOver && (
        <div className="rounded-[var(--radius-card)] bg-star-50 p-4 ring-1 ring-star-100">
          <p className="font-extrabold text-star-600">
            <span aria-hidden="true">🏁 </span>Esta semana já terminou
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Fechem a semana para guardar o histórico, distribuir o dinheiro e começar a seguinte. As
            marcações dos dias da nova semana já estão a ser contadas à parte.
          </p>
        </div>
      )}

      <Section title="Estrelas" emoji="⭐">
        <Card className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <p className="text-4xl font-black">
              {totals.totalStars}
              <span className="text-xl text-ink-soft"> / {totals.maxStars}</span>
            </p>
            <p className="text-right">
              <span className="block text-xs font-bold text-ink-soft">Nível atual</span>
              <span className="text-base font-extrabold">
                <span aria-hidden="true">{tier?.emoji} </span>
                {tier?.name}
              </span>
            </p>
          </div>
          <ProgressBar value={totals.totalStars} max={totals.maxStars} size="lg" />
          <div className="grid gap-2 sm:grid-cols-2">
            <MiniStat
              label="Responsabilidades"
              value={`${totals.responsibilityStars} / ${totals.responsibilityMax}`}
            />
            <MiniStat
              label="Aprendizagem"
              value={`${totals.learningStars} / ${totals.learningMax}`}
            />
          </div>
          <p className="text-sm text-ink-soft">
            {upcoming
              ? `Faltam ${upcoming.starsMissing} ⭐ para "${upcoming.tier.name}": ${upcoming.tier.privilege}.`
              : 'Nível máximo atingido esta semana.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="lg" className="flex-1" onClick={() => setClosing(true)}>
              <span aria-hidden="true">🏁</span> Fechar semana
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setEditingWeek(true)}>
              <span aria-hidden="true">📝</span> Editar dias
            </Button>
          </div>
        </Card>
      </Section>

      <Section title="Por aprovar" emoji="✅">
        <div className="grid gap-3 sm:grid-cols-3">
          <PendingCard
            emoji="🧹"
            label="Responsabilidades"
            count={pending.responsibilities.length}
          />
          <PendingCard emoji="🌱" label="Aprendizagem" count={pending.learning.length} />
          <PendingCard emoji="🪙" label="Trabalhos extra" count={pending.extraJobs.length} />
        </div>
        {pending.total > 0 && (
          <Button variant="secondary" block size="lg" onClick={() => onGoTo('approvals')}>
            Ver {pending.total} {pending.total === 1 ? 'pedido' : 'pedidos'}
          </Button>
        )}
      </Section>

      <Section title="Dinheiro" emoji="💰">
        <Card className="space-y-2.5">
          <Row label="Semanada" value={formatEuro(money.allowance)} />
          <Row label="Trabalhos extra aprovados" value={formatEuro(money.extras)} />
          <div className="border-t border-black/10 pt-2.5">
            <Row label="Total da semana" value={formatEuro(money.total)} strong />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {state.wallets.map((wallet) => (
              <div key={wallet.id} className="rounded-2xl bg-cloud p-2.5 text-center">
                <p className="text-xs font-bold text-ink-soft">
                  <span aria-hidden="true">{wallet.emoji} </span>
                  {wallet.label}
                </p>
                <p className="text-base font-black">{formatEuro(balances[wallet.id])}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-soft">
            Saldo total: {formatEuro(totalBalance(state.transactions))}
          </p>
        </Card>
      </Section>

      <Section title="Objetivo de poupança" emoji="🎯">
        {goal ? (
          <GoalCard goal={goal} savedBalance={balances.save} />
        ) : (
          <EmptyState
            emoji="🎯"
            title="Sem objetivo definido"
            description="Podem criar um objetivo no separador Dinheiro ou no Modo Nicolas."
            action={
              <Button variant="secondary" onClick={() => onGoTo('money')}>
                Ir para Dinheiro
              </Button>
            }
          />
        )}
      </Section>

      <CloseWeekModal open={closing} onClose={() => setClosing(false)} />
      <WeekEditorModal open={editingWeek} onClose={() => setEditingWeek(false)} />
      {openingBalance && <OpeningBalanceModal onClose={() => setOpeningBalance(false)} />}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-cloud p-3">
      <p className="text-xs font-bold text-ink-soft">{label}</p>
      <p className="text-lg font-black">{value}</p>
    </div>
  )
}

function PendingCard({ emoji, label, count }: { emoji: string; label: string; count: number }) {
  return (
    <Card className={count > 0 ? 'ring-2 ring-star-400' : undefined}>
      <p className="text-sm font-bold text-ink-soft">
        <span aria-hidden="true">{emoji} </span>
        {label}
      </p>
      <p className="text-3xl font-black">{count}</p>
    </Card>
  )
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? 'font-extrabold' : 'font-bold text-ink-soft'}>{label}</span>
      <span className={strong ? 'text-2xl font-black text-coin-700' : 'text-lg font-black'}>
        {value}
      </span>
    </div>
  )
}
