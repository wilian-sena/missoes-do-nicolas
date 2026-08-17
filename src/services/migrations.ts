import type { AppState } from '../types'
import { SCHEMA_VERSION, createInitialState } from '../data/defaults'
import { startOfWeek, today } from '../utils/date'

/**
 * Migrações de esquema.
 *
 * Cada versão futura acrescenta um passo aqui; os dados antigos passam por
 * todos os passos por ordem até chegarem à versão atual.
 */
type Migration = (state: Record<string, unknown>) => Record<string, unknown>

const MIGRATIONS: Record<number, Migration> = {
  // Exemplo para o futuro:
  // 1: (state) => ({ ...state, novoCampo: [] }),
}

/** Preenche campos em falta e aplica as migrações necessárias. */
export function migrateState(input: Partial<AppState>): AppState {
  let working = { ...(input as Record<string, unknown>) }
  let version = typeof input.schemaVersion === 'number' ? input.schemaVersion : 0

  while (version < SCHEMA_VERSION) {
    const migration = MIGRATIONS[version]
    if (migration) working = migration(working)
    version += 1
  }

  const base = createInitialState()
  const partial = working as Partial<AppState>

  return {
    schemaVersion: SCHEMA_VERSION,
    profile: { ...base.profile, ...partial.profile },
    settings: { ...base.settings, ...partial.settings },
    responsibilities: partial.responsibilities ?? base.responsibilities,
    learningActivities: partial.learningActivities ?? base.learningActivities,
    extraJobs: partial.extraJobs ?? base.extraJobs,
    rewardTiers: partial.rewardTiers ?? base.rewardTiers,
    wallets: partial.wallets ?? base.wallets,
    responsibilityCompletions: partial.responsibilityCompletions ?? [],
    learningCompletions: partial.learningCompletions ?? [],
    extraJobCompletions: partial.extraJobCompletions ?? [],
    transactions: partial.transactions ?? [],
    savingsGoals: partial.savingsGoals ?? [],
    weeklyRecords: partial.weeklyRecords ?? [],
    currentWeekStart: partial.currentWeekStart ?? startOfWeek(today()),
    updatedAt: partial.updatedAt ?? new Date().toISOString(),
  }
}
