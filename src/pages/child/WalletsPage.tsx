import { useMemo, useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { Card, Section } from '../../components/ui/Card'
import { WalletCard } from '../../components/child/WalletCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { TransactionList } from '../../components/ui/TransactionList'
import { formatEuro } from '../../utils/money'
import {
  saveBreakdown,
  totalBalance,
  totalSpent,
  walletBalances,
  walletTransactions,
  weekMoney,
} from '../../utils/scoring'
import type { WalletId } from '../../types'
import { cn } from '../../utils/cn'

export function WalletsPage() {
  const { state } = useApp()
  const balances = useMemo(() => walletBalances(state.transactions), [state.transactions])
  const money = weekMoney(state)
  const goal = state.savingsGoals.find((item) => item.active)
  const [openWallet, setOpenWallet] = useState<WalletId | null>(null)

  const breakdown = saveBreakdown(balances.save, goal?.price)

  return (
    <div className="space-y-7">
      <header className="px-1">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Os meus cofrinhos</h1>
        <p className="text-sm font-bold text-ink-soft">
          Tenho {formatEuro(totalBalance(state.transactions))} no total.
        </p>
      </header>

      <Section title="Esta semana" emoji="💰" hint="A semanada não depende das estrelas.">
        <Card className="space-y-2.5">
          <Row label="Semanada" value={money.allowance} emoji="📅" />
          <Row label="Trabalhos extra aprovados" value={money.extras} emoji="🧹" />
          <div className="border-t border-black/10 pt-2.5">
            <Row label="Total da semana" value={money.total} emoji="✨" strong />
          </div>
          <p className="text-xs text-ink-soft">
            Este dinheiro entra nos cofrinhos quando a semana for fechada.
          </p>
        </Card>
      </Section>

      <Section title="Cofrinhos" emoji="🐷" hint="Toca num cofrinho para veres o que entrou e saiu.">
        <div className="grid gap-3 sm:grid-cols-3">
          {state.wallets.map((wallet) => {
            const movements = walletTransactions(state.transactions, wallet.id)
            const spent = totalSpent(state.transactions, wallet.id)
            const isOpen = openWallet === wallet.id
            return (
              <div key={wallet.id} className="space-y-2">
                <WalletCard
                  wallet={wallet}
                  balance={balances[wallet.id]}
                  reserved={wallet.id === 'save' ? breakdown.reserved : undefined}
                  goalName={wallet.id === 'save' ? goal?.name : undefined}
                />
                <button
                  type="button"
                  onClick={() => setOpenWallet(isOpen ? null : wallet.id)}
                  aria-expanded={isOpen}
                  className={cn(
                    'min-h-11 w-full rounded-2xl px-3 text-sm font-bold ring-1 transition',
                    isOpen
                      ? 'bg-brand-50 text-brand-700 ring-brand-100'
                      : 'bg-paper text-ink-soft ring-black/10 hover:bg-cloud',
                  )}
                >
                  {isOpen ? 'Fechar' : `Ver movimentos (${movements.length})`}
                  {spent > 0 && !isOpen && (
                    <span className="ml-1 text-berry-700">· já saíram {formatEuro(spent)}</span>
                  )}
                </button>

                {isOpen && (
                  <Card className="animate-rise-fade">
                    {movements.length === 0 ? (
                      <p className="text-sm text-ink-soft">
                        Ainda não há movimentos neste cofrinho.
                      </p>
                    ) : (
                      <TransactionList
                        transactions={movements}
                        wallets={state.wallets}
                        perspective={wallet.id}
                      />
                    )}
                  </Card>
                )}
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="Últimos movimentos" emoji="🧾">
        {state.transactions.length === 0 ? (
          <EmptyState
            emoji="🪙"
            title="Ainda não há movimentos"
            description="Quando a primeira semana for fechada, o dinheiro aparece aqui."
          />
        ) : (
          <Card>
            <TransactionList
              transactions={[...state.transactions].reverse().slice(0, 12)}
              wallets={state.wallets}
            />
          </Card>
        )}
      </Section>
    </div>
  )
}

function Row({
  label,
  value,
  emoji,
  strong = false,
}: {
  label: string
  value: number
  emoji: string
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? 'font-extrabold' : 'font-bold text-ink-soft'}>
        <span aria-hidden="true">{emoji} </span>
        {label}
      </span>
      <span
        className={
          strong ? 'text-2xl font-black text-coin-700 tabular-nums' : 'text-lg font-black tabular-nums'
        }
      >
        {formatEuro(value)}
      </span>
    </div>
  )
}
