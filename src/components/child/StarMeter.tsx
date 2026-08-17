import type { RewardTier } from '../../types'
import { ProgressBar } from '../ui/ProgressBar'
import type { NextTierInfo } from '../../utils/scoring'

interface StarMeterProps {
  stars: number
  max: number
  tier?: RewardTier
  next: NextTierInfo | null
  compact?: boolean
}

/** Barra grande de estrelas da semana + nível atual + quanto falta para o próximo. */
export function StarMeter({ stars, max, tier, next, compact = false }: StarMeterProps) {
  return (
    <div className="rounded-[var(--radius-card)] bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white shadow-[0_10px_30px_-16px_rgba(58,69,180,0.9)]">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-white/80">Estrelas da semana</p>
          <p className="text-4xl leading-none font-black">
            <span aria-hidden="true">⭐ </span>
            {stars}
            <span className="text-2xl font-extrabold text-white/70"> / {max}</span>
          </p>
        </div>
        {tier && (
          <div className="text-right">
            <p className="text-xs font-bold text-white/70">Nível atual</p>
            <p className="text-base font-extrabold">
              <span aria-hidden="true">{tier.emoji} </span>
              {tier.name}
            </p>
          </div>
        )}
      </div>

      <ProgressBar
        value={stars}
        max={max}
        tone="star"
        size="lg"
        className="mt-4 bg-white/25"
        label={`${stars} de ${max} estrelas`}
      />

      {!compact && (
        <div className="mt-4 rounded-2xl bg-white/15 p-3 text-sm">
          {next ? (
            <p>
              Faltam <strong className="text-base font-black">{next.starsMissing}</strong>{' '}
              {next.starsMissing === 1 ? 'estrela' : 'estrelas'} para desbloquear:
              <br />
              <span className="font-extrabold">
                <span aria-hidden="true">{next.tier.emoji} </span>
                {next.tier.privilege}
              </span>
            </p>
          ) : (
            <p className="font-extrabold">
              <span aria-hidden="true">🏆 </span>
              Chegaste ao nível mais alto desta semana. Que semana extraordinária!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
