import { useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { Card, Section } from '../ui/Card'
import { Button } from '../ui/Button'
import { Field, TextInput } from '../ui/Field'
import { formatEuro, splitByPercent } from '../../utils/money'
import type { WalletId } from '../../types'
import { cn } from '../../utils/cn'

export function WalletSettings() {
  const { state, dispatch } = useApp()
  const [percents, setPercents] = useState<Record<WalletId, string>>(() => ({
    spend: String(state.wallets.find((wallet) => wallet.id === 'spend')?.percent ?? 50),
    save: String(state.wallets.find((wallet) => wallet.id === 'save')?.percent ?? 40),
    share: String(state.wallets.find((wallet) => wallet.id === 'share')?.percent ?? 10),
  }))
  const [saved, setSaved] = useState(false)

  const numbers: Record<WalletId, number> = {
    spend: Number(percents.spend) || 0,
    save: Number(percents.save) || 0,
    share: Number(percents.share) || 0,
  }
  const total = numbers.spend + numbers.save + numbers.share
  const valid = total === 100

  const example = splitByPercent(
    state.settings.allowance,
    state.wallets.map((wallet) => ({ id: wallet.id, percent: numbers[wallet.id] })),
  )

  return (
    <Section
      title="Cofrinhos"
      emoji="🐷"
      hint="A soma das percentagens tem de ser exatamente 100%."
    >
      <Card className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {state.wallets.map((wallet) => (
            <Field key={wallet.id} label={`${wallet.emoji} ${wallet.label} (%)`}>
              <TextInput
                value={percents[wallet.id]}
                inputMode="numeric"
                onChange={(event) => {
                  setSaved(false)
                  setPercents((current) => ({ ...current, [wallet.id]: event.target.value }))
                }}
              />
            </Field>
          ))}
        </div>

        <p
          className={cn(
            'rounded-2xl p-3 text-sm font-bold',
            valid ? 'bg-grow-50 text-grow-700' : 'bg-berry-50 text-berry-700',
          )}
          role="status"
        >
          Total: {total}% {valid ? '✓' : '— tem de dar 100%'}
        </p>

        {valid && (
          <p className="text-xs text-ink-soft">
            Exemplo com a semanada de {formatEuro(state.settings.allowance)}: Gastar{' '}
            {formatEuro(example.spend)} · Guardar {formatEuro(example.save)} · Partilhar{' '}
            {formatEuro(example.share)}.
          </p>
        )}

        <Button
          disabled={!valid}
          onClick={() => {
            dispatch({ type: 'wallets/percent', percents: numbers })
            setSaved(true)
          }}
        >
          Guardar percentagens
        </Button>
        {saved && (
          <p className="text-sm font-bold text-grow-700" role="status">
            ✓ Percentagens guardadas.
          </p>
        )}
      </Card>
    </Section>
  )
}
