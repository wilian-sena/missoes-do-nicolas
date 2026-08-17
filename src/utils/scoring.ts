import type {
  AppState,
  ISODate,
  LearningActivity,
  LearningCompletion,
  Responsibility,
  ResponsibilityCompletion,
  RewardTier,
  Transaction,
  WalletId,
} from '../types'
import { addDays, endOfWeek, weekDays } from './date'
import { fromCents, toCents } from './money'

/* ------------------------------------------------------------------ *
 * Responsabilidades
 * ------------------------------------------------------------------ */

export function activeResponsibilities(state: AppState): Responsibility[] {
  return state.responsibilities.filter((item) => item.active).sort((a, b) => a.order - b.order)
}

export function activeLearningActivities(state: AppState): LearningActivity[] {
  return state.learningActivities.filter((item) => item.active).sort((a, b) => a.order - b.order)
}

export function findResponsibilityCompletion(
  state: AppState,
  responsibilityId: string,
  date: ISODate,
): ResponsibilityCompletion | undefined {
  return state.responsibilityCompletions.find(
    (item) => item.responsibilityId === responsibilityId && item.date === date,
  )
}

export function findLearningCompletion(
  state: AppState,
  activityId: string,
  date: ISODate,
): LearningCompletion | undefined {
  return state.learningCompletions.find(
    (item) => item.activityId === activityId && item.date === date,
  )
}

/** Uma marcação só vale estrela quando está feita e aprovada. */
export function earnsStar(
  completion: Pick<ResponsibilityCompletion, 'done' | 'status'> | undefined,
): boolean {
  return Boolean(completion?.done && completion.status === 'approved')
}

export type ItemState = 'todo' | 'pending' | 'done'

export function responsibilityState(
  completion: ResponsibilityCompletion | undefined,
): ItemState {
  if (!completion) return 'todo'
  if (completion.done && completion.status === 'approved') return 'done'
  if (completion.done) return 'pending'
  return 'todo'
}

export function learningState(completion: LearningCompletion | undefined): ItemState {
  if (!completion) return 'todo'
  return completion.status === 'approved' ? 'done' : 'pending'
}

/** Estrelas de responsabilidades ganhas num dia (máximo = nº de responsabilidades ativas). */
export function responsibilityStarsForDay(state: AppState, date: ISODate): number {
  const active = activeResponsibilities(state)
  return active.reduce((total, responsibility) => {
    const completion = findResponsibilityCompletion(state, responsibility.id, date)
    return total + (earnsStar(completion) ? 1 : 0)
  }, 0)
}

/**
 * Estrelas de aprendizagem num dia.
 * Mesmo que sejam feitas as três atividades, contam no máximo 2 (configurável).
 */
export function learningStarsForDay(state: AppState, date: ISODate): number {
  const activeIds = new Set(activeLearningActivities(state).map((item) => item.id))
  const approved = state.learningCompletions.filter(
    (item) => item.date === date && item.status === 'approved' && activeIds.has(item.activityId),
  ).length
  return Math.min(approved, state.settings.maxLearningStarsPerDay)
}

/** Atividades de aprendizagem concluídas num dia (inclui as que ultrapassam o limite). */
export function learningDoneForDay(state: AppState, date: ISODate): number {
  const activeIds = new Set(activeLearningActivities(state).map((item) => item.id))
  return state.learningCompletions.filter(
    (item) => item.date === date && item.status === 'approved' && activeIds.has(item.activityId),
  ).length
}

/* ------------------------------------------------------------------ *
 * Totais semanais
 * ------------------------------------------------------------------ */

export interface WeekTotals {
  weekStart: ISODate
  weekEnd: ISODate
  responsibilityStars: number
  responsibilityMax: number
  learningStars: number
  learningMax: number
  totalStars: number
  maxStars: number
  perDay: { date: ISODate; responsibility: number; learning: number }[]
}

