import { useMemo, useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Field, Select, TextInput } from '../ui/Field'
import { SHARE_CATEGORIES, SPEND_CATEGORIES } from '../../data/defaults'
import { formatEuro, parseMoneyInput, roundMoney } from '../../utils/money'
import { goalProgress, saveBreakdown, walletBalances, weeksOfSaving } from '../../utils/scoring'
import type { TransactionType, WalletId } from '../../types'
import { cn } from '../../utils/cn'

/** As operações possíveis em cada cofrinho. */
type Operation = 'spend' | 'share_use' | 'transfer'

const OPERATIONS: Record<WalletId, { id: Operation; label: string; emoji: string; hint: string }[]> = {
  spend: [
    { id: 'spend', label: 'Gastar', emoji: '🛍️', hint: 'Comprou alguma coisa com este dinheiro.' },
    { id: 'transfer', label: 'Passar para outro cofrinho', emoji: '🔁', hint: 'Mudar de ideias e guardar ou partilhar.' },
  ],
  save: [
    { id: 'transfer', label: 'Levantar para Gastar', emoji: '🔁', hint: 'Sai da poupança e fica disponível para escolhas.' },
    { id: 'spend', label: 'Gastar diretamente', emoji: '🛍️', hint: 'Comprou algo com o dinheiro guardado.' },
  ],
  share: [
    { id: 'share_use', label: 'Usar para partilhar', emoji: '💝', hint: 'Ofereceu, doou ou ajudou alguém.' },
    { id: 'transfer', label: 'Passar para outro cofrinho', emoji: '🔁', hint: 'Raramente é preciso, mas é possível.' },
  ],
}

interface WalletActionModalProps {
  walletId: WalletId
  onClose: () => void
}

/**
 * Tirar dinheiro de um cofrinho.
 *
 * O "Guardar" é tratado de forma diferente dos outros: não está bloqueado, mas
 * mostra sempre a consequência de mexer na parte comprometida com o objetivo.
 */
