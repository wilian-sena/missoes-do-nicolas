import { useEffect, useMemo } from 'react'

const PIECES = ['⭐', '✨', '🎉', '🌟', '🎊']

interface CelebrationProps {
  show: boolean
  /** Milissegundos até avisar que terminou. */
  duration?: number
  /** Chamado quando a animação acaba — quem chama decide o que fazer. */
  onDone?: () => void
}

/** Confete curto e discreto — decorativo, invisível para leitores de ecrã. */
export function Celebration({ show, duration = 1600, onDone }: CelebrationProps) {
  useEffect(() => {
    if (!show || !onDone) return
    const timer = window.setTimeout(onDone, duration)
    return () => window.clearTimeout(timer)
  }, [show, duration, onDone])

  const pieces = useMemo(
    () =>
      Array.from({ length: 16 }, (_, index) => ({
        id: index,
        left: `${(index * 6.5 + (index % 3) * 5) % 96}%`,
        delay: `${(index % 6) * 90}ms`,
        emoji: PIECES[index % PIECES.length],
        size: 14 + (index % 4) * 6,
      })),
    [],
  )

  if (!show) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-64 overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="animate-confetti absolute top-0"
          style={{ left: piece.left, animationDelay: piece.delay, fontSize: piece.size }}
        >
          {piece.emoji}
        </span>
      ))}
    </div>
  )
}
