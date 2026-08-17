import { describe, expect, it } from 'vitest'
import { appReducer } from '../state/appReducer'
import { createInitialState } from '../data/defaults'
import {
  learningStarsForDay,
  nextTier,
  responsibilityStarsForDay,
  responsibilityState,
  tierForStars,
  weekTotals,
} from '../utils/scoring'
import { weekDays } from '../utils/date'
import type { AppState } from '../types'

const MONDAY = '2026-08-03'

function baseState(): AppState {
  return { ...createInitialState(new Date('2026-08-03T09:00:00')), currentWeekStart: MONDAY }
}

/** Marca todas as responsabilidades de um dia (a dos dentes precisa das duas partes). */
function completeDay(state: AppState, date: string): AppState {
  let next = state
  for (const responsibility of next.responsibilities) {
    if (responsibility.mode === 'twice') {
      next = appReducer(next, {
        type: 'responsibility/toggle',
        responsibilityId: responsibility.id,
        date,
        part: 'morning',
      })
      next = appReducer(next, {
        type: 'responsibility/toggle',
        responsibilityId: responsibility.id,
        date,
        part: 'night',
      })
    } else {
      next = appReducer(next, {
        type: 'responsibility/toggle',
        responsibilityId: responsibility.id,
        date,
      })
    }
  }
  return next
}

describe('1. marcar responsabilidade', () => {
  it('dá uma estrela ao marcar', () => {
    const state = appReducer(baseState(), {
      type: 'responsibility/toggle',
      responsibilityId: 'resp_brinquedos',
      date: MONDAY,
    })
    expect(responsibilityStarsForDay(state, MONDAY)).toBe(1)
  })
})

describe('2. desmarcar responsabilidade', () => {
  it('retira a marcação e a estrela do dia', () => {
    const marked = appReducer(baseState(), {
      type: 'responsibility/toggle',
      responsibilityId: 'resp_brinquedos',
      date: MONDAY,
    })
    const unmarked = appReducer(marked, {
      type: 'responsibility/toggle',
      responsibilityId: 'resp_brinquedos',
      date: MONDAY,
    })
    expect(responsibilityStarsForDay(unmarked, MONDAY)).toBe(0)
    expect(unmarked.responsibilityCompletions).toHaveLength(0)
  })
})

describe('3. dentes manhã/noite', () => {
  it('só dá estrela quando as duas escovagens estão feitas', () => {
    let state = appReducer(baseState(), {
      type: 'responsibility/toggle',
      responsibilityId: 'resp_dentes',
      date: MONDAY,
      part: 'morning',
    })
    expect(responsibilityStarsForDay(state, MONDAY)).toBe(0)
    expect(responsibilityState(state.responsibilityCompletions[0])).toBe('todo')

    state = appReducer(state, {
      type: 'responsibility/toggle',
      responsibilityId: 'resp_dentes',
      date: MONDAY,
      part: 'night',
    })
    expect(responsibilityStarsForDay(state, MONDAY)).toBe(1)
  })

  it('continua a contar apenas 1 estrela, não 2', () => {
    let state = baseState()
    state = appReducer(state, {
      type: 'responsibility/toggle',
      responsibilityId: 'resp_dentes',
      date: MONDAY,
      part: 'morning',
    })
    state = appReducer(state, {
      type: 'responsibility/toggle',
      responsibilityId: 'resp_dentes',
      date: MONDAY,
      part: 'night',
    })
    expect(weekTotals(state, MONDAY).responsibilityStars).toBe(1)
  })
})

describe('4. máximo de duas estrelas de aprendizagem por dia', () => {
  it('conta no máximo 2 mesmo com as três atividades feitas', () => {
    let state = baseState()
    for (const activity of state.learningActivities) {
      state = appReducer(state, { type: 'learning/toggle', activityId: activity.id, date: MONDAY })
    }
    expect(state.learningCompletions).toHaveLength(3)
    expect(learningStarsForDay(state, MONDAY)).toBe(2)
  })
})

describe('5. cálculo de estrelas', () => {
  it('a semana perfeita dá exatamente 56 estrelas (42 + 14)', () => {
    let state = baseState()
    for (const date of weekDays(MONDAY)) {
      state = completeDay(state, date)
      for (const activity of state.learningActivities) {
        state = appReducer(state, { type: 'learning/toggle', activityId: activity.id, date })
      }
    }
    const totals = weekTotals(state, MONDAY)
    expect(totals.responsibilityStars).toBe(42)
    expect(totals.learningStars).toBe(14)
    expect(totals.totalStars).toBe(56)
    expect(totals.maxStars).toBe(56)
  })

  it('nunca ultrapassa o máximo', () => {
    let state = baseState()
    for (const date of weekDays(MONDAY)) {
      state = completeDay(state, date)
      for (const activity of state.learningActivities) {
        state = appReducer(state, { type: 'learning/toggle', activityId: activity.id, date })
      }
    }
    const totals = weekTotals(state, MONDAY)
    expect(totals.totalStars).toBeLessThanOrEqual(totals.maxStars)
  })
})

describe('6. nível de recompensa', () => {
  const tiers = createInitialState().rewardTiers

  it.each([
    [0, 'Em construção'],
    [29, 'Em construção'],
    [30, 'Boa semana'],
    [39, 'Boa semana'],
    [40, 'Muito boa semana'],
    [47, 'Muito boa semana'],
    [48, 'Excelente semana'],
    [53, 'Excelente semana'],
    [54, 'Semana extraordinária'],
    [56, 'Semana extraordinária'],
  ])('%i estrelas → %s', (stars, expected) => {
    expect(tierForStars(tiers, stars)?.name).toBe(expected)
  })
})

describe('7. estrelas em falta para o próximo nível', () => {
  const tiers = createInitialState().rewardTiers

  it('calcula quantas faltam', () => {
    expect(nextTier(tiers, 36)).toMatchObject({ starsMissing: 4 })
    expect(nextTier(tiers, 36)?.tier.name).toBe('Muito boa semana')
    expect(nextTier(tiers, 47)).toMatchObject({ starsMissing: 1 })
  })

  it('devolve null no nível mais alto', () => {
    expect(nextTier(tiers, 56)).toBeNull()
  })
})