export function WalletActionModal({ walletId, onClose }: WalletActionModalProps) {
  const { state, dispatch } = useApp()
  const wallet = state.wallets.find((item) => item.id === walletId)!
  const balances = useMemo(() => walletBalances(state.transactions), [state.transactions])
  const goal = state.savingsGoals.find((item) => item.active)

  const operations = OPERATIONS[walletId]
  const [operation, setOperation] = useState<Operation>(operations[0].id)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [toWallet, setToWallet] = useState<WalletId>(walletId === 'spend' ? 'save' : 'spend')
  const [confirmNegative, setConfirmNegative] = useState(false)

  const parsed = parseMoneyInput(amount)
  const balance = balances[walletId]
  const resulting = roundMoney(balance - (parsed ?? 0))
  const categories = walletId === 'share' && operation === 'share_use' ? SHARE_CATEGORIES : SPEND_CATEGORIES

  const breakdown = saveBreakdown(balance, goal?.price)
  const eatsIntoReserve =
    walletId === 'save' && parsed !== null && parsed > breakdown.free && breakdown.reserved > 0
  const savePercent = state.wallets.find((item) => item.id === 'save')?.percent ?? 40
  const progressAfter = goal ? goalProgress(goal.price, Math.max(resulting, 0)) : null

  const valid = parsed !== null && parsed > 0 && (description.trim() || category).length > 0

  const commit = () => {
    if (parsed === null) return
    const type: TransactionType = operation === 'transfer' ? 'transfer' : operation
    dispatch({
      type: 'transaction/add',
      transaction: {
        amount: operation === 'transfer' ? parsed : -parsed,
        type,
        wallet: walletId,
        toWallet: operation === 'transfer' ? toWallet : undefined,
        category: operation === 'transfer' ? undefined : category || undefined,
        description:
          description.trim() ||
          (operation === 'transfer'
            ? `Passou para ${state.wallets.find((item) => item.id === toWallet)?.label}`
            : category),
      },
    })
    onClose()
  }

  const submit = () => {
    if (!valid) return
    if (resulting < 0) {
      setConfirmNegative(true)
      return
    }
    commit()
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={`${wallet.label}: tirar dinheiro`}
        emoji={wallet.emoji}
        footer={
          <>
            <Button className="flex-1" size="lg" disabled={!valid} onClick={submit}>
              Registar
            </Button>
            <Button variant="ghost" size="lg" onClick={onClose}>
              Cancelar
            </Button>
          </>
        }
      >
        <div className="rounded-2xl bg-cloud p-3.5">
          <p className="text-sm font-bold text-ink-soft">Saldo atual</p>
          <p className="text-2xl font-black tabular-nums">{formatEuro(balance)}</p>
          {walletId === 'save' && (
            <p className="mt-1 text-xs text-ink-soft">
              {goal ? (
                <>
                  <strong>{formatEuro(breakdown.reserved)}</strong> comprometidos com{' '}
                  {goal.emoji} {goal.name} · <strong>{formatEuro(breakdown.free)}</strong> livres
                </>
              ) : (
                'Sem objetivo definido — está tudo livre.'
              )}
            </p>
          )}
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-bold text-ink-soft">O que aconteceu?</legend>
          <div className="space-y-2">
            {operations.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setOperation(item.id)}
                aria-pressed={operation === item.id}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 transition',
                  operation === item.id
                    ? 'bg-brand-50 ring-2 ring-brand-500'
                    : 'bg-paper ring-black/10 hover:bg-cloud',
                )}
              >
                <span className="text-2xl" aria-hidden="true">
                  {item.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-extrabold">{item.label}</span>
                  <span className="block text-xs text-ink-soft">{item.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <Field label="Quanto? (€)">
          <TextInput
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder="5,00"
          />
        </Field>

        {operation === 'transfer' ? (
          <Field label="Para que cofrinho?">
            <Select value={toWallet} onChange={(event) => setToWallet(event.target.value as WalletId)}>
              {state.wallets
                .filter((item) => item.id !== walletId)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label} — {formatEuro(balances[item.id])}
                  </option>
                ))}
            </Select>
          </Field>
        ) : (
          <fieldset>
            <legend className="mb-2 text-sm font-bold text-ink-soft">Em quê?</legend>
            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setCategory(item.label === category ? '' : item.label)}
                  aria-pressed={category === item.label}
                  className={cn(
                    'min-h-11 rounded-2xl px-3.5 text-sm font-bold ring-1 transition',
                    category === item.label
                      ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-500'
                      : 'bg-cloud text-ink-soft ring-black/10',
                  )}
                >
                  <span aria-hidden="true">{item.emoji} </span>
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <Field label="Descrição" hint="Aparece no histórico do Nicolas — vale a pena ser concreto.">
          <TextInput
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={category ? `Ex.: ${category.toLowerCase()} na loja` : 'Ex.: cromos na papelaria'}
            maxLength={80}
          />
        </Field>

        {eatsIntoReserve && progressAfter && (
          <div className="rounded-2xl bg-star-50 p-3.5 ring-1 ring-star-100">
            <p className="font-extrabold text-star-600">
              <span aria-hidden="true">🤔 </span>Isto mexe na poupança do objetivo
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Depois deste movimento ficam <strong>{formatEuro(Math.max(resulting, 0))}</strong>{' '}
              guardados e faltam <strong>{formatEuro(progressAfter.missing)}</strong> para{' '}
              {goal?.emoji} {goal?.name} — cerca de{' '}
              <strong>
                {weeksOfSaving(progressAfter.missing, state.settings.allowance, savePercent)} semanas
              </strong>{' '}
              ao ritmo da semanada.
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              Pode fazer-se — mas vale a pena decidir com o Nicolas, não por ele.
            </p>
          </div>
        )}

        <p className="rounded-2xl bg-cloud p-3 text-sm text-ink-soft">
          Saldo de <strong>{wallet.label}</strong> depois:{' '}
          <strong className={resulting < 0 ? 'text-berry-700' : 'text-ink'}>
            {formatEuro(resulting)}
          </strong>
        </p>
      </Modal>

      <ConfirmDialog
        open={confirmNegative}
        title="Saldo negativo"
        emoji="⚠️"
        tone="danger"
        description={
          <>
            Este movimento deixa o cofrinho com <strong>{formatEuro(resulting)}</strong>. Confirmam
            mesmo assim?
          </>
        }
        confirmLabel="Confirmar"
        onConfirm={() => {
          setConfirmNegative(false)
          commit()
        }}
        onCancel={() => setConfirmNegative(false)}
      />
    </>
  )
}
