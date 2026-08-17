import { cn } from '../../utils/cn'

export interface NavItem {
  id: string
  label: string
  emoji: string
  badge?: number
}

interface NavBarProps {
  items: NavItem[]
  current: string
  onSelect: (id: string) => void
  /** `bottom` = telemóvel; `side` = tablet/desktop. */
  variant: 'bottom' | 'side'
}

export function NavBar({ items, current, onSelect, variant }: NavBarProps) {
  if (variant === 'side') {
    return (
      <nav aria-label="Navegação principal" className="hidden w-56 shrink-0 p-4 md:block">
        <ul className="sticky top-4 space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <NavButton item={item} active={current === item.id} onSelect={onSelect} variant="side" />
            </li>
          ))}
        </ul>
      </nav>
    )
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-paper/95 px-1 pt-1 backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-between">
        {items.map((item) => (
          <li key={item.id} className="flex-1">
            <NavButton item={item} active={current === item.id} onSelect={onSelect} variant="bottom" />
          </li>
        ))}
      </ul>
    </nav>
  )
}

function NavButton({
  item,
  active,
  onSelect,
  variant,
}: {
  item: NavItem
  active: boolean
  onSelect: (id: string) => void
  variant: 'bottom' | 'side'
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex w-full items-center gap-2 rounded-2xl font-bold transition',
        variant === 'bottom'
          ? 'min-h-14 flex-col justify-center gap-0.5 px-1 py-1.5 text-[11px]'
          : 'min-h-12 px-3 text-sm',
        active
          ? 'bg-brand-50 text-brand-700'
          : 'text-ink-soft hover:bg-black/5',
      )}
    >
      <span className={cn('leading-none', variant === 'bottom' ? 'text-xl' : 'text-lg')} aria-hidden="true">
        {item.emoji}
      </span>
      <span className={cn(variant === 'bottom' && 'leading-tight')}>{item.label}</span>
      {item.badge ? (
        <span
          className="absolute top-1 right-2 min-w-5 rounded-full bg-berry-500 px-1.5 py-0.5 text-[10px] leading-none font-extrabold text-white"
          aria-label={`${item.badge} por tratar`}
        >
          {item.badge}
        </span>
      ) : null}
    </button>
  )
}
