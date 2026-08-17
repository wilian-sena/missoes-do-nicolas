import type {
  AppState,
  ExtraJob,
  LearningActivity,
  Responsibility,
  RewardTier,
  Wallet,
} from '../types'
import { startOfWeek, today } from '../utils/date'

export const SCHEMA_VERSION = 1
export const STORAGE_KEY = 'missoes-do-nicolas:v1'

export const DEFAULT_RESPONSIBILITIES: Responsibility[] = [
  {
    id: 'resp_brinquedos',
    label: 'Arrumar os brinquedos',
    shortLabel: 'Arrumar brinquedos',
    emoji: '🧸',
    mode: 'simple',
    requiresApproval: false,
    active: true,
    order: 1,
  },
  {
    id: 'resp_roupa',
    label: 'Colocar a roupa suja no cesto',
    shortLabel: 'Roupa no cesto',
    emoji: '🧺',
    mode: 'simple',
    requiresApproval: false,
    active: true,
    order: 2,
  },
  {
    id: 'resp_mesa',
    label: 'Ajudar a pôr a mesa',
    shortLabel: 'Ajudar na mesa',
    emoji: '🍽️',
    mode: 'simple',
    requiresApproval: false,
    active: true,
    order: 3,
  },
  {
    id: 'resp_banho',
    label: 'Tomar banho com pouca ou nenhuma ajuda',
    shortLabel: 'Banho',
    emoji: '🛁',
    mode: 'simple',
    requiresApproval: false,
    active: true,
    order: 4,
  },
  {
    id: 'resp_dentes',
    label: 'Escovar os dentes de manhã e à noite',
    shortLabel: 'Escovar dentes',
    emoji: '🪥',
    hint: 'A estrela chega quando as duas escovagens estiverem feitas.',
    mode: 'twice',
    requiresApproval: false,
    active: true,
    order: 5,
  },
  {
    id: 'resp_wc',
    label: 'Autonomia no WC: limpar-me e lavar as mãos',
    shortLabel: 'Autonomia WC',
    emoji: '🚻',
    hint: 'Uma avaliação do dia inteiro — não é preciso marcar de cada vez.',
    mode: 'simple',
    requiresApproval: false,
    active: true,
    order: 6,
  },
]

export const DEFAULT_LEARNING_ACTIVITIES: LearningActivity[] = [
  {
    id: 'learn_piano',
    label: 'Piano',
    emoji: '🎹',
    goal: '10 a 15 minutos de prática, ou uma música/atividade combinada.',
    requiresApproval: false,
    active: true,
    order: 1,
  },
  {
    id: 'learn_ingles',
    label: 'Inglês',
    emoji: '🇬🇧',
    goal: 'Pelo menos uma lição no Duolingo.',
    requiresApproval: false,
    active: true,
    order: 2,
  },
  {
    id: 'learn_xadrez',
    label: 'Xadrez',
    emoji: '♟️',
    goal: 'Um exercício, puzzle, partida ou 10 minutos de prática.',
    requiresApproval: false,
    active: true,
    order: 3,
  },
]

export const DEFAULT_EXTRA_JOBS: ExtraJob[] = [
  { id: 'job_gaveta', label: 'Organizar uma gaveta comum', emoji: '🗄️', amount: 0.5, available: true, order: 1 },
  { id: 'job_sapateira', label: 'Organizar a sapateira', emoji: '👟', amount: 0.75, available: true, order: 2 },
  { id: 'job_reciclagem', label: 'Separar a reciclagem', emoji: '♻️', amount: 0.5, available: true, order: 3 },
  { id: 'job_rodapes', label: 'Limpar rodapés de uma divisão', emoji: '🧽', amount: 0.75, available: true, order: 4 },
  { id: 'job_portas', label: 'Limpar marcas de portas ou interruptores', emoji: '🚪', amount: 0.5, available: true, order: 5 },
  { id: 'job_aspirar', label: 'Ajudar a aspirar uma divisão', emoji: '🧹', amount: 1, available: true, order: 6 },
  { id: 'job_varanda', label: 'Ajudar a limpar a varanda', emoji: '🪴', amount: 1, available: true, order: 7 },
  { id: 'job_bagunca', label: 'Organizar uma bagunça que não é minha', emoji: '📦', amount: 1, available: true, order: 8 },
]

