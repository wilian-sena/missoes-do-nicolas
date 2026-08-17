import type { Wallet } from '../../types'
import { formatEuro } from '../../utils/money'
import { cn } from '../../utils/cn'

const TONES: Record<string, string> = {
  spend: 'from-coin-100 to-coin-50 text-coin-700',
  save: 'from-grow-100 to-grow-50 text-grow-700',
  share: 'from-berry-50 to-white text-berry-700',
}

interface WalletCardProps {
  wallet: Wallet
  balance: number
  /** Mostra moedas a cair (usado no fecho da semana). */
  animateCoins?: boolean
  incoming?: number
  /** Parte do saldo comprometida com o objetivo (só faz sentido em "Guardar"). */
  reserved?: number
  goalName?: string
}

export function WalletCard({
  wallet,
  balance,
  animateCoins = false,
  incoming,
  reserved,
  goalName,
}: WalletCardProps) {
  const free = typeof reserved === 'number' ? Math.max(balance - reserved, 0) : undefined

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br p-4 ring-1 ring-black/5',
        TONES[wallet.id] ?? 'from-cloud to-white text-ink',
      )}
    >
      {animateCoins && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="animate-coin-drop absolute top-2 text-xl"
              style={{ left: `${25 + index * 22}%`, animationDelay: `${index * 220}ms` }}
            >
              🪙
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden="true">
          {wallet.emoji}
        </span>
        <p className="text-base font-extrabold">{wallet.label}</p>
        <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold">
          {wallet.percent}%
        </span>
      </div>

      <p className="mt-2 text-3xl font-black text-ink tabular-nums">{formatEuro(balance)}</p>
      {typeof incoming === 'number' && incoming > 0 && (
        <p className="text-sm font-bold">+ {formatEuro(incoming)} esta semana</p>
      )}

      {typeof reserved === 'number' && reserved > 0 ? (
        <p className="mt-1 text-xs font-bold">
          <span className="text-grow-700">🔒 {formatEuro(reserved)} para {goalName ?? 'o objetivo'}</span>
          {typeof free === 'number' && free > 0 && (
            <span className="text-ink-soft"> · {formatEuro(free)} livres</span>
          )}
        </p>
      ) : (
        <p className="mt-1 text-xs text-ink-soft">{wallet.description}</p>
      )}
    </div>
  )
}
