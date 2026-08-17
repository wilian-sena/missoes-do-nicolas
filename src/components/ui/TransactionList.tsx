import type { Transaction, Wallet, WalletId } from '../../types'
import { formatEuro } from '../../utils/money'
import { formatDateTime } from '../../utils/date'
import { transactionMeta } from '../../utils/transactions'
import { transactionEffect } from '../../utils/scoring'
import { cn } from '../../utils/cn'

interface TransactionListProps {
  transactions: Transaction[]
  wallets: Wallet[]
  /** Quando definido, os valores são mostrados do ponto de vista deste cofrinho. */
  perspective?: WalletId
  onRemove?: (id: string) => void
}

/** Livro de movimentos. Cada linha diz o que foi, de onde saiu e quanto. */
export function TransactionList({
  transactions,
  wallets,
  perspective,
  onRemove,
}: TransactionListProps) {
  const walletLabel = (id?: WalletId) => wallets.find((item) => item.id === id)?.label

  return (
    <ul className="divide-y divide-black/5">
      {transactions.map((transaction) => {
        const meta = transactionMeta(transaction.type)
        const amount = perspective
          ? transactionEffect(transaction, perspective)
          : transaction.amount
        const isOut = amount < 0

        return (
          <li key={transaction.id} className="flex items-center gap-3 py-2.5">
            <span className="text-xl" aria-hidden="true">
              {meta.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">
                {transaction.description}
                {transaction.category && (
                  <span className="ml-1.5 rounded-full bg-cloud px-2 py-0.5 text-xs font-bold text-ink-soft">
                    {transaction.category}
                  </span>
                )}
              </p>
              <p className="text-xs text-ink-soft">
                {meta.label} · {walletLabel(transaction.wallet)}
                {transaction.toWallet ? ` → ${walletLabel(transaction.toWallet)}` : ''} ·{' '}
                {formatDateTime(transaction.date)}
              </p>
            </div>
            <span
              className={cn(
                'shrink-0 font-black tabular-nums',
                isOut ? 'text-berry-700' : 'text-grow-700',
              )}
            >
              {isOut ? '−' : '+'}
              {formatEuro(Math.abs(amount))}
            </span>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(transaction.id)}
                aria-label={`Apagar movimento ${transaction.description}`}
                className="shrink-0 rounded-full px-2 py-1 text-ink-soft hover:bg-black/5"
              >
                🗑️
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
