import { useMemo, useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Celebration } from '../ui/Celebration'
import { WalletCard } from '../child/WalletCard'
import { ProgressBar } from '../ui/ProgressBar'
import { buildWeekClosePreview } from '../../services/weekService'
import { formatEuro } from '../../utils/money'
import { formatWeekRange } from '../../utils/date'
import { cn } from '../../utils/cn'

interface CloseWeekModalProps {
  open: boolean
  onClose: () => void
}

/**
 * Fecho da semana em dois passos:
 *  1. resumo (estrelas, privilégio, dinheiro e distribuição);
 *  2. confirmação explícita dos pais.
 */
export function CloseWeekModal({ open, onClose }: CloseWeekModalProps) {
  const { state, dispatch } = useApp()
  const preview = useMemo(() => buildWeekClosePreview(state), [state])
  const [chosenPrivilege, setChosenPrivilege] = useState<string>('')
  const [confirming, setConfirming] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  const confirm = () => {
    dispatch({ type: 'week/close', chosenPrivilege: chosenPrivilege || undefined })
    if (state.settings.celebrationsEnabled) setCelebrate(true)
    setConfirming(false)
    setChosenPrivilege('')
    onClose()
  }

  return (
    <>
      <Celebration show={celebrate} duration={2200} onDone={() => setCelebrate(false)} />

      <Modal
        open={open}
        onClose={onClose}
        title="Fechar a semana"
        emoji="🏁"
        size="lg"
        footer={
          <>
            <Button size="lg" className="flex-1" onClick={() => setConfirming(true)}>
              Confirmar e começar nova semana
            </Button>
            <Button size="lg" variant="ghost" onClick={onClose}>
              Ainda não
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="rounded-[var(--radius-card)] bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-center text-white">
            <p className="text-sm font-bold text-white/80">
              Missão concluída · {formatWeekRange(preview.weekStart)}
            </p>
            <p className="mt-1 text-4xl font-black">
              <span aria-hidden="true">⭐ </span>
              {preview.totals.totalStars}
              <span className="text-2xl text-white/70"> / {preview.totals.maxStars}</span>
            </p>
            <ProgressBar
              value={preview.totals.totalStars}
              max={preview.totals.maxStars}
              size="lg"
              className="mt-3 bg-white/25"
            />
            <p className="mt-3 text-lg font-extrabold">
              <span aria-hidden="true">{preview.tierEmoji} </span>
              {preview.tierName}
            </p>
            <p className="text-sm text-white/85">{preview.privilege}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Line label="Responsabilidades" value={`${preview.totals.responsibilityStars} / ${preview.totals.responsibilityMax} ⭐`} />
            <Line label="Aprendizagem" value={`${preview.totals.learningStars} / ${preview.totals.learningMax} ⭐`} />
            <Line label="Semanada" value={formatEuro(preview.allowance)} />
            <Line label="Trabalhos extra" value={formatEuro(preview.extras)} />
            <Line label="Total da semana" value={formatEuro(preview.total)} strong />
          </div>

          {preview.privilegeOptions.length > 0 && (
            <fieldset>
              <legend className="mb-2 text-sm font-bold text-ink-soft">
                Privilégio escolhido (opcional)
              </legend>
              <div className="flex flex-wrap gap-2">
                {preview.privilegeOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setChosenPrivilege(option === chosenPrivilege ? '' : option)}
                    aria-pressed={chosenPrivilege === option}
                    className={cn(
                      'min-h-11 rounded-2xl px-3.5 text-sm font-bold ring-1 transition',
                      chosenPrivilege === option
                        ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-500'
                        : 'bg-cloud text-ink-soft ring-black/10',
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div>
            <p className="mb-2 text-sm font-bold text-ink-soft">
              O dinheiro vai ser dividido assim:
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {state.wallets.map((wallet) => (
                <WalletCard
                  key={wallet.id}
                  wallet={wallet}
                  balance={preview.distribution[wallet.id]}
                  animateCoins={open}
                />
              ))}
            </div>
          </div>

          <p className="rounded-2xl bg-cloud p-3 text-xs text-ink-soft">
            Ao confirmar: a semana fica guardada no histórico, o dinheiro entra nos cofrinhos e as
            marcações desta semana são reiniciadas. Saldos, objetivo e histórico mantêm-se.
          </p>
        </div>
      </Modal>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Confirmar fecho"
        emoji="🔒"
        size="sm"
        footer={
          <>
            <Button className="flex-1" onClick={confirm}>
              Sim, fechar semana
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Voltar
            </Button>
          </>
        }
      >
        <p className="text-ink-soft">
          Confirmam o fecho da semana de {formatWeekRange(preview.weekStart)} com{' '}
          <strong>{preview.totals.totalStars} estrelas</strong> e{' '}
          <strong>{formatEuro(preview.total)}</strong> para dividir pelos cofrinhos?
        </p>
      </Modal>
    </>
  )
}

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3 ring-1',
        strong ? 'bg-coin-50 ring-coin-100' : 'bg-cloud ring-black/5',
      )}
    >
      <span className="text-sm font-bold text-ink-soft">{label}</span>
      <span className={cn('font-black', strong ? 'text-lg text-coin-700' : 'text-ink')}>{value}</span>
    </div>
  )
}
