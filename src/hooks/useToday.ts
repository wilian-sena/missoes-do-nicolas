import { useEffect, useState } from 'react'
import { today } from '../utils/date'
import type { ISODate } from '../types'

/**
 * Data de hoje, revalidada quando o separador volta a ficar visível
 * (uma app instalada fica dias aberta — o dia não pode "congelar").
 */
export function useToday(): ISODate {
  const [date, setDate] = useState<ISODate>(() => today())

  useEffect(() => {
    const refresh = () => setDate(today())
    const interval = window.setInterval(refresh, 60_000)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return date
}
