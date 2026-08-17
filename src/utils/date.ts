import type { ISODate } from '../types'

const DAY_MS = 24 * 60 * 60 * 1000

/** Data local (não UTC) no formato YYYY-MM-DD. */
export function toISODate(date: Date): ISODate {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromISODate(value: ISODate): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function today(now: Date = new Date()): ISODate {
  return toISODate(now)
}

/** Segunda-feira da semana a que a data pertence. */
export function startOfWeek(date: Date | ISODate): ISODate {
  const d = typeof date === 'string' ? fromISODate(date) : new Date(date)
  const day = d.getDay() // 0 = domingo
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return toISODate(d)
}

/** Domingo da semana que começa em `weekStart`. */
export function endOfWeek(weekStart: ISODate): ISODate {
  return addDays(weekStart, 6)
}

export function addDays(date: ISODate, days: number): ISODate {
  const d = fromISODate(date)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** Os 7 dias (segunda → domingo) da semana. */
export function weekDays(weekStart: ISODate): ISODate[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

export function isWithinWeek(date: ISODate, weekStart: ISODate): boolean {
  return date >= weekStart && date <= endOfWeek(weekStart)
}

export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((fromISODate(to).getTime() - fromISODate(from).getTime()) / DAY_MS)
}

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEKDAY_LONG = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
]
const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

export function weekdayShort(date: ISODate): string {
  return WEEKDAY_SHORT[fromISODate(date).getDay()]
}

export function weekdayLong(date: ISODate): string {
  return WEEKDAY_LONG[fromISODate(date).getDay()]
}

/** Ex.: "11 de agosto". */
export function formatDayMonth(date: ISODate): string {
  const d = fromISODate(date)
  return `${d.getDate()} de ${MONTHS[d.getMonth()]}`
}

/** Ex.: "3–9 agosto" ou "28 julho – 3 agosto". */
export function formatWeekRange(weekStart: ISODate): string {
  const start = fromISODate(weekStart)
  const end = fromISODate(endOfWeek(weekStart))
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${MONTHS[end.getMonth()]}`
  }
  return `${start.getDate()} ${MONTHS[start.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]}`
}

/** Ex.: "11/08/2026, 18:30". */
export function formatDateTime(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${date}, ${time}`
}

export function isSunday(date: ISODate): boolean {
  return fromISODate(date).getDay() === 0
}
