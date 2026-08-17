import { useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { Card, Section } from '../ui/Card'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { PinPad } from '../ui/PinPad'
import { hashPin, verifyPin } from '../../utils/pin'

type Step = 'current' | 'new' | 'repeat'

export function PinSettings() {
  const { state, dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('current')
  const [firstPin, setFirstPin] = useState('')
  const [done, setDone] = useState(false)

  const start = () => {
    setStep(state.settings.pinHash ? 'current' : 'new')
    setFirstPin('')
    setDone(false)
    setOpen(true)
  }

  const handleSubmit = async (pin: string): Promise<boolean> => {
    if (step === 'current') {
      const ok = await verifyPin(pin, state.settings.pinHash)
      if (ok) setStep('new')
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
    setDone(true)
    setOpen(false)
    return true
  }

  return (
    <Section title="PIN dos pais" emoji="🔐" hint="O PIN é guardado cifrado — nunca aparece em texto aberto.">
      <Card className="space-y-3">
        <p className="text-sm text-ink-soft">
          {state.settings.pinHash
            ? 'O Modo Pais está protegido por PIN de 4 dígitos.'
            : 'Ainda não existe PIN definido.'}
        </p>
        <Button variant="secondary" onClick={start}>
          {state.settings.pinHash ? '🔑 Alterar PIN' : '🔑 Definir PIN'}
        </Button>
        {done && (
          <p className="text-sm font-bold text-grow-700" role="status">
            ✓ PIN atualizado.
          </p>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="PIN dos pais" emoji="🔐" size="sm">
        <PinPad
          key={step}
          title={
            step === 'current'
              ? 'PIN atual'
              : step === 'new'
                ? 'Novo PIN'
                : 'Repete o novo PIN'
          }
          description={
            step === 'repeat' ? 'Escreve outra vez para confirmar.' : 'Quatro dígitos.'
          }
          submitLabel="Continuar"
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </Section>
  )
}
