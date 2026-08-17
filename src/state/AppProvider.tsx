import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { AppContext, type AppContextValue } from './appContext'
import { appReducer } from './appReducer'
import { storageService } from '../services/storageService'

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, () => storageService.load())

  // Persistência: qualquer alteração ao estado é gravada imediatamente.
  useEffect(() => {
    storageService.save(state)
  }, [state])

  const exportJson = useCallback(() => storageService.serialize(state), [state])

  const importJson = useCallback((raw: string) => {
    const imported = storageService.parseBundle(raw)
    dispatch({ type: 'state/replace', state: imported })
  }, [])

  const resetAll = useCallback(() => {
    storageService.clear()
    dispatch({ type: 'state/reset' })
  }, [])

  const value = useMemo<AppContextValue>(
    () => ({ state, dispatch, exportJson, importJson, resetAll }),
    [state, exportJson, importJson, resetAll],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
