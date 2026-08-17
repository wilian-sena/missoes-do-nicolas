import { useMemo, useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { Card, Section } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmojiPicker, Field, Select, TextInput } from '../../components/ui/Field'
import { EmptyState } from '../../components/ui/EmptyState'
import { TransactionList } from '../../components/ui/TransactionList'
import { WalletCard } from '../../components/child/WalletCard'
import { GoalCard } from '../../components/child/GoalCard'
import { WalletActionModal } from '../../components/parent/WalletActionModal'
import { OpeningBalanceModal } from '../../components/parent/OpeningBalanceModal'
import { GOAL_EMOJIS } from '../../data/defaults'
import { formatEuro, parseMoneyInput, roundMoney } from '../../utils/money'
import { goalProgress, saveBreakdown, totalBalance, walletBalances } from '../../utils/scoring'
import { createId } from '../../utils/id'
import type { TransactionType, WalletId } from '../../types'

const MOVEMENT_TYPES: { value: TransactionType; label: string; sign: 'out' | 'in' | 'both' | 'move' }[] = [
  { value: 'spend', label: 'Gasto', sign: 'out' },
  { value: 'saving', label: 'Poupança (entrada extra)', sign: 'in' },
  { value: 'share_use', label: 'Usar o dinheiro de Partilhar', sign: 'out' },
  { value: 'transfer', label: 'Transferência entre cofrinhos', sign: 'move' },
  { value: 'adjustment', label: 'Ajuste manual dos pais', sign: 'both' },
]

