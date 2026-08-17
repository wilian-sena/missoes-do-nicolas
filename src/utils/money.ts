/** Toda a aritmética passa por cêntimos para evitar erros de vírgula flutuante. */

export function toCents(euros: number): number {
  return Math.round(euros * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}

/** Arredonda para 2 casas decimais. */
export function roundMoney(value: number): number {
  return fromCents(toCents(value))
}

export function sumMoney(values: number[]): number {
  return fromCents(values.reduce((acc, value) => acc + toCents(value), 0))
}

/** Ex.: `€5,50`. */
export function formatEuro(value: number): string {
  const safe = Number.isFinite(value) ? value : 0
  const sign = safe < 0 ? '-' : ''
  const abs = Math.abs(roundMoney(safe))
  return `${sign}€${abs.toFixed(2).replace('.', ',')}`
}

/**
 * Divide um valor por percentagens sem perder um único cêntimo
 * (método do maior resto — a sobra vai para as maiores frações).
 */
export function splitByPercent<T extends string>(
  total: number,
  parts: { id: T; percent: number }[],
): Record<T, number> {
  const totalCents = toCents(total)
  const percentSum = parts.reduce((acc, part) => acc + part.percent, 0) || 1

  const raw = parts.map((part) => {
    const exact = (totalCents * part.percent) / percentSum
    const floor = Math.floor(exact)
    return { id: part.id, floor, remainder: exact - floor }
  })

  const assigned = raw.reduce((acc, part) => acc + part.floor, 0)
  const leftover = totalCents - assigned
  const order = [...raw].sort((a, b) => b.remainder - a.remainder)

  const result = {} as Record<T, number>
  for (const part of raw) result[part.id] = part.floor

  for (let i = 0; i < Math.abs(leftover); i += 1) {
    const target = order[i % order.length]
    result[target.id] += Math.sign(leftover)
  }

  for (const id of Object.keys(result) as T[]) {
    result[id] = fromCents(result[id])
  }
  return result
}

/** Interpreta "2,50" e "2.50" da mesma forma. */
export function parseMoneyInput(value: string): number | null {
  const normalised = value.trim().replace(/€/g, '').replace(',', '.')
  if (normalised === '') return null
  const parsed = Number(normalised)
  if (!Number.isFinite(parsed)) return null
  return roundMoney(parsed)
}