export function weekTotals(state: AppState, weekStart: ISODate = state.currentWeekStart): WeekTotals {
  const days = weekDays(weekStart)
  const responsibilityMax = activeResponsibilities(state).length * 7
  const learningMax = state.settings.maxLearningStarsPerDay * 7

  const perDay = days.map((date) => ({
    date,
    responsibility: responsibilityStarsForDay(state, date),
    learning: learningStarsForDay(state, date),
  }))

  const responsibilityStars = Math.min(
    perDay.reduce((acc, day) => acc + day.responsibility, 0),
    responsibilityMax,
  )
  const learningStars = Math.min(
    perDay.reduce((acc, day) => acc + day.learning, 0),
    learningMax,
  )
  const maxStars = responsibilityMax + learningMax

  return {
    weekStart,
    weekEnd: endOfWeek(weekStart),
    responsibilityStars,
    responsibilityMax,
    learningStars,
    learningMax,
    totalStars: Math.min(responsibilityStars + learningStars, maxStars),
    maxStars,
    perDay,
  }
}

/* ------------------------------------------------------------------ *
 * Níveis e privilégios
 * ------------------------------------------------------------------ */

export function sortedTiers(tiers: RewardTier[]): RewardTier[] {
  return [...tiers].sort((a, b) => a.min - b.min)
}

/** Nível atingido — apenas o mais alto, nunca acumulado. */
export function tierForStars(tiers: RewardTier[], stars: number): RewardTier | undefined {
  const ordered = sortedTiers(tiers)
  let current: RewardTier | undefined = ordered[0]
  for (const tier of ordered) {
    if (stars >= tier.min) current = tier
  }
  return current
}

export interface NextTierInfo {
  tier: RewardTier
  starsMissing: number
}

/** Próximo nível ainda por desbloquear e quantas estrelas faltam. */
export function nextTier(tiers: RewardTier[], stars: number): NextTierInfo | null {
  const upcoming = sortedTiers(tiers).find((tier) => tier.min > stars)
  if (!upcoming) return null
  return { tier: upcoming, starsMissing: upcoming.min - stars }
}

/* ------------------------------------------------------------------ *
 * Dinheiro
 * ------------------------------------------------------------------ */

export function walletBalances(transactions: Transaction[]): Record<WalletId, number> {
  const cents: Record<WalletId, number> = { spend: 0, save: 0, share: 0 }
  for (const transaction of transactions) {
    const value = toCents(transaction.amount)
    if (transaction.type === 'transfer') {
      cents[transaction.wallet] -= Math.abs(value)
      if (transaction.toWallet) cents[transaction.toWallet] += Math.abs(value)
    } else {
      cents[transaction.wallet] += value
    }
  }
  return { spend: fromCents(cents.spend), save: fromCents(cents.save), share: fromCents(cents.share) }
}

export function totalBalance(transactions: Transaction[]): number {
  const balances = walletBalances(transactions)
  return fromCents(toCents(balances.spend) + toCents(balances.save) + toCents(balances.share))
}

/** Trabalhos extra já aprovados na semana — os "ganhos desta semana". */
export function weekExtrasEarned(state: AppState, weekStart: ISODate = state.currentWeekStart): number {
  const cents = state.extraJobCompletions
    .filter((item) => item.weekStart === weekStart && item.status === 'approved')
    .reduce((acc, item) => acc + toCents(item.amount), 0)
  return fromCents(cents)
}

export interface WeekMoney {
  allowance: number
  extras: number
  total: number
}

export function weekMoney(state: AppState, weekStart: ISODate = state.currentWeekStart): WeekMoney {
  const allowance = state.settings.allowance
  const extras = weekExtrasEarned(state, weekStart)
  return { allowance, extras, total: fromCents(toCents(allowance) + toCents(extras)) }
}

/* ------------------------------------------------------------------ *
 * Aprovações pendentes
 * ------------------------------------------------------------------ */

export interface PendingSummary {
  responsibilities: ResponsibilityCompletion[]
  learning: LearningCompletion[]
  extraJobs: AppState['extraJobCompletions']
  total: number
}

