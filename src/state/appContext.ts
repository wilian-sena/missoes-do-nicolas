import { createContext, type Dispatch } from 'react'
import type { AppState } from '../types'
import type { AppAction } from './actions'

export interface AppContextValue {
  state: AppState
  dispatch: Dispatch<AppAction>
  /** Devolve o conteúdo JSON da exportação. */
  exportJson: () => string
  /** Lê um ficheiro JSON e substitui o estado. Lança erro se o ficheiro for inválido. */
  importJson: (raw: string) => void
  resetAll: () => void
}

export const AppContext = createContext<AppContextValue | null>(null)
