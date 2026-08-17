import { useMemo, useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { Card, Section } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Field, EmojiPicker, TextInput } from '../../components/ui/Field'
import { EmptyState } from '../../components/ui/EmptyState'
import { Celebration } from '../../components/ui/Celebration'
import { GoalCard } from '../../components/child/GoalCard'
import { GOAL_EMOJIS } from '../../data/defaults'
import { formatEuro, parseMoneyInput } from '../../utils/money'
import { goalProgress, walletBalances } from '../../utils/scoring'
import { createId } from '../../utils/id'
import { formatDateTime } from '../../utils/date'

export function GoalPage() {
  const { state, dispatch } = useApp()
  const balances = useMemo(() => walletBalances(state.transactions), [state.transactions])
  const goal = state.savingsGoals.find((item) => item.active)
  const achieved = state.savingsGoals.filter((item) => item.completedAt)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [emoji, setEmoji] = useState(GOAL_EMOJIS[0])

  const progress = goal ? goalProgress(goal.price, balances.save) : null

  // Celebração única: acontece enquanto o objetivo estiver alcançado e ainda
  // não tiver sido celebrado. A marca fica no estado quando a animação acaba.
  const celebrate = Boolean(
    goal && progress?.reached && !goal.celebrated && state.settings.celebrationsEnabled,
  )

  const startEditing = () => {
    setName(goal?.name ?? '')
    setPrice(goal ? String(goal.price).replace('.', ',') : '')
    setEmoji(goal?.emoji ?? GOAL_EMOJIS[0])
    setEditing(true)
  }

  const save = () => {
    const parsedPrice = parseMoneyInput(price)
    if (!name.trim() || parsedPrice === null || parsedPrice <= 0) return
    dispatch({
      type: 'goal/save',
      goal: {
        id: goal?.id ?? createId('goal'),
        name: name.trim(),
        emoji,
        price: parsedPrice,
        createdAt: goal?.createdAt ?? new Date().toISOString(),
        active: true,
        celebrated: false,
      },
    })
    setEditing(false)
  }

  return (
    <div className="space-y-7">
      <Celebration
        show={celebrate}
        duration={2000}
        onDone={() => {
          if (goal) dispatch({ type: 'goal/celebrated', id: goal.id })
        }}
      />

      <header className="px-1">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">O meu objetivo</h1>
        <p className="text-sm font-bold text-ink-soft">
          Poupar é escolher esperar por algo maior. O cofrinho <strong>Guardar</strong> conta para
          aqui.
        </p>
      </header>

      {editing ? (
        <Card className="space-y-4">
          <Field label="O que queres alcançar?">
            <TextInput
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: LEGO da nave"
              maxLength={40}
            />
          </Field>
          <Field label="Quanto custa? (€)">
            <TextInput
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              inputMode="decimal"
              placeholder="35,00"
            />
          </Field>
          <EmojiPicker value={emoji} onChange={setEmoji} options={GOAL_EMOJIS} />
          <div className="flex gap-2">
            <Button onClick={save} size="lg" className="flex-1">
              Guardar objetivo
            </Button>
            <Button variant="ghost" size="lg" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </Card>
      ) : goal ? (
        <div className="space-y-3">
          <GoalCard goal={goal} savedBalance={balances.save} />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={startEditing}>
              <span aria-hidden="true">✏️</span> Mudar objetivo
            </Button>
          </div>
          {progress?.reached && (
            <p className="rounded-2xl bg-grow-50 p-4 text-sm font-bold text-grow-700 ring-1 ring-grow-100">
              <span aria-hidden="true">🎉 </span>
              Chegaste aos {formatEuro(goal.price)}! O dinheiro continua no cofrinho até os pais
              confirmarem a compra.
            </p>
          )}
        </div>
      ) : (
        <EmptyState
          emoji="🎯"
          title="Ainda não escolheste um objetivo"
          description="Escolhe uma coisa que queres muito e vamos poupar para lá chegar."
          action={
            <Button size="lg" onClick={startEditing}>
              Escolher objetivo
            </Button>
          }
        />
      )}

      {achieved.length > 0 && (
        <Section title="Objetivos alcançados" emoji="🏆">
          <Card>
            <ul className="divide-y divide-black/5">
              {achieved.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2.5">
                  <span className="text-2xl" aria-hidden="true">
                    {item.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{item.name}</p>
                    <p className="text-xs text-ink-soft">
                      {formatEuro(item.price)} ·{' '}
                      {item.completedAt ? formatDateTime(item.completedAt) : ''}
                    </p>
                  </div>
                  <span aria-hidden="true">✓</span>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      )}
    </div>
  )
}
