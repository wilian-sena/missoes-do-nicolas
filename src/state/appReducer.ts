import type {
  AppState,
  ExtraJobCompletion,
  LearningCompletion,
  ResponsibilityCompletion,
  Transaction,
} from '../types'
import type { AppAction } from './actions'
import { createInitialState } from '../data/defaults'
import { closeWeek } from '../services/weekService'
import { startOfWeek, today } from '../utils/date'
import { activeLearningActivities, activeResponsibilities } from '../utils/scoring'
import { createId } from '../utils/id'
import { roundMoney } from '../utils/money'

function stamp(state: AppState): AppState {
  return { ...state, updatedAt: new Date().toISOString() }
}

function toggleResponsibility(
  state: AppState,
  responsibilityId: string,
  date: string,
  part?: 'morning' | 'night',
  byParent = false,
): AppState {
  const responsibility = state.responsibilities.find((item) => item.id === responsibilityId)
  if (!responsibility) return state
  // Não se marcam dias que ainda não aconteceram.
  if (date > today()) return state
  const needsApproval = responsibility.requiresApproval && !byParent

  const existing = state.responsibilityCompletions.find(
    (item) => item.responsibilityId === responsibilityId && item.date === date,
  )
  const others = state.responsibilityCompletions.filter((item) => item !== existing)
  const nowISO = new Date().toISOString()

  if (responsibility.mode === 'twice') {
    const which = part ?? 'morning'
    const morning = which === 'morning' ? !(existing?.morning ?? false) : (existing?.morning ?? false)
    const night = which === 'night' ? !(existing?.night ?? false) : (existing?.night ?? false)

    if (!morning && !night) {
      return stamp({ ...state, responsibilityCompletions: others })
    }

    const done = morning && night
    const completion: ResponsibilityCompletion = {
      id: existing?.id ?? createId('rc'),
      responsibilityId,
      date,
      morning,
      night,
      done,
      status: done && needsApproval ? 'pending' : 'approved',
      markedAt: existing?.markedAt ?? nowISO,
      approvedAt: done && !needsApproval ? (existing?.approvedAt ?? nowISO) : undefined,
    }
    return stamp({ ...state, responsibilityCompletions: [...others, completion] })
  }

  // Modo simples: marcar cria, desmarcar remove.
  if (existing) {
    return stamp({ ...state, responsibilityCompletions: others })
  }

  const completion: ResponsibilityCompletion = {
    id: createId('rc'),
    responsibilityId,
    date,
    morning: false,
    night: false,
    done: true,
    status: needsApproval ? 'pending' : 'approved',
    markedAt: nowISO,
    approvedAt: needsApproval ? undefined : nowISO,
  }
  return stamp({ ...state, responsibilityCompletions: [...others, completion] })
}

function toggleLearning(
  state: AppState,
  activityId: string,
  date: string,
  byParent = false,
): AppState {
  const activity = state.learningActivities.find((item) => item.id === activityId)
  if (!activity) return state
  if (date > today()) return state
  const needsApproval = activity.requiresApproval && !byParent

  const existing = state.learningCompletions.find(
    (item) => item.activityId === activityId && item.date === date,
  )
  if (existing) {
    return stamp({
      ...state,
      learningCompletions: state.learningCompletions.filter((item) => item.id !== existing.id),
    })
  }

  const nowISO = new Date().toISOString()
  const completion: LearningCompletion = {
    id: createId('lc'),
    activityId,
    date,
    status: needsApproval ? 'pending' : 'approved',
    markedAt: nowISO,
    approvedAt: needsApproval ? undefined : nowISO,
  }
  return stamp({ ...state, learningCompletions: [...state.learningCompletions, completion] })
}

/**
 * "Marcar tudo" num dia: todas as responsabilidades e as atividades de
 * aprendizagem necessárias para chegar ao limite diário — nunca mais do que
 * isso, para o atalho não inventar estrelas que a app não daria.
 */
function fillDay(state: AppState, date: string): AppState {
  if (date > today()) return state
  const nowISO = new Date().toISOString()

  const completions = [...state.responsibilityCompletions.filter((item) => item.date !== date)]
  for (const responsibility of activeResponsibilities(state)) {
    const existing = state.responsibilityCompletions.find(
      (item) => item.responsibilityId === responsibility.id && item.date === date,
    )
    completions.push({
      id: existing?.id ?? createId('rc'),
      responsibilityId: responsibility.id,
      date,
      morning: responsibility.mode === 'twice',
      night: responsibility.mode === 'twice',
      done: true,
      status: 'approved',
      markedAt: existing?.markedAt ?? nowISO,
      approvedAt: nowISO,
    })
  }

  const activities = activeLearningActivities(state)
  const already = state.learningCompletions.filter((item) => item.date === date)
  const learning = [...state.learningCompletions]
  let counted = already.length
  for (const activity of activities) {
    if (counted >= state.settings.maxLearningStarsPerDay) break
    if (already.some((item) => item.activityId === activity.id)) continue
    learning.push({
      id: createId('lc'),
      activityId: activity.id,
      date,
      status: 'approved',
      markedAt: nowISO,
      approvedAt: nowISO,
    })
    counted += 1
  }
  // As que já estavam marcadas mas à espera de aprovação passam a aprovadas.
  const learningApproved = learning.map((item) =>
    item.date === date && item.status === 'pending'
      ? { ...item, status: 'approved' as const, approvedAt: nowISO }
      : item,
  )

  return stamp({
    ...state,
    responsibilityCompletions: completions,
    learningCompletions: learningApproved,
  })
}

