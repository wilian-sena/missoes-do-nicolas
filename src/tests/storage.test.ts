import { describe, expect, it } from 'vitest'
import { createMemoryBackend, createStorageService } from '../services/storageService'
import { appReducer } from '../state/appReducer'
import { createInitialState, SCHEMA_VERSION } from '../data/defaults'
import { walletBalances } from '../utils/scoring'

const MONDAY = '2026-08-03'

describe('17. recarregar a página sem perder dados', () => {
  it('lê de volta o estado gravado', () => {
    const backend = createMemoryBackend()
    const service = createStorageService(backend, 'teste')

    let state = { ...createInitialState(new Date('2026-08-03T09:00:00')), currentWeekStart: MONDAY }
    state = appReducer(state, {
      type: 'responsibility/toggle',
      responsibilityId: 'resp_banho',
      date: MONDAY,
    })
    service.save(state)

    // Simula recarregar: novo serviço, mesmo armazenamento.
    const reloaded = createStorageService(backend, 'teste').load()
    expect(reloaded.responsibilityCompletions).toHaveLength(1)
    expect(reloaded.responsibilityCompletions[0].responsibilityId).toBe('resp_banho')
    expect(reloaded.currentWeekStart).toBe(MONDAY)
  })

  it('carrega os dados iniciais quando não há nada guardado', () => {
    const service = createStorageService(createMemoryBackend(), 'vazio')
    const state = service.load()
    expect(state.responsibilities).toHaveLength(6)
    expect(state.learningActivities).toHaveLength(3)
    expect(state.extraJobs).toHaveLength(8)
    expect(state.rewardTiers).toHaveLength(5)
    expect(state.settings.allowance).toBe(3)
  })

  it('recupera de dados corrompidos sem rebentar', () => {
    const backend = createMemoryBackend({ teste: '{ isto não é json' })
    const state = createStorageService(backend, 'teste').load()
    expect(state.responsibilities).toHaveLength(6)
  })
})

describe('18. exportar dados', () => {
  it('gera um JSON com o estado completo', () => {
    const service = createStorageService(createMemoryBackend(), 'teste')
    const state = createInitialState(new Date('2026-08-03T09:00:00'))
    const json = JSON.parse(service.serialize(state))

    expect(json.app).toBe('missoes-do-nicolas')
    expect(json.schemaVersion).toBe(SCHEMA_VERSION)
    expect(json.state.profile.name).toBe('Nicolas')
    expect(json.state.extraJobs).toHaveLength(8)
  })
})

describe('19. importar dados', () => {
  it('restaura estrelas, saldos e histórico', () => {
    const service = createStorageService(createMemoryBackend(), 'teste')
    let original = { ...createInitialState(new Date('2026-08-03T09:00:00')), currentWeekStart: MONDAY }
    original = appReducer(original, {
      type: 'responsibility/toggle',
      responsibilityId: 'resp_mesa',
      date: MONDAY,
    })
    original = appReducer(original, {
      type: 'transaction/add',
      transaction: { amount: 4.5, type: 'allowance', wallet: 'save', description: 'Semanada' },
    })

    const restored = service.parseBundle(service.serialize(original))
    expect(restored.responsibilityCompletions).toHaveLength(1)
    expect(walletBalances(restored.transactions).save).toBe(4.5)
    expect(restored.currentWeekStart).toBe(MONDAY)
  })

  it('aceita também um ficheiro só com o estado', () => {
    const service = createStorageService(createMemoryBackend(), 'teste')
    const state = createInitialState()
    const restored = service.parseBundle(JSON.stringify(state))
    expect(restored.profile.name).toBe('Nicolas')
  })

  it('rejeita ficheiros que não são da aplicação', () => {
    const service = createStorageService(createMemoryBackend(), 'teste')
    expect(() => service.parseBundle('{"qualquer":"coisa"}')).toThrow()
  })

  it('preenche campos em falta de versões antigas', () => {
    const service = createStorageService(createMemoryBackend(), 'teste')
    const antigo = JSON.stringify({
      schemaVersion: 0,
      responsibilities: createInitialState().responsibilities,
    })
    const restored = service.parseBundle(antigo)
    expect(restored.schemaVersion).toBe(SCHEMA_VERSION)
    expect(restored.wallets).toHaveLength(3)
    expect(restored.transactions).toEqual([])
  })
})

describe('apagar dados', () => {
  it('volta aos valores iniciais', () => {
    const backend = createMemoryBackend()
    const service = createStorageService(backend, 'teste')
    let state = createInitialState()
    state = appReducer(state, {
      type: 'responsibility/toggle',
      responsibilityId: 'resp_mesa',
      date: MONDAY,
    })
    service.save(state)

    const fresh = service.clear()
    expect(fresh.responsibilityCompletions).toEqual([])
    expect(service.load().responsibilityCompletions).toEqual([])
  })
})
