/**
 * Modelo de dados da aplicação "Missões do Nicolas".
 *
 * Princípio central: estrelas e dinheiro NUNCA se misturam.
 *  - Responsabilidades  -> estrelas
 *  - Aprendizagem       -> estrelas
 *  - Trabalhos extra    -> dinheiro
 *  - Semanada           -> dinheiro (independente das estrelas)
 */

/** Data no formato `YYYY-MM-DD` (sempre local, nunca UTC). */
export type ISODate = string
/** Data e hora completa (ISO 8601). */
export type ISODateTime = string

export type CompletionStatus = 'pending' | 'approved'

export interface ChildProfile {
  name: string
  emoji: string
  birthYear?: number
}

/** `simple` = uma marcação; `twice` = manhã + noite (1 estrela só quando ambas). */
export type ResponsibilityMode = 'simple' | 'twice'

export interface Responsibility {
  id: string
  label: string
  shortLabel: string
  emoji: string
  hint?: string
  mode: ResponsibilityMode
  requiresApproval: boolean
  active: boolean
  order: number
}

export interface ResponsibilityCompletion {
  id: string
  responsibilityId: string
  date: ISODate
  /** Só usado quando `mode === 'twice'`. */
  morning: boolean
  /** Só usado quando `mode === 'twice'`. */
  night: boolean
  /** Verdadeiro quando a responsabilidade está inteiramente feita nesse dia. */
  done: boolean
  status: CompletionStatus
  markedAt: ISODateTime
  approvedAt?: ISODateTime
}

export interface LearningActivity {
  id: string
  label: string
  emoji: string
  /** Meta descrita em linguagem simples (ex.: "10 a 15 minutos de piano"). */
  goal: string
  requiresApproval: boolean
  active: boolean
  order: number
}

export interface LearningCompletion {
  id: string
  activityId: string
  date: ISODate
  status: CompletionStatus
  markedAt: ISODateTime
  approvedAt?: ISODateTime
}

export interface ExtraJob {
  id: string
  label: string
  emoji: string
  /** Valor em euros. */
  amount: number
  description?: string
  available: boolean
  order: number
}

export type ExtraJobStatus = 'claimed' | 'submitted' | 'approved' | 'rejected'

export interface ExtraJobCompletion {
  id: string
  jobId: string
  /** Cópia do nome/valor no momento da escolha (o histórico não muda se o pai editar depois). */
  label: string
  emoji: string
  amount: number
  status: ExtraJobStatus
  weekStart: ISODate
  claimedAt: ISODateTime
  submittedAt?: ISODateTime
  resolvedAt?: ISODateTime
  parentNote?: string
}

export interface RewardTier {
  id: string
  min: number
  max: number
  name: string
  emoji: string
  privilege: string
  /** Opções entre as quais a criança pode escolher (o nível mais alto usa isto). */
  options: string[]
  order: number
}

export type WalletId = 'spend' | 'save' | 'share'

export interface Wallet {
  id: WalletId
  label: string
  emoji: string
  description: string
  /** Percentagem da distribuição semanal (o total dos três tem de dar 100). */
  percent: number
}

export type TransactionType =
  | 'opening'
  | 'allowance'
  | 'extra_job'
  | 'spend'
  | 'transfer'
  | 'saving'
  | 'share_use'
  | 'adjustment'

export interface Transaction {
  id: string
  date: ISODateTime
  /** Euros. Positivo = entra; negativo = sai. Em transferências é sempre positivo. */
  amount: number
  type: TransactionType
  /** Cofrinho afetado (origem, no caso de transferência). */
  wallet: WalletId
  /** Cofrinho de destino — apenas em transferências. */
  toWallet?: WalletId
  description: string
  /** Etiqueta simples do gasto ou da partilha (ex.: "Cromos"). */
  category?: string
  weekStart?: ISODate
}

export interface SavingsGoal {
  id: string
  name: string
  emoji: string
  /** Preço em euros. */
  price: number
  createdAt: ISODateTime
  active: boolean
  /** Marcado quando os pais confirmam a compra. */
  completedAt?: ISODateTime
  /** Evita repetir a celebração sempre que o ecrã abre. */
  celebrated: boolean
}

export interface WeeklyRecord {
  id: string
  weekStart: ISODate
  weekEnd: ISODate
  responsibilityStars: number
  responsibilityMax: number
  learningStars: number
  learningMax: number
  totalStars: number
  maxStars: number
  tierId: string
  tierName: string
  tierEmoji: string
  privilege: string
  /** Privilégio escolhido, quando o nível permite escolher entre opções. */
  chosenPrivilege?: string
  allowance: number
  extras: number
  total: number
  distribution: Record<WalletId, number>
  closedAt: ISODateTime
  /** Semana lançada à mão pelos pais (ex.: as que já tinham feito em papel). */
  manual?: boolean
}

export interface AppSettings {
  /** Guardado sempre como hash — o PIN nunca é persistido em texto aberto. */
  pinHash: string | null
  /** Semanada em euros. */
  allowance: number
  currency: 'EUR'
  maxLearningStarsPerDay: number
  celebrationsEnabled: boolean
  /** Streak discreto de dias consecutivos com todas as responsabilidades feitas. */
  showStreak: boolean
  /** Esconde o cartão de arranque no Resumo dos pais. */
  onboardingDismissed: boolean
}

export interface AppState {
  schemaVersion: number
  profile: ChildProfile
  settings: AppSettings
  responsibilities: Responsibility[]
  learningActivities: LearningActivity[]
  extraJobs: ExtraJob[]
  rewardTiers: RewardTier[]
  wallets: Wallet[]
  responsibilityCompletions: ResponsibilityCompletion[]
  learningCompletions: LearningCompletion[]
  extraJobCompletions: ExtraJobCompletion[]
  transactions: Transaction[]
  savingsGoals: SavingsGoal[]
  weeklyRecords: WeeklyRecord[]
  currentWeekStart: ISODate
  updatedAt: ISODateTime
}

/** Ficheiro de exportação/importação. */
export interface ExportBundle {
  app: 'missoes-do-nicolas'
  schemaVersion: number
  exportedAt: ISODateTime
  state: AppState
}