export const DEFAULT_REWARD_TIERS: RewardTier[] = [
  {
    id: 'tier_construcao',
    min: 0,
    max: 29,
    name: 'Em construção',
    emoji: '🧱',
    privilege: 'Sem privilégio especial esta semana',
    options: [],
    order: 1,
  },
  {
    id: 'tier_boa',
    min: 30,
    max: 39,
    name: 'Boa semana',
    emoji: '🍮',
    privilege: 'Escolher a sobremesa da família num dia (entre as opções permitidas)',
    options: [],
    order: 2,
  },
  {
    id: 'tier_muito_boa',
    min: 40,
    max: 47,
    name: 'Muito boa semana',
    emoji: '🎬',
    privilege: 'Escolher o jogo ou o filme em família',
    options: [],
    order: 3,
  },
  {
    id: 'tier_excelente',
    min: 48,
    max: 53,
    name: 'Excelente semana',
    emoji: '🌳',
    privilege: 'Escolher o passeio ou a atividade da família (entre as opções dos pais)',
    options: [],
    order: 4,
  },
  {
    id: 'tier_extraordinaria',
    min: 54,
    max: 56,
    name: 'Semana extraordinária',
    emoji: '🏆',
    privilege: 'Escolher um privilégio especial',
    options: [
      'Acampamento na sala',
      'Escolher o jantar',
      'Noite especial de jogos',
      'Ficar acordado mais 30 minutos no sábado',
    ],
    order: 5,
  },
]

export const DEFAULT_WALLETS: Wallet[] = [
  {
    id: 'spend',
    label: 'Gastar',
    emoji: '🛍️',
    description: 'Dinheiro disponível para pequenas escolhas minhas.',
    percent: 50,
  },
  {
    id: 'save',
    label: 'Guardar',
    emoji: '🏦',
    description: 'Poupança para objetivos maiores.',
    percent: 40,
  },
  {
    id: 'share',
    label: 'Partilhar',
    emoji: '💝',
    description: 'Para oferecer, doar ou ajudar alguém.',
    percent: 10,
  },
]

export const GOAL_EMOJIS = ['🎮', '🧱', '🚲', '🎹', '⚽', '📚', '🛴', '🎁']

/** Etiquetas rápidas para registar um gasto — evitam campos em branco. */
export const SPEND_CATEGORIES = [
  { label: 'Brinquedo', emoji: '🧸' },
  { label: 'Cromos', emoji: '🃏' },
  { label: 'Livro', emoji: '📚' },
  { label: 'Guloseima', emoji: '🍬' },
  { label: 'Jogo', emoji: '🎮' },
  { label: 'Passeio', emoji: '🎡' },
  { label: 'Outra coisa', emoji: '🛍️' },
]

/** Etiquetas rápidas para o cofrinho Partilhar. */
export const SHARE_CATEGORIES = [
  { label: 'Prenda para alguém', emoji: '🎁' },
  { label: 'Ajudar alguém', emoji: '🤝' },
  { label: 'Doação', emoji: '💝' },
  { label: 'Outra coisa', emoji: '✨' },
]

export function createInitialState(now: Date = new Date()): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: { name: 'Nicolas', emoji: '🚀', birthYear: undefined },
    settings: {
      pinHash: null,
      allowance: 3,
      currency: 'EUR',
      maxLearningStarsPerDay: 2,
      celebrationsEnabled: true,
      showStreak: true,
      onboardingDismissed: false,
    },
    responsibilities: DEFAULT_RESPONSIBILITIES.map((item) => ({ ...item })),
    learningActivities: DEFAULT_LEARNING_ACTIVITIES.map((item) => ({ ...item })),
    extraJobs: DEFAULT_EXTRA_JOBS.map((item) => ({ ...item })),
    rewardTiers: DEFAULT_REWARD_TIERS.map((item) => ({ ...item, options: [...item.options] })),
    wallets: DEFAULT_WALLETS.map((item) => ({ ...item })),
    responsibilityCompletions: [],
    learningCompletions: [],
    extraJobCompletions: [],
    transactions: [],
    savingsGoals: [],
    weeklyRecords: [],
    currentWeekStart: startOfWeek(today(now)),
    updatedAt: now.toISOString(),
  }
}
