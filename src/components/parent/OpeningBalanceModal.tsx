import { useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Field, TextInput } from '../ui/Field'
import { formatEuro, parseMoneyInput, splitByPercent, sumMoney } from '../../utils/money'
import type { WalletId } from '../../types'
import { cn } from '../../utils/cn'

interface OpeningBalanceModalProps {
  onClose: () => void
}

/**
 * Saldo inicial — o dinheiro que a criança já tinha antes da app
 * (por exemplo, o crédito de um sistema em papel).
 *
 * Não é um ganho desta semana: não entra no total semanal nem é redistribuído
 * no fecho. E pode ser corrigido, porque substitui sempre o anterior.
 */
export function OpeningBalanceModal({ onClose }: OpeningBalanceModalProps) {
  const { state, dispatch } = useApp()
  const existing = state.transactions.filter((item) => item.type === 'opening')
  const existingTotal = sumMoney(existing.map((item) => item.amount))

  const [mode, setMode] = useState<'total' | 'detail'>('total')
  const [total, setTotal] = useState(existingTotal ? String(existingTotal).replace('.', ',') : '')
  const [detail, setDetail] = useState<Record<WalletId, string>>(() => {
    const byWallet = (id: WalletId) =>
      sumMoney(existing.filter((item) => item.wallet === id).map((item) => item.amount))
    return {
      spend: existingTotal ? String(byWallet('spend')).replace('.', ',') : '',
      save: existingTotal ? String(byWallet('save')).replace('.', ',') : '',
      share: existingTotal ? String(byWallet('share')).replace('.', ',') : '',
    }
  })
  const [description, setDescription] = useState(
    existing[0]?.description ?? 'Crédito do sistema em papel',
  )

  const parsedTotal = parseMoneyInput(total)
  const parsedDetail: Record<WalletId, number> = {
    spend: parseMoneyInput(detail.spend) ?? 0,
    save: parseMoneyInput(detail.save) ?? 0,
    share: parseMoneyInput(detail.share) ?? 0,
  }

  const amounts: Record<WalletId, number> =
    mode === 'detail'
      ? parsedDetail
      : parsedTotal === null
        ? { spend: 0, save: 0, share: 0 }
        : splitByPercent(
            parsedTotal,
            state.wallets.map((wallet) => ({ id: wallet.id, percent: wallet.percent })),
          )

  const sum = sumMoney(Object.values(amounts))
  const valid = sum > 0 && description.trim().length > 0

  return (
    <Modal
      open
      onClose={onClose}
      title="Saldo inicial"
      emoji="🏁"
      footer={
        <>
          <Button
            className="flex-1"
            size="lg"
            disabled={!valid}
            onClick={() => {
              dispatch({
                type: 'money/setOpeningBalance',
                amounts,
                description: description.trim(),
              })
              onClose()
            }}
          >
            Guardar saldo inicial
          </Button>
          <Button variant="ghost" size="lg" onClick={onClose}>
            Cancelar
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-soft">
        O dinheiro que o {state.profile.name} já tinha antes de começarem a usar a app. Não conta
        como ganho desta semana — é apenas o ponto de partida dos cofrinhos.
      </p>

      <div className="flex gap-2">
        <ModeButton active={mode === 'total'} onClick={() => setMode('total')} label="Valor total" />
        <ModeButton
          active={mode === 'detail'}
          onClick={() => setMode('detail')}
          label="Cofrinho a cofrinho"
        />
      </div>

      {mode === 'total' ? (
        <>
          <Field label="Quanto tinha ao todo? (€)">
            <TextInput
              value={total}
              onChange={(event) => setTotal(event.target.value)}
              inputMode="decimal"
              placeholder="14,50"
            />
          </Field>
          <p className="rounded-2xl bg-cloud p-3 text-sm text-ink-soft">
            Vai ser dividido pelas percentagens atuais:{' '}
            {state.wallets.map((wallet, index) => (
              <span key={wallet.id}>
                {index > 0 && ' · '}
                <strong>
                  {wallet.label} {formatEuro(amounts[wallet.id])}
                </strong>
              </span>
            ))}
          </p>
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {state.wallets.map((wallet) => (
            <Field key={wallet.id} label={`${wallet.emoji} ${wallet.label} (€)`}>
              <TextInput
                value={detail[wallet.id]}
                inputMode="decimal"
                placeholder="0,00"
                onChange={(event) =>
                  setDetail((current) => ({ ...current, [wallet.id]: event.target.value }))
                }
              />
            </Field>
          ))}
        </div>
      )}

      <Field label="Descrição">
        <TextInput
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={60}
        />
      </Field>

      <p className="rounded-2xl bg-coin-50 p-3 text-sm font-bold text-coin-700">
        Total a lançar: {formatEuro(sum)}
      </p>

      {existingTotal > 0 && (
        <p className="rounded-2xl bg-star-50 p-3 text-sm text-star-600">
          <span aria-hidden="true">⚠️ </span>Já existe um saldo inicial de{' '}
          <strong>{formatEuro(existingTotal)}</strong>. Guardar agora <strong>substitui</strong> esse
          valor — não soma.
        </p>
      )}
    </Modal>
  )
}

function ModeButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'min-h-11 flex-1 rounded-2xl px-3 text-sm font-bold ring-1 transition',
        active ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-500' : 'bg-cloud text-ink-soft ring-black/10',
      )}
    >
      {label}
    </button>
  )
}
