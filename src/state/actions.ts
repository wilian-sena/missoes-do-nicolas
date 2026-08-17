import type {
  AppSettings,
  AppState,
  ChildProfile,
  ExtraJob,
  ISODate,
  LearningActivity,
  Responsibility,
  RewardTier,
  SavingsGoal,
  Transaction,
  WalletId,
  WeeklyRecord,
} from '../types'

export type AppAction =
  /* Responsabilidades */
  | {
      type: 'responsibility/toggle'
      responsibilityId: string
      date: ISODate
      part?: 'morning' | 'night'
      /** Marcação feita por um adulto: fica aprovada de imediato. */
      byParent?: boolean
    }
  | { type: 'responsibility/approve'; completionId: string }
  | { type: 'responsibility/reject'; completionId: string }
  | { type: 'responsibility/save'; responsibility: Responsibility }
  | { type: 'responsibility/remove'; id: string }
  /* Aprendizagem */
  | { type: 'learning/toggle'; activityId: string; date: ISODate; byParent?: boolean }
  | { type: 'learning/approve'; completionId: string }
  | { type: 'learning/reject'; completionId: string }
  | { type: 'learning/save'; activity: LearningActivity }
  | { type: 'learning/remove'; id: string }
  /* Edição de dias já passados (Modo Pais) */
  | { type: 'day/fill'; date: ISODate }
  | { type: 'day/clear'; date: ISODate }
  /* Trabalhos extra */
  | { type: 'job/claim'; jobId: string }
  | { type: 'job/submit'; completionId: string }
  | { type: 'job/giveUp'; completionId: string }
  | { type: 'job/approve'; completionId: string }
  | { type: 'job/reject'; completionId: string; note?: string }
  | { type: 'job/save'; job: ExtraJob }
  | { type: 'job/remove'; id: string }
  /* Recompensas e cofrinhos */
  | { type: 'tiers/save'; tiers: RewardTier[] }
  | { type: 'wallets/percent'; percents: Record<WalletId, number> }
  /* Dinheiro */
  | { type: 'transaction/add'; transaction: Omit<Transaction, 'id' | 'date'> & { date?: string } }
  | { type: 'transaction/remove'; id: string }
  /** Saldo inicial: substitui sempre o anterior, para poder ser corrigido. */
  | { type: 'money/setOpeningBalance'; amounts: Record<WalletId, number>; description: string }
  /* Objetivo */
  | { type: 'goal/save'; goal: SavingsGoal }
  | { type: 'goal/remove'; id: string }
  | { type: 'goal/celebrated'; id: string }
  | { type: 'goal/buy'; id: string }
  /* Semana */
  | { type: 'week/close'; chosenPrivilege?: string }
  /* Histórico */
  | { type: 'history/addManual'; record: WeeklyRecord; createTransactions: boolean }
  | { type: 'history/remove'; id: string }
  /* Configurações e dados */
  | { type: 'settings/update'; patch: Partial<AppSettings> }
  | { type: 'profile/update'; patch: Partial<ChildProfile> }
  | { type: 'state/replace'; state: AppState }
  | { type: 'state/reset' }
