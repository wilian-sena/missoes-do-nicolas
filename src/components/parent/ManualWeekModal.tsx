import { useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Field, TextInput, Toggle } from '../ui/Field'
import { formatEuro, fromCents, parseMoneyInput, splitByPercent, toCents } from '../../utils/money'
import { addDays, endOfWeek, formatWeekRange, startOfWeek, today } from '../../utils/date'
import { tierForStars } from '../../utils/scoring'
import { createId } from '../../utils/id'
import type { WalletId, WeeklyRecord } from '../../types'

interface ManualWeekModalProps {
  onClose: () => void
}

/**
 * Lançar no histórico uma semana anterior — tipicamente as que a família já
 * tinha feito em papel antes de instalar a app.
 */
export function ManualWeekModal({ onClose }: ManualWeekModalProps) {
  const { state, dispatch } = useApp()

  const responsibilityMax = state.responsibilities.filter((item) => item.active).length * 7
  const learningMax = state.settings.maxLearningStarsPerDay * 7

  // Por omissão, a semana anterior à atual.
  const [weekStart, setWeekStart] = useState(() => addDays(state.currentWeekStart, -7))
  const [responsibilityStars, setResponsibilityStars] = useState('')
  const [learningStars, setLearningStars] = useState('')
  const [allowance, setAllowance] = useState(String(state.settings.allowance).replace('.', ','))
  const [extras, setExtras] = useState('')
  const [alreadyPaid, setAlreadyPaid] = useState(true)

  const resp = Math.max(0, Math.min(Number(responsibilityStars) || 0, responsibilityMax))
  const learn = Math.max(0, Math.min(Number(learningStars) || 0, learningMax))
  const totalStars = resp + learn
  const maxStars = responsibilityMax + learningMax
  const tier = tierForStars(state.rewardTiers, totalStars)

  const allowanceValue = parseMoneyInput(allowance) ?? 0
  const extrasValue = parseMoneyInput(extras) ?? 0
  const total = fromCents(toCents(allowanceValue) + toCents(extrasValue))
  const distribution = splitByPercent(
    total,
    state.wallets.map((wallet) => ({ id: wallet.id, percent: wallet.percent })),
  ) as Record<WalletId, number>

  const duplicated = state.weeklyRecords.some((record) => record.weekStart === weekStart)
  const inFuture = weekStart >= startOfWeek(today())
  const valid = !duplicated && !inFuture && (responsibilityStars !== '' || learningStars !== '')

  const save = () => {
    const record: WeeklyRecord = {
      id: createId('week'),
      weekStart,
      weekEnd: endOfWeek(weekStart),
      responsibilityStars: resp,
      responsibilityMax,
      learningStars: learn,
      learningMax,
      totalStars,
      maxStars,
      tierId: tier?.id ?? '',
      tierName: tier?.name ?? '—',
      tierEmoji: tier?.emoji ?? '⭐',
      privilege: tier?.privilege ?? '',
      allowance: allowanceValue,
      extras: extrasValue,
      total,
      distribution,
      closedAt: new Date().toISOString(),
      manual: true,
    }
    dispatch({ type: 'history/addManual', record, createTransactions: !alreadyPaid })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Adicionar semana anterior"
      emoji="📚"
      footer={
        <>
          <Button className="flex-1" size="lg" disabled={!valid} onClick={save}>
            Guardar no histórico
          </Button>
          <Button variant="ghost" size="lg" onClick={onClose}>
            Cancelar
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-soft">
        Para trazer para a app as semanas que já tinham feito em papel. O nível é calculado
        automaticamente a partir das estrelas.
      </p>

      <Field label="Semana (escolham um dia dessa semana)">
        <TextInput
          type="date"
          value={weekStart}
          max={addDays(startOfWeek(today()), -1)}
          onChange={(event) => {
            if (event.target.value) setWeekStart(startOfWeek(event.target.value))
          }}
        />
      </Field>
      <p className="-mt-2 text-xs font-bold text-ink-soft">
        Semana de {formatWeekRange(weekStart)}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Field label={`Responsabilidades (0–${responsibilityMax})`}>
          <TextInput
            value={responsibilityStars}
            inputMode="numeric"
            placeholder="0"
            onChange={(event) => setResponsibilityStars(event.target.value)}
          />
        </Field>
        <Field label={`Aprendizagem (0–${learningMax})`}>
          <TextInput
            value={learningStars}
            inputMode="numeric"
            placeholder="0"
            onChange={(event) => setLearningStars(event.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Semanada (€)">
          <TextInput
            value={allowance}
            inputMode="decimal"
            onChange={(event) => setAllowance(event.target.value)}
          />
        </Field>
        <Field label="Trabalhos extra (€)">
          <TextInput
            value={extras}
            inputMode="decimal"
            placeholder="0,00"
            onChange={(event) => setExtras(event.target.value)}
          />
        </Field>
      </div>

      <Toggle
        checked={alreadyPaid}
        onChange={setAlreadyPaid}
        label="Este dinheiro já foi entregue"
        description="Se já foi, entra só como histórico. Se não, é somado aos cofrinhos agora."
      />

      <div className="rounded-2xl bg-cloud p-3.5 text-sm">
        <p className="font-extrabold">
          ⭐ {totalStars} / {maxStars} · {tier?.emoji} {tier?.name}
        </p>
        <p className="mt-1 text-ink-soft">
          Total {formatEuro(total)} · Gastar {formatEuro(distribution.spend)} · Guardar{' '}
          {formatEuro(distribution.save)} · Partilhar {formatEuro(distribution.share)}
          {alreadyPaid && ' (não entra nos cofrinhos)'}
        </p>
      </div>

      {duplicated && (
        <p className="rounded-2xl bg-berry-50 p-3 text-sm font-bold text-berry-700" role="alert">
          Já existe uma semana guardada com esta data.
        </p>
      )}
      {inFuture && (
        <p className="rounded-2xl bg-berry-50 p-3 text-sm font-bold text-berry-700" role="alert">
          Escolham uma semana anterior à atual.
        </p>
      )}
    </Modal>
  )
}
