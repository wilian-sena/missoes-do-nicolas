import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' | 'star'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm',
  secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100 ring-1 ring-brand-100',
  ghost: 'bg-transparent text-ink-soft hover:bg-black/5',
  success: 'bg-grow-500 text-white hover:bg-grow-700 shadow-sm',
  danger: 'bg-berry-500 text-white hover:bg-berry-700 shadow-sm',
  star: 'bg-star-400 text-[#4a3200] hover:brightness-105 shadow-sm',
}

const SIZES: Record<Size, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-base',
  lg: 'min-h-14 px-6 text-lg',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  block?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-[transform,background-color,filter] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
