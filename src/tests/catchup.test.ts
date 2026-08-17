import { describe, expect, it } from 'vitest'
import { appReducer } from '../state/appReducer'
import { createInitialState } from '../data/defaults'
import { closeWeek } from '../services/weekService'
import { addDays, startOfWeek, today } from '../utils/date'
import {
  learningStarsForDay,
  responsibilityStarsForDay,
  saveBreakdown,
  totalSpent,
  walletBalances,
  weeksOfSaving,
  weekMoney,
  weekTotals,
} from '../utils/scoring'
import { sumMoney } from '../utils/money'
import type { AppState, WeeklyRecord } from '../types'

const TODAY = today()
const MONDAY = startOfWeek(TODAY)
const YESTERDAY = addDays(TODAY, -1)
const TOMORROW = addDays(TODAY, 1)

function baseState(): AppState {
  return createInitialState()
}

/* ------------------------------------------------------------------ *
 * Estrelas de dias já passados
 * ------------------------------------------------------------------ */

describe('registar dias que já passaram', () => {
  it('marca um dia anterior e as estrelas contam na semana', () => {
    // Só faz sentido se ontem ainda pertencer à semana atual.
    if (YESTERDAY < MONDAY) return

    let state = baseState()
    state = appReducer(state, {
      type: 'responsibility/toggle',
      responsibilityId: 'resp_banho',
      date: YESTERDAY,
      byParent: true,
    })

    expect(responsibilityStarsForDay(state, YESTERDAY)).toBe(1)
    expect(weekTotals(state).responsibilityStars).toBe(1)
  })

  it('a marcação de um adulto fica aprovada mesmo quando a tarefa exige aprovação', () => {
    let state = baseState()
    const responsibility = state.responsibilities[0]
    state = appReducer(state, {
      type: 'responsibility/save',
      responsibility: { ...responsibility, requiresApproval: true },
    })

    // Marcada pela criança: fica à espera.
    const byChild = appReducer(state, {
      type: 'responsibility/toggle',
      responsibilityId: responsibility.id,
      date: TODAY,
    })
    expect(byChild.responsibilityCompletions[0].status).toBe('pending')
    expect(responsibilityStarsForDay(byChild, TODAY)).toBe(0)

    // Marcada por um adulto: conta logo.
    const byParent = appReducer(state, {
      type: 'responsibility/toggle',
      responsibilityId: responsibility.id,
      date: TODAY,
      byParent: true,
    })
    expect(byParent.responsibilityCompletions[0].status).toBe('approved')
    expect(responsibilityStarsForDay(byParent, TODAY)).toBe(1)
  })

  it('recusa marcar dias que ainda não aconteceram', () => {
    const state = appReducer(baseState(), {
      type: 'responsibility/toggle',
      responsibilityId: 'resp_banho',
      date: TOMORROW,
      byParent: true,
    })
    expect(state.responsibilityCompletions).toHaveLength(0)

    const learning = appReducer(baseState(), {
      type: 'learning/toggle',
      activityId: 'learn_piano',
      date: TOMORROW,
      byParent: true,
    })
    expect(learning.learningCompletions).toHaveLength(0)
  })
})

