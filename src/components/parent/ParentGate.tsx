import { useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { PinPad } from '../ui/PinPad'
import { Card } from '../ui/Card'
import { hashPin, verifyPin } from '../../utils/pin'

interface ParentGateProps {
  onUnlock: () => void
  onCancel: () => void
}

/** Primeiro acesso: define o PIN. Depois: pede o PIN. */
export function ParentGate({ onUnlock, onCancel }: ParentGateProps) {
  const { state, dispatch } = useApp()
  const hasPin = Boolean(state.settings.pinHash)
  const [step, setStep] = useState<'new' | 'repeat'>('new')
  const [firstPin, setFirstPin] = useState('')

  const submit = async (pin: string): Promise<boolean> => {
    if (hasPin) {
      const ok = await verifyPin(pin, state.settings.pinHash)
      if (ok) onUnlock()
      return ok
    }
    if (step === 'new') {
      setFirstPin(pin)
      setStep('repeat')
      return true
    }
    if (pin !== firstPin) {
      setStep('new')
      setFirstPin('')
      return false
    }
    dispatch({ type: 'settings/update', patch: { pinHash: await hashPin(pin) } })
    onUnlock()
    return true
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card className="space-y-5">
        <PinPad
          key={hasPin ? 'unlock' : step}
          title={hasPin ? 'Modo Pais' : step === 'new' ? 'Criar PIN dos pais' : 'Repete o PIN'}
          description={
            hasPin
              ? 'Escreve o PIN de 4 dígitos.'
              : step === 'new'
                ? 'Escolhe um PIN de 4 dígitos que o Nicolas não adivinhe.'
                : 'Escreve outra vez para confirmar.'
          }
          submitLabel={hasPin ? 'Entrar' : 'Continuar'}
          onSubmit={submit}
          onCancel={onCancel}
        />
        {!hasPin && (
          <p className="rounded-2xl bg-cloud p-3 text-xs text-ink-soft">
            O PIN é guardado apenas neste dispositivo e em forma cifrada. Se for esquecido, é
            possível repor tudo apagando os dados da aplicação — por isso convém exportar uma cópia
            de vez em quando.
          </p>
        )}
      </Card>
    </div>
  )
}