export function pendingApprovals(state: AppState): PendingSummary {
  const responsibilities = state.responsibilityCompletions.filter(
    (item) => item.done && item.status === 'pending',
  )
  const learning = state.learningCompletions.filter((item) => item.status === 'pending')
  const extraJobs = state.extraJobCompletions.filter((item) => item.status === 'submitted')
  return {
    responsibilities,
    learning,
    extraJobs,
    total: responsibilities.length + learning.length + extraJobs.length,
  }
}

/* ------------------------------------------------------------------ *
 * Streak discreto
 * ------------------------------------------------------------------ */

/** Dias seguidos (até hoje ou até ontem) com todas as responsabilidades feitas. */
export function responsibilityStreak(state: AppState, date: ISODate): number {
  const target = activeResponsibilities(state).length
  if (target === 0) return 0

  let cursor = date
  if (responsibilityStarsForDay(state, cursor) < target) {
    cursor = addDays(cursor, -1)
  }

  let streak = 0
  // Limite de segurança: 60 dias para trás.
  for (let i = 0; i < 60; i += 1) {
    if (responsibilityStarsForDay(state, cursor) < target) break
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

/* ------------------------------------------------------------------ *
 * Objetivo de poupança
 * ------------------------------------------------------------------ */

export interface GoalProgress {
  saved: number
  price: number
  missing: number
  percent: number
  reached: boolean
}

/** O progresso do objetivo é o saldo do cofrinho "Guardar". */
export function goalProgress(price: number, savedBalance: number): GoalProgress {
  const saved = Math.max(savedBalance, 0)
  const missing = fromCents(Math.max(toCents(price) - toCents(saved), 0))
  const percent = price > 0 ? Math.min(100, (saved / price) * 100) : 0
  return { saved, price, missing, percent, reached: toCents(saved) >= toCents(price) }
}

export interface SaveBreakdown {
  total: number
  /** Parte comprometida com o objetivo — sai, mas com uma pergunta pelo meio. */
  reserved: number
  /** O que sobra acima do preço do objetivo — sai sem cerimónia. */
  free: number
}

/**
 * O cofrinho "Guardar" não é um cofre fechado: é dinheiro com um compromisso.
 * Sem objetivo definido, está tudo livre.
 */
export function saveBreakdown(balance: number, goalPrice?: number): SaveBreakdown {
  const total = Math.max(balance, 0)
  const reserved = goalPrice ? fromCents(Math.min(toCents(total), toCents(goalPrice))) : 0
  return { total, reserved, free: fromCents(toCents(total) - toCents(reserved)) }
}

/**
 * Quantas semanas de poupança valem um determinado valor, ao ritmo atual.
 * Serve para explicar a consequência de tirar dinheiro do Guardar.
 */
export function weeksOfSaving(amount: number, weeklyAllowance: number, savePercent: number): number {
  const perWeek = (weeklyAllowance * savePercent) / 100
  if (perWeek <= 0) return 0
  return Math.ceil(amount / perWeek)
}

/** Movimentos de um cofrinho, do mais recente para o mais antigo. */
export function walletTransactions(transactions: Transaction[], wallet: WalletId): Transaction[] {
  return transactions
    .filter((item) => item.wallet === wallet || item.toWallet === wallet)
    .reverse()
}

/** Efeito de um movimento no saldo de um cofrinho (positivo entra, negativo sai). */
export function transactionEffect(transaction: Transaction, wallet: WalletId): number {
  if (transaction.type === 'transfer') {
    const value = Math.abs(transaction.amount)
    if (transaction.toWallet === wallet) return value
    if (transaction.wallet === wallet) return -value
    return 0
  }
  return transaction.wallet === wallet ? transaction.amount : 0
}

/** Total que saiu de um cofrinho (gastos, partilhas e transferências para fora). */
export function totalSpent(transactions: Transaction[], wallet: WalletId): number {
  const cents = transactions.reduce((acc, transaction) => {
    const effect = toCents(transactionEffect(transaction, wallet))
    return effect < 0 ? acc + effect : acc
  }, 0)
  return fromCents(Math.abs(cents))
}