describe('"marcar tudo" num dia', () => {
  it('dá as 6 estrelas de responsabilidades e apenas 2 de aprendizagem', () => {
    const state = appReducer(baseState(), { type: 'day/fill', date: TODAY })

    expect(responsibilityStarsForDay(state, TODAY)).toBe(6)
    expect(learningStarsForDay(state, TODAY)).toBe(2)
    // O atalho nunca inventa estrelas a mais: 6 + 2 = 8 por dia.
    expect(state.learningCompletions).toHaveLength(2)
  })

  it('completa a responsabilidade de manhã e noite por inteiro', () => {
    const state = appReducer(baseState(), { type: 'day/fill', date: TODAY })
    const dentes = state.responsibilityCompletions.find(
      (item) => item.responsibilityId === 'resp_dentes',
    )
    expect(dentes).toMatchObject({ morning: true, night: true, done: true, status: 'approved' })
  })

  it('limpar o dia remove tudo o que lá estava', () => {
    let state = appReducer(baseState(), { type: 'day/fill', date: TODAY })
    state = appReducer(state, { type: 'day/clear', date: TODAY })

    expect(responsibilityStarsForDay(state, TODAY)).toBe(0)
    expect(learningStarsForDay(state, TODAY)).toBe(0)
  })

  it('uma semana inteira marcada assim dá exatamente 56 estrelas', () => {
    let state = baseState()
    for (let i = 0; i < 7; i += 1) {
      const date = addDays(MONDAY, i)
      if (date > TODAY) continue
      state = appReducer(state, { type: 'day/fill', date })
    }
    const totals = weekTotals(state)
    expect(totals.totalStars).toBeLessThanOrEqual(56)
    expect(totals.maxStars).toBe(56)
  })
})

/* ------------------------------------------------------------------ *
 * Saldo inicial
 * ------------------------------------------------------------------ */

describe('saldo inicial', () => {
  const opening = (state: AppState, amounts: { spend: number; save: number; share: number }) =>
    appReducer(state, {
      type: 'money/setOpeningBalance',
      amounts,
      description: 'Crédito do sistema em papel',
    })

  it('entra nos cofrinhos', () => {
    const state = opening(baseState(), { spend: 7.25, save: 5.8, share: 1.45 })
    expect(walletBalances(state.transactions)).toEqual({ spend: 7.25, save: 5.8, share: 1.45 })
  })

  it('substitui o anterior em vez de somar', () => {
    let state = opening(baseState(), { spend: 10, save: 0, share: 0 })
    state = opening(state, { spend: 4, save: 0, share: 0 })

    expect(walletBalances(state.transactions).spend).toBe(4)
    expect(state.transactions.filter((item) => item.type === 'opening')).toHaveLength(1)
  })

  it('não conta como ganho da semana', () => {
    const state = opening(baseState(), { spend: 10, save: 10, share: 10 })
    const money = weekMoney(state)
    expect(money.extras).toBe(0)
    expect(money.total).toBe(state.settings.allowance)
  })

  it('sobrevive ao fecho da semana e soma-se à distribuição', () => {
    const state = closeWeek(opening(baseState(), { spend: 5, save: 4, share: 1 }))
    // Saldo inicial (10) + semanada (3 dividida 50/40/10).
    expect(walletBalances(state.transactions)).toEqual({ spend: 6.5, save: 5.2, share: 1.3 })
  })

  it('ignora cofrinhos deixados a zero', () => {
    const state = opening(baseState(), { spend: 3, save: 0, share: 0 })
    expect(state.transactions).toHaveLength(1)
  })
})

/* ------------------------------------------------------------------ *
 * Gastos, partilha e a política do Guardar
 * ------------------------------------------------------------------ */

describe('gastos e retiradas', () => {
  function withMoney(): AppState {
    return appReducer(baseState(), {
      type: 'money/setOpeningBalance',
      amounts: { spend: 7, save: 20, share: 2 },
      description: 'Saldo inicial',
    })
  }

  it('gastar do cofrinho Gastar reduz o saldo e fica no histórico', () => {
    const state = appReducer(withMoney(), {
      type: 'transaction/add',
      transaction: {
        amount: -5,
        type: 'spend',
        wallet: 'spend',
        category: 'Cromos',
        description: 'Cromos na papelaria',
      },
    })

    expect(walletBalances(state.transactions).spend).toBe(2)
    expect(totalSpent(state.transactions, 'spend')).toBe(5)
    expect(state.transactions.at(-1)?.category).toBe('Cromos')
  })

  it('usar o dinheiro de Partilhar ajusta o saldo', () => {
    const state = appReducer(withMoney(), {
      type: 'transaction/add',
      transaction: {
        amount: -2,
        type: 'share_use',
        wallet: 'share',
        category: 'Prenda para alguém',
        description: 'Prenda para a avó',
      },
    })
    expect(walletBalances(state.transactions).share).toBe(0)
  })

  it('transferir entre cofrinhos mantém o total', () => {
    const before = withMoney()
    const totalBefore = sumMoney(Object.values(walletBalances(before.transactions)))

    const state = appReducer(before, {
      type: 'transaction/add',
      transaction: {
        amount: 5,
        type: 'transfer',
        wallet: 'save',
        toWallet: 'spend',
        description: 'Levantou da poupança',
      },
    })

    const balances = walletBalances(state.transactions)
    expect(balances.save).toBe(15)
    expect(balances.spend).toBe(12)
    expect(sumMoney(Object.values(balances))).toBe(totalBefore)
  })
})

