import { describe, expect, it } from 'vitest'
import { appReducer } from '../state/appReducer'
import { createInitialState } from '../data/defaults'
import { closeWeek, buildWeekClosePreview } from '../services/weekService'
import { formatEuro, splitByPercent, sumMoney } from '../utils/money'
import {
  tierForStars,
  totalBalance,
  walletBalances,
  weekExtrasEarned,
  weekTotals,
} from '../utils/scoring'
import { addDays, startOfWeek, today, weekDays } from '../utils/date'
import type { AppState } from '../types'

// Datas relativas à semana atual: os trabalhos extra são sempre registados na
// semana em que são aceites, por isso os testes acompanham o calendário real.
const TODAY = today()
const MONDAY = startOfWeek(TODAY)
const SUNDAY = addDays(MONDAY, 6)
const NEXT_MONDAY = addDays(MONDAY, 7)
const NOW = new Date()

function baseState(): AppState {
  return createInitialState(NOW)
}

/** Aceita, termina e aprova um trabalho extra. */
function doJob(state: AppState, jobId: string): AppState {
  let next = appReducer(state, { type: 'job/claim', jobId })
  const completion = next.extraJobCompletions.at(-1)!
  next = appReducer(next, { type: 'job/submit', completionId: completion.id })
  return appReducer(next, { type: 'job/approve', completionId: completion.id })
}

describe('8. concluir trabalho extra', () => {
  it('passa por "quero fazer" → "terminei" → a aguardar aprovação', () => {
    let state = appReducer(baseState(), { type: 'job/claim', jobId: 'job_aspirar' })
    let completion = state.extraJobCompletions[0]
    expect(completion.status).toBe('claimed')
    expect(completion.amount).toBe(1)

    state = appReducer(state, { type: 'job/submit', completionId: completion.id })
    completion = state.extraJobCompletions[0]
    expect(completion.status).toBe('submitted')
    // Enquanto não for aprovado, não conta como ganho.
    expect(weekExtrasEarned(state, MONDAY)).toBe(0)
  })
})

describe('9. aprovar trabalho extra', () => {
  it('move o valor para os ganhos da semana', () => {
    const state = doJob(baseState(), 'job_aspirar')
    expect(state.extraJobCompletions[0].status).toBe('approved')
    expect(weekExtrasEarned(state, MONDAY)).toBe(1)
  })

  it('rejeitar não dá dinheiro', () => {
    let state = appReducer(baseState(), { type: 'job/claim', jobId: 'job_gaveta' })
    const completion = state.extraJobCompletions[0]
    state = appReducer(state, { type: 'job/submit', completionId: completion.id })
    state = appReducer(state, { type: 'job/reject', completionId: completion.id })
    expect(weekExtrasEarned(state, MONDAY)).toBe(0)
  })
})

describe('10. somar dinheiro', () => {
  it('semanada 3,00 + extras 2,50 = 5,50', () => {
    let state = baseState()
    state = doJob(state, 'job_aspirar') // 1,00
    state = doJob(state, 'job_varanda') // 1,00
    state = doJob(state, 'job_reciclagem') // 0,50

    const preview = buildWeekClosePreview(state)
    expect(preview.allowance).toBe(3)
    expect(preview.extras).toBe(2.5)
    expect(preview.total).toBe(5.5)
    expect(formatEuro(preview.total)).toBe('€5,50')
  })
})

describe('11. divisão 50/40/10', () => {
  it('divide 5,50 em 2,75 / 2,20 / 0,55', () => {
    const split = splitByPercent(5.5, [
      { id: 'spend', percent: 50 },
      { id: 'save', percent: 40 },
      { id: 'share', percent: 10 },
    ])
    expect(split).toEqual({ spend: 2.75, save: 2.2, share: 0.55 })
    expect(sumMoney(Object.values(split))).toBe(5.5)
  })

  it('não perde cêntimos com valores difíceis de dividir', () => {
    for (const total of [0.01, 0.05, 3.33, 7.77, 12.34]) {
      const split = splitByPercent(total, [
        { id: 'spend', percent: 50 },
        { id: 'save', percent: 40 },
        { id: 'share', percent: 10 },
      ])
      expect(sumMoney(Object.values(split))).toBe(total)
    }
  })
})

