import type { AppState, ExportBundle } from '../types'
import { SCHEMA_VERSION, STORAGE_KEY, createInitialState } from '../data/defaults'
import { migrateState } from './migrations'

/**
 * Camada de persistência isolada.
 *
 * Toda a aplicação fala apenas com `storageService`. Trocar localStorage por
 * uma API remota (Supabase, por exemplo) significa escrever outro `StorageBackend`
 * e não tocar em mais nada.
 */
export interface StorageBackend {
  read(key: string): string | null
  write(key: string, value: string): void
  remove(key: string): void
}

export const localStorageBackend: StorageBackend = {
  read(key) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null
    } catch {
      return null
    }
  },
  write(key, value) {
    try {
      globalThis.localStorage?.setItem(key, value)
    } catch {
      // Modo privado / quota cheia: a app continua a funcionar em memória.
    }
  },
  remove(key) {
    try {
      globalThis.localStorage?.removeItem(key)
    } catch {
      // Ignorado de propósito.
    }
  },
}

/** Backend em memória — usado nos testes e como alternativa quando não há localStorage. */
export function createMemoryBackend(initial: Record<string, string> = {}): StorageBackend {
  const store = new Map<string, string>(Object.entries(initial))
  return {
    read: (key) => store.get(key) ?? null,
    write: (key, value) => void store.set(key, value),
    remove: (key) => void store.delete(key),
  }
}

export interface StorageService {
  load(): AppState
  save(state: AppState): void
  clear(): AppState
  exportBundle(state: AppState): ExportBundle
  serialize(state: AppState): string
  parseBundle(raw: string): AppState
}

export function createStorageService(
  backend: StorageBackend = localStorageBackend,
  key: string = STORAGE_KEY,
): StorageService {
  return {
    load() {
      const raw = backend.read(key)
      if (!raw) return createInitialState()
      try {
        const parsed = JSON.parse(raw) as Partial<AppState>
        return migrateState(parsed)
      } catch {
        // Dados corrompidos: recomeça com os valores iniciais em vez de rebentar.
        return createInitialState()
      }
    },

    save(state) {
      backend.write(key, JSON.stringify(state))
    },

    clear() {
      backend.remove(key)
      const fresh = createInitialState()
      backend.write(key, JSON.stringify(fresh))
      return fresh
    },

    exportBundle(state) {
      return {
        app: 'missoes-do-nicolas',
        schemaVersion: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        state,
      }
    },

    serialize(state) {
      return JSON.stringify(this.exportBundle(state), null, 2)
    },

    parseBundle(raw) {
      const parsed = JSON.parse(raw) as Partial<ExportBundle> & Partial<AppState>
      const candidate =
        parsed && typeof parsed === 'object' && 'state' in parsed && parsed.state
          ? (parsed.state as Partial<AppState>)
          : (parsed as Partial<AppState>)

      if (!candidate || typeof candidate !== 'object' || !candidate.responsibilities) {
        throw new Error('Ficheiro inválido: não parece uma cópia das Missões do Nicolas.')
      }
      return migrateState(candidate)
    },
  }
}

export const storageService = createStorageService()
