import { useContext } from 'react'
import { AppContext } from '../state/appContext'

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp tem de ser usado dentro de <AppProvider>.')
  }
  return context
}
