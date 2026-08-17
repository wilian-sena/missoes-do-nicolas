import type { TransactionType } from '../types'

/** Como cada tipo de movimento se apresenta — usado no livro e nos cofrinhos. */
export const TRANSACTION_META: Record<TransactionType, { label: string; emoji: string }> = {
  opening: { label: 'Saldo inicial', emoji: '🏁' },
  allowance: { label: 'Semanada', emoji: '📅' },
  extra_job: { label: 'Trabalho extra', emoji: '🧹' },
  spend: { label: 'Gasto', emoji: '🛍️' },
  transfer: { label: 'Transferência', emoji: '🔁' },
  saving: { label: 'Poupança', emoji: '🏦' },
  share_use: { label: 'Partilha', emoji: '💝' },
  adjustment: { label: 'Ajuste dos pais', emoji: '✏️' },
}

export function transactionMeta(type: TransactionType) {
  return TRANSACTION_META[type] ?? { label: type, emoji: '•' }
}