export function MoneyPage() {
  const { state, dispatch } = useApp()
  const balances = useMemo(() => walletBalances(state.transactions), [state.transactions])
  const goal = state.savingsGoals.find((item) => item.active)
  const [movementOpen, setMovementOpen] = useState(false)
  const [openingOpen, setOpeningOpen] = useState(false)
  const [actionWallet, setActionWallet] = useState<WalletId | null>(null)
  const [goalOpen, setGoalOpen] = useState(false)
  const [buying, setBuying] = useState(false)
  const [removingTx, setRemovingTx] = useState<string | null>(null)

  const transactions = [...state.transactions].reverse()
  const progress = goal ? goalProgress(goal.price, balances.save) : null

  return (
    <div className="space-y-7">
      <header className="px-1">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Dinheiro</h1>
        <p className="text-sm font-bold text-ink-soft">
          Saldo total: {formatEuro(totalBalance(state.transactions))}
        </p>
      </header>

      <Section title="Cofrinhos" emoji="🐷" hint="Cada cofrinho tem o seu botão para registar saídas.">
        <div className="grid gap-3 sm:grid-cols-3">
          {state.wallets.map((wallet) => (
            <div key={wallet.id} className="space-y-2">
              <WalletCard
                wallet={wallet}
                balance={balances[wallet.id]}
                reserved={wallet.id === 'save' ? saveBreakdown(balances.save, goal?.price).reserved : undefined}
                goalName={wallet.id === 'save' ? goal?.name : undefined}
              />
              <Button
                variant="secondary"
                block
                onClick={() => setActionWallet(wallet.id)}
                disabled={balances[wallet.id] <= 0}
              >
                <span aria-hidden="true">➖</span> Tirar de {wallet.label}
              </Button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setOpeningOpen(true)}>
            <span aria-hidden="true">🏁</span> Definir saldo inicial
          </Button>
          <Button variant="ghost" onClick={() => setMovementOpen(true)}>
            <span aria-hidden="true">➕</span> Outro movimento
          </Button>
        </div>
      </Section>

      <Section title="Objetivo de poupança" emoji="🎯">
        {goal ? (
          <div className="space-y-3">
            <GoalCard goal={goal} savedBalance={balances.save} />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setGoalOpen(true)}>
                ✏️ Editar objetivo
              </Button>
              <Button
                variant="success"
                disabled={!progress?.reached}
                onClick={() => setBuying(true)}
              >
                🛒 Confirmar compra
              </Button>
              <Button variant="ghost" onClick={() => dispatch({ type: 'goal/remove', id: goal.id })}>
                🗑️ Remover
              </Button>
            </div>
            {!progress?.reached && (
              <p className="text-xs text-ink-soft">
                A compra só pode ser confirmada quando o cofrinho Guardar chegar a{' '}
                {formatEuro(goal.price)}. O dinheiro nunca sai sozinho.
              </p>
            )}
          </div>
        ) : (
          <EmptyState
            emoji="🎯"
            title="Sem objetivo definido"
            action={<Button onClick={() => setGoalOpen(true)}>Criar objetivo</Button>}
          />
        )}
      </Section>

      <Section title="Movimentações" emoji="🧾" hint="Todo o dinheiro que entrou e saiu.">
        {transactions.length === 0 ? (
          <EmptyState emoji="🪙" title="Ainda não há movimentos registados" />
        ) : (
          <Card>
            <TransactionList
              transactions={transactions}
              wallets={state.wallets}
              onRemove={setRemovingTx}
            />
          </Card>
        )}
      </Section>

      {movementOpen && <MovementModal onClose={() => setMovementOpen(false)} />}

      {openingOpen && <OpeningBalanceModal onClose={() => setOpeningOpen(false)} />}

      {actionWallet && (
        <WalletActionModal walletId={actionWallet} onClose={() => setActionWallet(null)} />
      )}

      {goalOpen && (
        <GoalModal
          onClose={() => setGoalOpen(false)}
          initial={
            goal ?? {
              id: createId('goal'),
              name: '',
              emoji: GOAL_EMOJIS[0],
              price: 0,
              createdAt: new Date().toISOString(),
              active: true,
              celebrated: false,
            }
          }
        />
      )}

      <ConfirmDialog
        open={buying}
        title="Confirmar compra"
        emoji="🛒"
        description={
          <>
            Confirmam que o objetivo <strong>{goal?.name}</strong> foi comprado por{' '}
            <strong>{formatEuro(goal?.price ?? 0)}</strong>? O valor sai do cofrinho Guardar.
          </>
        }
        confirmLabel="Sim, comprámos"
        onConfirm={() => {
          if (goal) dispatch({ type: 'goal/buy', id: goal.id })
          setBuying(false)
        }}
        onCancel={() => setBuying(false)}
      />

      <ConfirmDialog
        open={Boolean(removingTx)}
        title="Apagar movimento?"
        emoji="🗑️"
        tone="danger"
        description="O saldo dos cofrinhos é recalculado sem este movimento."
        confirmLabel="Apagar"
        onConfirm={() => {
          if (removingTx) dispatch({ type: 'transaction/remove', id: removingTx })
          setRemovingTx(null)
        }}
        onCancel={() => setRemovingTx(null)}
      />
    </div>
  )
}

function MovementModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useApp()
  const balances = walletBalances(state.transactions)

  const [type, setType] = useState<TransactionType>('spend')
  const [wallet, setWallet] = useState<WalletId>('spend')
  const [toWallet, setToWallet] = useState<WalletId>('save')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [direction, setDirection] = useState<'in' | 'out'>('in')
  const [confirmNegative, setConfirmNegative] = useState(false)

  const config = MOVEMENT_TYPES.find((item) => item.value === type)!
  const parsed = parseMoneyInput(amount)
  const effectiveWallet: WalletId = type === 'share_use' ? 'share' : wallet
  const valid =
    parsed !== null &&
    parsed > 0 &&
    description.trim().length > 0 &&
    (type !== 'transfer' || effectiveWallet !== toWallet)

  const signedAmount = (() => {
    if (parsed === null) return 0
    if (config.sign === 'out') return -parsed
    if (config.sign === 'in') return parsed
    if (config.sign === 'both') return direction === 'in' ? parsed : -parsed
    return parsed
  })()

  const resultingBalance =
    type === 'transfer'
      ? roundMoney(balances[effectiveWallet] - (parsed ?? 0))
      : roundMoney(balances[effectiveWallet] + signedAmount)

  const commit = () => {
    dispatch({
      type: 'transaction/add',
      transaction: {
        amount: type === 'transfer' ? (parsed ?? 0) : signedAmount,
        type,
        wallet: effectiveWallet,
        toWallet: type === 'transfer' ? toWallet : undefined,
        description: description.trim(),
      },
    })
    onClose()
  }

  const submit = () => {
    if (!valid) return
    if (resultingBalance < 0) {
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
        title="Registar movimento"
        emoji="🧾"
        footer={
          <>
            <Button className="flex-1" size="lg" disabled={!valid} onClick={submit}>
              Guardar movimento
            </Button>
            <Button variant="ghost" size="lg" onClick={onClose}>
              Cancelar
            </Button>
          </>
        }
      >
        <Field label="Tipo de movimento">
          <Select value={type} onChange={(event) => setType(event.target.value as TransactionType)}>
            {MOVEMENT_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>

        {type !== 'share_use' && (
          <Field label={type === 'transfer' ? 'Cofrinho de origem' : 'Cofrinho'}>
            <Select value={wallet} onChange={(event) => setWallet(event.target.value as WalletId)}>
              {state.wallets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label} — {formatEuro(balances[item.id])}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {type === 'transfer' && (
          <Field label="Cofrinho de destino">
            <Select
              value={toWallet}
              onChange={(event) => setToWallet(event.target.value as WalletId)}
            >
              {state.wallets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label} — {formatEuro(balances[item.id])}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {config.sign === 'both' && (
          <Field label="Entrada ou saída?">
            <Select
              value={direction}
              onChange={(event) => setDirection(event.target.value as 'in' | 'out')}
            >
              <option value="in">Entrada (+)</option>
              <option value="out">Saída (−)</option>
            </Select>
          </Field>
        )}

        <Field label="Valor (€)">
          <TextInput
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder="1,50"
          />
        </Field>

        <Field label="Descrição">
          <TextInput
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ex.: Cromos na papelaria"
            maxLength={80}
          />
        </Field>

        <p className="rounded-2xl bg-cloud p-3 text-sm text-ink-soft">
          Saldo de <strong>{state.wallets.find((item) => item.id === effectiveWallet)?.label}</strong>{' '}
          depois deste movimento:{' '}
          <strong className={resultingBalance < 0 ? 'text-berry-700' : 'text-ink'}>
            {formatEuro(resultingBalance)}
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
            Este movimento deixa o cofrinho com <strong>{formatEuro(resultingBalance)}</strong>.
            Confirmam mesmo assim?
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

function GoalModal({
  initial,
  onClose,
}: {
  initial: {
    id: string
    name: string
    emoji: string
    price: number
    createdAt: string
    active: boolean
    celebrated: boolean
  }
  onClose: () => void
}) {
  const { dispatch } = useApp()
  const [name, setName] = useState(initial.name)
  const [emoji, setEmoji] = useState(initial.emoji)
  const [price, setPrice] = useState(initial.price ? String(initial.price).replace('.', ',') : '')

  const parsed = parseMoneyInput(price)
  const valid = name.trim().length > 0 && parsed !== null && parsed > 0

  return (
    <Modal
      open
      onClose={onClose}
      title={initial.name ? 'Editar objetivo' : 'Novo objetivo'}
      emoji="🎯"
      footer={
        <>
          <Button
            className="flex-1"
            size="lg"
            disabled={!valid}
            onClick={() => {
              dispatch({
                type: 'goal/save',
                goal: { ...initial, name: name.trim(), emoji, price: parsed ?? 0 },
              })
              onClose()
            }}
          >
            Guardar
          </Button>
          <Button variant="ghost" size="lg" onClick={onClose}>
            Cancelar
          </Button>
        </>
      }
    >
      <Field label="Objetivo">
        <TextInput value={name} onChange={(event) => setName(event.target.value)} maxLength={40} />
      </Field>
      <Field label="Preço (€)">
        <TextInput
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          inputMode="decimal"
          placeholder="35,00"
        />
      </Field>
      <EmojiPicker value={emoji} onChange={setEmoji} options={GOAL_EMOJIS} />
    </Modal>
  )
}
