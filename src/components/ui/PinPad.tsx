import { useState } from 'react'
import { Button } from './Button'
import { cn } from '../../utils/cn'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

interface PinPadProps {
  title: string
  description?: string
  /** Devolve true quando o PIN é aceite. */
  onSubmit: (pin: string) => Promise<boolean> | boolean
  onCancel?: () => void
  submitLabel?: string
}

/** Teclado numérico. O PIN aparece sempre mascarado (nunca em texto aberto). */
export function PinPad({ title, description, onSubmit, onCancel, submitLabel = 'Entrar' }: PinPadProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const press = (key: string) => {
    setError(null)
    if (key === '⌫') {
      setPin((current) => current.slice(0, -1))
      return
    }
    if (!key) return
    setPin((current) => (current.length >= 4 ? current : current + key))
  }

  const submit = async () => {
    if (pin.length !== 4 || busy) return
    setBusy(true)
    const accepted = await onSubmit(pin)
    setBusy(false)
    if (!accepted) {
      setError('PIN incorreto. Tenta outra vez.')
      setPin('')
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-extrabold">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>

      <div className="flex justify-center gap-3" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn(
              'h-4 w-4 rounded-full ring-2 ring-brand-300 transition',
              index < pin.length ? 'bg-brand-500' : 'bg-transparent',
            )}
          />
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {pin.length} de 4 dígitos introduzidos.
      </p>

      {error && (
        <p className="text-center text-sm font-bold text-berry-700" role="alert">
          {error}
        </p>
      )}

      <div className="mx-auto grid max-w-xs grid-cols-3 gap-2">
        {KEYS.map((key, index) =>
          key ? (
            <button
              key={key}
              type="button"
              onClick={() => press(key)}
              aria-label={key === '⌫' ? 'Apagar' : key}
              className="min-h-14 rounded-2xl bg-cloud text-xl font-extrabold text-ink ring-1 ring-black/5 transition active:scale-95 hover:bg-brand-50"
            >
              {key}
            </button>
          ) : (
            <span key={`empty-${index}`} />
          ),
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={submit} disabled={pin.length !== 4 || busy} block size="lg">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="ghost" size="lg" onClick={onCancel}>
            Voltar
          </Button>
        )}
      </div>
    </div>
  )
}
