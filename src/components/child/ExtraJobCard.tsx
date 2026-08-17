import type { ExtraJob, ExtraJobCompletion } from '../../types'
import { formatEuro } from '../../utils/money'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'

interface ExtraJobCardProps {
  job: ExtraJob
  completion?: ExtraJobCompletion
  onClaim: () => void
  onSubmit: () => void
  onGiveUp: () => void
}

/** Fluxo: "Quero fazer" → "Terminei" → a aguardar aprovação → aprovado. */
export function ExtraJobCard({ job, completion, onClaim, onSubmit, onGiveUp }: ExtraJobCardProps) {
  const status = completion?.status

  return (
    <li
      className={cn(
        'rounded-[var(--radius-card)] p-4 ring-1 transition',
        status === 'approved'
          ? 'bg-grow-50 ring-grow-100'
          : status === 'submitted'
            ? 'bg-star-50 ring-star-100'
            : status === 'claimed'
              ? 'bg-coin-50 ring-coin-100'
              : 'bg-paper ring-black/5',
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl"
          aria-hidden="true"
        >
          {job.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base leading-tight font-extrabold text-ink">{job.label}</p>
          {job.description && <p className="mt-0.5 text-xs text-ink-soft">{job.description}</p>}
        </div>
        <span className="shrink-0 rounded-full bg-coin-100 px-3 py-1.5 text-base font-black text-coin-700">
          {formatEuro(job.amount)}
        </span>
      </div>

      <div className="mt-3">
        {!status && (
          <Button block size="lg" onClick={onClaim} variant="secondary">
            <span aria-hidden="true">🙋</span> Quero fazer
          </Button>
        )}

        {status === 'claimed' && (
          <div className="flex gap-2">
            <Button className="flex-1" size="lg" onClick={onSubmit} variant="success">
              <span aria-hidden="true">✓</span> Terminei!
            </Button>
            <Button size="lg" variant="ghost" onClick={onGiveUp}>
              Desistir
            </Button>
          </div>
        )}

        {status === 'submitted' && (
          <p className="rounded-2xl bg-white px-3 py-3 text-center text-sm font-bold text-star-600 ring-1 ring-star-100">
            <span aria-hidden="true">⏳ </span>A aguardar aprovação
          </p>
        )}

        {status === 'approved' && (
          <p className="rounded-2xl bg-white px-3 py-3 text-center text-sm font-bold text-grow-700 ring-1 ring-grow-100">
            <span aria-hidden="true">✓ </span>Aprovado — {formatEuro(completion?.amount ?? 0)} nos
            ganhos desta semana
          </p>
        )}

        {status === 'rejected' && (
          <div className="space-y-2">
            <p className="rounded-2xl bg-white px-3 py-3 text-center text-sm font-bold text-ink-soft ring-1 ring-black/10">
              <span aria-hidden="true">↩️ </span>
              {completion?.parentNote || 'Ainda não está pronto. Podes tentar de novo!'}
            </p>
            <Button block size="lg" variant="secondary" onClick={onClaim}>
              Tentar outra vez
            </Button>
          </div>
        )}
      </div>
    </li>
  )
}