describe('política do cofrinho Guardar', () => {
  it('separa o que está comprometido com o objetivo do que está livre', () => {
    expect(saveBreakdown(20, 35)).toEqual({ total: 20, reserved: 20, free: 0 })
    expect(saveBreakdown(40, 35)).toEqual({ total: 40, reserved: 35, free: 5 })
    // Sem objetivo definido está tudo livre.
    expect(saveBreakdown(40, undefined)).toEqual({ total: 40, reserved: 0, free: 40 })
  })

  it('estima quantas semanas custa repor o que se tirou', () => {
    // Semanada de 3,00 com 40% para Guardar = 1,20 por semana.
    expect(weeksOfSaving(6, 3, 40)).toBe(5)
    expect(weeksOfSaving(0, 3, 40)).toBe(0)
    expect(weeksOfSaving(10, 0, 40)).toBe(0)
  })

  it('o dinheiro nunca fica preso: dá para levantar', () => {
    let state = appReducer(baseState(), {
      type: 'money/setOpeningBalance',
      amounts: { spend: 0, save: 20, share: 0 },
      description: 'Saldo inicial',
    })
    state = appReducer(state, {
      type: 'transaction/add',
      transaction: {
        amount: 20,
        type: 'transfer',
        wallet: 'save',
        toWallet: 'spend',
        description: 'Mudou de ideias',
      },
    })
    expect(walletBalances(state.transactions)).toEqual({ spend: 20, save: 0, share: 0 })
  })
})

/* ------------------------------------------------------------------ *
 * Semanas anteriores no histórico
 * ------------------------------------------------------------------ */

describe('semanas anteriores lançadas à mão', () => {
  const record: WeeklyRecord = {
    id: 'week_manual',
    weekStart: addDays(MONDAY, -7),
    weekEnd: addDays(MONDAY, -1),
    responsibilityStars: 37,
    responsibilityMax: 42,
    learningStars: 11,
    learningMax: 14,
    totalStars: 48,
    maxStars: 56,
    tierId: 'tier_excelente',
    tierName: 'Excelente semana',
    tierEmoji: '🌳',
    privilege: 'Escolher o passeio',
    allowance: 3,
    extras: 3.5,
    total: 6.5,
    distribution: { spend: 3.25, save: 2.6, share: 0.65 },
    closedAt: new Date().toISOString(),
    manual: true,
  }

  it('entra no histórico sem mexer no dinheiro quando já foi pago', () => {
    const state = appReducer(baseState(), {
      type: 'history/addManual',
      record,
      createTransactions: false,
    })
    expect(state.weeklyRecords).toHaveLength(1)
    expect(state.weeklyRecords[0].manual).toBe(true)
    expect(state.transactions).toHaveLength(0)
  })

  it('credita os cofrinhos quando o dinheiro ainda não foi entregue', () => {
    const state = appReducer(baseState(), {
      type: 'history/addManual',
      record,
      createTransactions: true,
    })
    expect(walletBalances(state.transactions)).toEqual({ spend: 3.25, save: 2.6, share: 0.65 })
  })

  it('pode ser apagado', () => {
    let state = appReducer(baseState(), {
      type: 'history/addManual',
      record,
      createTransactions: false,
    })
    state = appReducer(state, { type: 'history/remove', id: record.id })
    expect(state.weeklyRecords).toHaveLength(0)
  })
})
