import type { AppState, Transaction, WalletId, WeeklyRecord } from '../types'
import { addDays, endOfWeek, startOfWeek, today } from '../utils/date'
import { createId } from '../utils/id'
import { fromCents, splitByPercent, toCents } from '../utils/money'
import { tierForStars, weekMoney, weekTotals } from '../utils/scoring'

export interface WeekClosePreview {
  weekStart: string
  weekEnd: string
  totals: ReturnType<typeof weekTotals>
  tierName: string
  tierEmoji: string
  tierId: string
  privilege: string
  privilegeOptions: string[]
  allowance: number
  extras: number
  total: number
  distribution: Record<WalletId, number>
}

/** Resumo mostrado antes de confirmar o fecho da semana. */
export function buildWeekClosePreview(state: AppState): WeekClosePreview {
  const totals = weekTotals(state, state.currentWeekStart)
  const tier = tierForStars(state.rewardTiers, totals.totalStars)
  const money = weekMoney(state, state.currentWeekStart)

  const allowanceSplit = splitByPercent(money.allowance, state.wallets)
  const extrasSplit = splitByPercent(money.extras, state.wallets)
  const distribution = state.wallets.reduce(
    (acc, wallet) => {
      acc[wallet.id] = fromCents(toCents(allowanceSplit[wallet.id]) + toCents(extrasSplit[wallet.id]))
      return acc
    },
    { spend: 0, save: 0, share: 0 } as Record<WalletId, number>,
  )

  return {
    weekStart: state.currentWeekStart,
    weekEnd: endOfWeek(state.currentWeekStart),
    totals,
    tierId: tier?.id ?? '',
    tierName: tier?.name ?? '—',
    tierEmoji: tier?.emoji ?? '⭐',
    privilege: tier?.privilege ?? '',
    privilegeOptions: tier?.options ?? [],
    allowance: money.allowance,
    extras: money.extras,
    total: money.total,
    distribution,
  }
}

/**
 * Fecha a semana:
 *  - guarda o registo no histórico;
 *  - transforma semanada + extras em movimentos nos três cofrinhos;
 *  - limpa apenas as marcações da semana fechada (saldos, objetivo e
 *    histórico mantêm-se intactos).
 */
export function closeWeek(
  state: AppState,
  options: { chosenPrivilege?: string; now?: Date } = {},
): AppState {
  const now = options.now ?? new Date()
  const nowISO = now.toISOString()
  const preview = buildWeekClosePreview(state)
  const closedWeekStart = state.currentWeekStart
  const closedWeekEnd = preview.weekEnd

  const record: WeeklyRecord = {
    id: createId('week'),
    weekStart: closedWeekStart,
    weekEnd: closedWeekEnd,
    responsibilityStars: preview.totals.responsibilityStars,
    responsibilityMax: preview.totals.responsibilityMax,
    learningStars: preview.totals.learningStars,
    learningMax: preview.totals.learningMax,
    totalStars: preview.totals.totalStars,
    maxStars: preview.totals.maxStars,
    tierId: preview.tierId,
    tierName: preview.tierName,
    tierEmoji: preview.tierEmoji,
    privilege: preview.privilege,
    chosenPrivilege: options.chosenPrivilege,
    allowance: preview.allowance,
    extras: preview.extras,
    total: preview.total,
    distribution: preview.distribution,
    closedAt: nowISO,
  }

  const allowanceSplit = splitByPercent(preview.allowance, state.wallets)
  const extrasSplit = splitByPercent(preview.extras, state.wallets)
  const transactions: Transaction[] = []

  for (const wallet of state.wallets) {
    if (toCents(allowanceSplit[wallet.id]) !== 0) {
      transactions.push({
        id: createId('tx'),
        date: nowISO,
        amount: allowanceSplit[wallet.id],
        type: 'allowance',
        wallet: wallet.id,
        description: `Semanada (${wallet.percent}% para ${wallet.label})`,
        weekStart: closedWeekStart,
      })
    }
    if (toCents(extrasSplit[wallet.id]) !== 0) {
      transactions.push({
        id: createId('tx'),
        date: nowISO,
        amount: extrasSplit[wallet.id],
        type: 'extra_job',
        wallet: wallet.id,
        description: `Trabalhos extra (${wallet.percent}% para ${wallet.label})`,
        weekStart: closedWeekStart,
      })
    }
  }

  const nextWeekStart = (() => {
    const naturalNext = addDays(closedWeekStart, 7)
    const currentWeek = startOfWeek(today(now))
    return currentWeek > closedWeekStart ? currentWeek : naturalNext
  })()

  const withinClosedWeek = (date: string) => date >= closedWeekStart && date <= closedWeekEnd

  return {
    ...state,
    // Marcações da semana fechada saem; as de outras semanas ficam.
    responsibilityCompletions: state.responsibilityCompletions.filter(
      (item) => !withinClosedWeek(item.date),
    ),
    learningCompletions: state.learningCompletions.filter((item) => !withinClosedWeek(item.date)),
    extraJobCompletions: state.extraJobCompletions.filter(
      (item) => item.weekStart !== closedWeekStart,
    ),
    transactions: [...state.transactions, ...transactions],
    weeklyRecords: [...state.weeklyRecords, record],
    currentWeekStart: nextWeekStart,
    updatedAt: nowISO,
  }
}