/** Limpa por completo um dia (usado quando os pais se enganam a registar). */
function clearDay(state: AppState, date: string): AppState {
  return stamp({
    ...state,
    responsibilityCompletions: state.responsibilityCompletions.filter(
      (item) => item.date !== date,
    ),
    learningCompletions: state.learningCompletions.filter((item) => item.date !== date),
  })
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    /* ---------------- Responsabilidades ---------------- */
    case 'responsibility/toggle':
      return toggleResponsibility(
        state,
        action.responsibilityId,
        action.date,
        action.part,
        action.byParent,
      )

    case 'responsibility/approve':
      return stamp({
        ...state,
        responsibilityCompletions: state.responsibilityCompletions.map((item) =>
          item.id === action.completionId
            ? { ...item, status: 'approved', approvedAt: new Date().toISOString() }
            : item,
        ),
      })

    case 'responsibility/reject':
      return stamp({
        ...state,
        responsibilityCompletions: state.responsibilityCompletions.filter(
          (item) => item.id !== action.completionId,
        ),
      })

    case 'responsibility/save': {
      const exists = state.responsibilities.some((item) => item.id === action.responsibility.id)
      return stamp({
        ...state,
        responsibilities: exists
          ? state.responsibilities.map((item) =>
              item.id === action.responsibility.id ? action.responsibility : item,
            )
          : [...state.responsibilities, action.responsibility],
      })
    }

    case 'responsibility/remove':
      return stamp({
        ...state,
        responsibilities: state.responsibilities.filter((item) => item.id !== action.id),
        responsibilityCompletions: state.responsibilityCompletions.filter(
          (item) => item.responsibilityId !== action.id,
        ),
      })

    /* ---------------- Aprendizagem ---------------- */
    case 'learning/toggle':
      return toggleLearning(state, action.activityId, action.date, action.byParent)

    case 'day/fill':
      return fillDay(state, action.date)

    case 'day/clear':
      return clearDay(state, action.date)

    case 'learning/approve':
      return stamp({
        ...state,
        learningCompletions: state.learningCompletions.map((item) =>
          item.id === action.completionId
            ? { ...item, status: 'approved', approvedAt: new Date().toISOString() }
            : item,
        ),
      })

    case 'learning/reject':
      return stamp({
        ...state,
        learningCompletions: state.learningCompletions.filter(
          (item) => item.id !== action.completionId,
        ),
      })

    case 'learning/save': {
      const exists = state.learningActivities.some((item) => item.id === action.activity.id)
      return stamp({
        ...state,
        learningActivities: exists
          ? state.learningActivities.map((item) =>
              item.id === action.activity.id ? action.activity : item,
            )
          : [...state.learningActivities, action.activity],
      })
    }

    case 'learning/remove':
      return stamp({
        ...state,
        learningActivities: state.learningActivities.filter((item) => item.id !== action.id),
        learningCompletions: state.learningCompletions.filter(
          (item) => item.activityId !== action.id,
        ),
      })

    /* ---------------- Trabalhos extra ---------------- */
    case 'job/claim': {
      const job = state.extraJobs.find((item) => item.id === action.jobId)
      if (!job || !job.available) return state
      const completion: ExtraJobCompletion = {
        id: createId('ej'),
        jobId: job.id,
        label: job.label,
        emoji: job.emoji,
        amount: job.amount,
        status: 'claimed',
        weekStart: startOfWeek(today()),
        claimedAt: new Date().toISOString(),
      }
      return stamp({ ...state, extraJobCompletions: [...state.extraJobCompletions, completion] })
    }

    case 'job/submit':
      return stamp({
        ...state,
        extraJobCompletions: state.extraJobCompletions.map((item) =>
          item.id === action.completionId
            ? { ...item, status: 'submitted', submittedAt: new Date().toISOString() }
            : item,
        ),
      })

    case 'job/giveUp':
      return stamp({
        ...state,
        extraJobCompletions: state.extraJobCompletions.filter(
          (item) => item.id !== action.completionId,
        ),
      })

    case 'job/approve':
      return stamp({
        ...state,
        extraJobCompletions: state.extraJobCompletions.map((item) =>
          item.id === action.completionId
            ? { ...item, status: 'approved', resolvedAt: new Date().toISOString() }
            : item,
        ),
      })

    case 'job/reject':
      return stamp({
        ...state,
        extraJobCompletions: state.extraJobCompletions.map((item) =>
          item.id === action.completionId
            ? {
                ...item,
                status: 'rejected',
                resolvedAt: new Date().toISOString(),
                parentNote: action.note,
              }
            : item,
        ),
      })

    case 'job/save': {
      const exists = state.extraJobs.some((item) => item.id === action.job.id)
      return stamp({
        ...state,
        extraJobs: exists
          ? state.extraJobs.map((item) => (item.id === action.job.id ? action.job : item))
          : [...state.extraJobs, action.job],
      })
    }

    case 'job/remove':
      return stamp({
        ...state,
        extraJobs: state.extraJobs.filter((item) => item.id !== action.id),
        // As missões já aceites/aprovadas mantêm-se: são história (e dinheiro) real.
      })

    /* ---------------- Recompensas e cofrinhos ---------------- */
    case 'tiers/save':
      return stamp({ ...state, rewardTiers: action.tiers })

    case 'wallets/percent': {
      const total = Object.values(action.percents).reduce((acc, value) => acc + value, 0)
      if (total !== 100) return state
      return stamp({
        ...state,
        wallets: state.wallets.map((wallet) => ({
          ...wallet,
          percent: action.percents[wallet.id] ?? wallet.percent,
        })),
      })
    }

    /* ---------------- Dinheiro ---------------- */
    case 'transaction/add': {
      const transaction: Transaction = {
        ...action.transaction,
        amount: roundMoney(action.transaction.amount),
        id: createId('tx'),
        date: action.transaction.date ?? new Date().toISOString(),
      }
      return stamp({ ...state, transactions: [...state.transactions, transaction] })
    }

    case 'transaction/remove':
      return stamp({
        ...state,
        transactions: state.transactions.filter((item) => item.id !== action.id),
      })

    case 'money/setOpeningBalance': {
      const nowISO = new Date().toISOString()
      // Substitui o saldo inicial anterior em vez de somar outro por cima.
      const withoutOpening = state.transactions.filter((item) => item.type !== 'opening')
      const openings: Transaction[] = state.wallets
        .filter((wallet) => roundMoney(action.amounts[wallet.id] ?? 0) !== 0)
        .map((wallet) => ({
          id: createId('tx'),
          date: nowISO,
          amount: roundMoney(action.amounts[wallet.id]),
          type: 'opening',
          wallet: wallet.id,
          description: action.description,
        }))
      return stamp({ ...state, transactions: [...openings, ...withoutOpening] })
    }

    /* ---------------- Objetivo de poupança ---------------- */
    case 'goal/save': {
      const exists = state.savingsGoals.some((item) => item.id === action.goal.id)
      return stamp({
        ...state,
        savingsGoals: exists
          ? state.savingsGoals.map((item) => (item.id === action.goal.id ? action.goal : item))
          : // Só um objetivo ativo de cada vez.
            [...state.savingsGoals.map((item) => ({ ...item, active: false })), action.goal],
      })
    }

    case 'goal/remove':
      return stamp({
        ...state,
        savingsGoals: state.savingsGoals.filter((item) => item.id !== action.id),
      })

    case 'goal/celebrated':
      return stamp({
        ...state,
        savingsGoals: state.savingsGoals.map((item) =>
          item.id === action.id ? { ...item, celebrated: true } : item,
        ),
      })

    case 'goal/buy': {
      const goal = state.savingsGoals.find((item) => item.id === action.id)
      if (!goal) return state
      const nowISO = new Date().toISOString()
      const transaction: Transaction = {
        id: createId('tx'),
        date: nowISO,
        amount: -roundMoney(goal.price),
        type: 'spend',
        wallet: 'save',
        description: `Objetivo alcançado: ${goal.name}`,
      }
      return stamp({
        ...state,
        transactions: [...state.transactions, transaction],
        savingsGoals: state.savingsGoals.map((item) =>
          item.id === action.id
            ? { ...item, active: false, completedAt: nowISO, celebrated: true }
            : item,
        ),
      })
    }

    /* ---------------- Semana ---------------- */
    case 'week/close':
      return closeWeek(state, { chosenPrivilege: action.chosenPrivilege })

    /* ---------------- Histórico ---------------- */
    case 'history/addManual': {
      const { record, createTransactions } = action
      const transactions: Transaction[] = []
      if (createTransactions) {
        const nowISO = new Date().toISOString()
        for (const wallet of state.wallets) {
          const amount = roundMoney(record.distribution[wallet.id] ?? 0)
          if (amount === 0) continue
          transactions.push({
            id: createId('tx'),
            date: nowISO,
            amount,
            type: 'adjustment',
            wallet: wallet.id,
            description: `Semana de ${record.weekStart} (registo manual)`,
            weekStart: record.weekStart,
          })
        }
      }
      return stamp({
        ...state,
        transactions: [...state.transactions, ...transactions],
        weeklyRecords: [...state.weeklyRecords, record],
      })
    }

    case 'history/remove':
      return stamp({
        ...state,
        weeklyRecords: state.weeklyRecords.filter((item) => item.id !== action.id),
      })

    /* ---------------- Configurações e dados ---------------- */
    case 'settings/update':
      return stamp({ ...state, settings: { ...state.settings, ...action.patch } })

    case 'profile/update':
      return stamp({ ...state, profile: { ...state.profile, ...action.patch } })

    case 'state/replace':
      return stamp(action.state)

    case 'state/reset':
      return createInitialState()

    default:
      return state
  }
}