describe('12–15. fechar a semana', () => {
  /**
   * Semana com tudo marcado nos dias que já aconteceram — não se marcam dias
   * futuros, por isso o total depende do dia em que os testes correm.
   */
  function closedState() {
    let state = baseState()
    for (const date of weekDays(MONDAY)) {
      if (date > TODAY) continue
      state = appReducer(state, { type: 'day/fill', date })
    }
    state = doJob(state, 'job_aspirar') // 1,00
    state = doJob(state, 'job_varanda') // 1,00
    return closeWeek(state, { chosenPrivilege: 'Acampamento na sala', now: NOW })
  }

  it('12. guarda o resumo e distribui o dinheiro', () => {
    const state = closedState()
    const record = state.weeklyRecords[0]
    const daysMarked = weekDays(MONDAY).filter((date) => date <= TODAY).length

    // 6 responsabilidades + 2 de aprendizagem por cada dia já marcado.
    expect(record.totalStars).toBe(daysMarked * 8)
    expect(record.maxStars).toBe(56)
    expect(record.tierName).toBe(tierForStars(state.rewardTiers, record.totalStars)?.name)
    expect(record.chosenPrivilege).toBe('Acampamento na sala')
    expect(record.allowance).toBe(3)
    expect(record.extras).toBe(2)
    expect(record.total).toBe(5)
    expect(record.distribution).toEqual({ spend: 2.5, save: 2, share: 0.5 })
  })

  it('12b. uma semana perfeita fica registada como 56 estrelas e nível máximo', () => {
    // Semana já passada: dá para marcar os sete dias.
    const pastMonday = addDays(MONDAY, -7)
    let state = { ...baseState(), currentWeekStart: pastMonday }
    for (const date of weekDays(pastMonday)) {
      state = appReducer(state, { type: 'day/fill', date })
    }

    const record = closeWeek(state, { now: NOW }).weeklyRecords[0]
    expect(record.totalStars).toBe(56)
    expect(record.responsibilityStars).toBe(42)
    expect(record.learningStars).toBe(14)
    expect(record.tierName).toBe('Semana extraordinária')
  })

  it('13. guarda o histórico', () => {
    const state = closedState()
    expect(state.weeklyRecords).toHaveLength(1)
    expect(state.weeklyRecords[0].weekStart).toBe(MONDAY)
    expect(state.weeklyRecords[0].weekEnd).toBe(SUNDAY)
  })

  it('14. inicia uma nova semana com estrelas a zero', () => {
    const state = closedState()
    expect(state.currentWeekStart).toBe(NEXT_MONDAY)
    expect(state.responsibilityCompletions).toHaveLength(0)
    expect(state.learningCompletions).toHaveLength(0)
    expect(state.extraJobCompletions).toHaveLength(0)
    expect(weekTotals(state, state.currentWeekStart).totalStars).toBe(0)
  })

  it('15. mantém os saldos dos cofrinhos', () => {
    const state = closedState()
    const balances = walletBalances(state.transactions)
    expect(balances).toEqual({ spend: 2.5, save: 2, share: 0.5 })
    expect(totalBalance(state.transactions)).toBe(5)
  })

  it('acumula saldos ao longo de várias semanas', () => {
    const first = closedState()
    const second = closeWeek(first, { now: NOW })
    const balances = walletBalances(second.transactions)
    // Segunda semana: apenas a semanada de 3,00 (50/40/10).
    expect(balances).toEqual({ spend: 4, save: 3.2, share: 0.8 })
    expect(second.weeklyRecords).toHaveLength(2)
  })

  it('16. mantém o objetivo de poupança', () => {
    let state = baseState()
    state = appReducer(state, {
      type: 'goal/save',
      goal: {
        id: 'goal_lego',
        name: 'LEGO',
        emoji: '🧱',
        price: 35,
        createdAt: NOW.toISOString(),
        active: true,
        celebrated: false,
      },
    })
    const closed = closeWeek(state, { now: NOW })
    expect(closed.savingsGoals).toHaveLength(1)
    expect(closed.savingsGoals[0].name).toBe('LEGO')
  })
})

describe('saldo do objetivo e compra', () => {
  it('a compra retira o dinheiro só quando os pais confirmam', () => {
    let state = baseState()
    state = appReducer(state, {
      type: 'transaction/add',
      transaction: {
        amount: 40,
        type: 'adjustment',
        wallet: 'save',
        description: 'Prenda dos avós',
      },
    })
    state = appReducer(state, {
      type: 'goal/save',
      goal: {
        id: 'goal_lego',
        name: 'LEGO',
        emoji: '🧱',
        price: 35,
        createdAt: NOW.toISOString(),
        active: true,
        celebrated: false,
      },
    })
    expect(walletBalances(state.transactions).save).toBe(40)

    state = appReducer(state, { type: 'goal/buy', id: 'goal_lego' })
    expect(walletBalances(state.transactions).save).toBe(5)
    expect(state.savingsGoals[0].completedAt).toBeTruthy()
    expect(state.savingsGoals[0].active).toBe(false)
  })
})

describe('percentagens dos cofrinhos', () => {
  it('rejeita percentagens que não somam 100', () => {
    const state = appReducer(baseState(), {
      type: 'wallets/percent',
      percents: { spend: 50, save: 40, share: 20 },
    })
    expect(state.wallets.find((wallet) => wallet.id === 'share')?.percent).toBe(10)
  })

  it('aceita percentagens válidas', () => {
    const state = appReducer(baseState(), {
      type: 'wallets/percent',
      percents: { spend: 40, save: 50, share: 10 },
    })
    expect(state.wallets.map((wallet) => wallet.percent)).toEqual([40, 50, 10])
  })
})
