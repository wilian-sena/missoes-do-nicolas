import { useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { Card, Section } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ManualWeekModal } from '../../components/parent/ManualWeekModal'
import { formatEuro } from '../../utils/money'
import { formatWeekRange } from '../../utils/date'
import { cn } from '../../utils/cn'

export function HistoryPage() {
  const { state, dispatch } = useApp()
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const records = [...state.weeklyRecords].sort((a, b) => b.weekStart.localeCompare(a.weekStart))

  const addButton = (
    <Button variant="secondary" block size="lg" onClick={() => setAdding(true)}>
      <span aria-hidden="true">➕</span> Adicionar semana anterior
    </Button>
  )

  if (records.length === 0) {
    return (
      <div className="space-y-7">
        <Header />
        <EmptyState
          emoji="📅"
          title="Ainda não há semanas fechadas"
          description="Quando fecharem a primeira semana, o resumo fica guardado aqui. Também podem lançar à mão as semanas que já fizeram em papel."
        />
        {addButton}
        {adding && <ManualWeekModal onClose={() => setAdding(false)} />}
      </div>
    )
  }

  const chart = [...records].reverse().slice(-8)
  const chartMax = Math.max(...chart.map((record) => record.maxStars), 1)

  return (
    <div className="space-y-7">
      <Header count={records.length} />

      {addButton}

      <Section title="Evolução" emoji="📈" hint="Estrelas por semana.">
        <Card>
          <ul className="flex items-end justify-center gap-2">
            {chart.map((record) => (
              <li key={record.id} className="flex max-w-24 flex-1 flex-col items-center gap-1.5">
                <span className="text-sm font-black text-star-600">
                  <span aria-hidden="true">⭐</span> {record.totalStars}
                </span>
                <div className="flex h-28 w-full items-end justify-center rounded-xl bg-cloud p-1">
                  <div
                    className="w-full rounded-lg bg-star-400"
                    style={{ height: `${Math.max(6, (record.totalStars / chartMax) * 100)}%` }}
                  />
                </div>
                <span className="text-center text-[10px] leading-tight font-bold text-ink-soft">
                  {formatWeekRange(record.weekStart)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section title="Semanas" emoji="📚">
        <ul className="space-y-3">
          {records.map((record) => (
            <Card as="li" key={record.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-extrabold">
                    Semana {formatWeekRange(record.weekStart)}
                    {record.manual && (
                      <span className="ml-2 rounded-full bg-cloud px-2 py-0.5 align-middle text-xs font-bold text-ink-soft">
                        registo manual
                      </span>
                    )}
                  </p>
                  <p className="text-sm font-bold text-ink-soft">
                    <span aria-hidden="true">{record.tierEmoji} </span>
                    {record.tierName}
                  </p>
                </div>
                <span className="rounded-full bg-star-100 px-3 py-1.5 font-black text-star-600">
                  <span aria-hidden="true">⭐ </span>
                  {record.totalStars} / {record.maxStars}
                </span>
              </div>

              <ProgressBar value={record.totalStars} max={record.maxStars} />

              <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                <Stat label="Responsabilidades" value={`${record.responsibilityStars} / ${record.responsibilityMax}`} />
                <Stat label="Aprendizagem" value={`${record.learningStars} / ${record.learningMax}`} />
                <Stat label="Semanada" value={formatEuro(record.allowance)} />
                <Stat label="Trabalhos extra" value={formatEuro(record.extras)} />
                <Stat label="Total recebido" value={formatEuro(record.total)} highlight />
              </dl>

              <div className="rounded-2xl bg-cloud p-3 text-sm">
                <p className="font-bold text-ink">
                  Privilégio: <span className="font-extrabold">{record.privilege || '—'}</span>
                </p>
                {record.chosenPrivilege && (
                  <p className="text-ink-soft">Escolha: {record.chosenPrivilege}</p>
                )}
                <p className="mt-1 text-xs text-ink-soft">
                  Distribuição: Gastar {formatEuro(record.distribution.spend)} · Guardar{' '}
                  {formatEuro(record.distribution.save)} · Partilhar{' '}
                  {formatEuro(record.distribution.share)}
                </p>
              </div>

              {record.manual && (
                <Button size="sm" variant="ghost" onClick={() => setRemoving(record.id)}>
                  🗑️ Apagar registo
                </Button>
              )}
            </Card>
          ))}
        </ul>
      </Section>

      {adding && <ManualWeekModal onClose={() => setAdding(false)} />}

      <ConfirmDialog
        open={Boolean(removing)}
        title="Apagar registo manual?"
        emoji="🗑️"
        tone="danger"
        description="A semana sai do histórico. Os movimentos de dinheiro que tenham sido criados mantêm-se — se for preciso, apaguem-nos em Dinheiro."
        confirmLabel="Apagar"
        onConfirm={() => {
          if (removing) dispatch({ type: 'history/remove', id: removing })
          setRemoving(null)
        }}
        onCancel={() => setRemoving(null)}
      />
    </div>
  )
}

function Header({ count }: { count?: number }) {
  return (
    <header className="px-1">
      <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Histórico</h1>
      <p className="text-sm font-bold text-ink-soft">
        {count ? `${count} ${count === 1 ? 'semana guardada' : 'semanas guardadas'}.` : 'Sem semanas guardadas.'}
      </p>
    </header>
  )
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn('rounded-2xl p-2.5', highlight ? 'bg-coin-50' : 'bg-cloud')}>
      <dt className="text-xs font-bold text-ink-soft">{label}</dt>
      <dd className={cn('font-black', highlight && 'text-coin-700')}>{value}</dd>
    </div>
  )
}
