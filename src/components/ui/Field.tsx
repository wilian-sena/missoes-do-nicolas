import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

const CONTROL =
  'w-full rounded-2xl border-0 bg-cloud px-4 py-3 text-base font-semibold text-ink ring-1 ring-black/10 placeholder:font-normal placeholder:text-ink-soft/70 focus:ring-2 focus:ring-brand-500'

interface FieldProps {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}

export function Field({ label, hint, children, className }: FieldProps) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      <span className="block text-sm font-bold text-ink-soft">{label}</span>
      {children}
      {hint && <span className="block text-xs text-ink-soft">{hint}</span>}
    </label>
  )
}

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, className)} {...rest} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(CONTROL, className)} {...rest}>
      {children}
    </select>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl bg-cloud p-3 ring-1 ring-black/5">
      <span>
        <span className="block text-sm font-bold text-ink">{label}</span>
        {description && <span className="block text-xs text-ink-soft">{description}</span>}
      </span>
      <span className="relative inline-flex shrink-0 items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="h-7 w-12 rounded-full bg-black/15 transition-colors peer-checked:bg-grow-500 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-brand-500" />
        <span className="pointer-events-none absolute left-1 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  )
}

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
  options: string[]
  label?: string
}

export function EmojiPicker({ value, onChange, options, label = 'Emoji' }: EmojiPickerProps) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-bold text-ink-soft">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            aria-pressed={value === emoji}
            aria-label={`Emoji ${emoji}`}
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ring-1 transition',
              value === emoji
                ? 'bg-brand-50 ring-2 ring-brand-500'
                : 'bg-cloud ring-black/10 hover:bg-brand-50',
            )}
          >
            <span aria-hidden="true">{emoji}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
