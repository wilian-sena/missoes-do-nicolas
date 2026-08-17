import { useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { Card, Section } from '../ui/Card'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Field, TextInput } from '../ui/Field'
import { sortedTiers, weekTotals } from '../../utils/scoring'
import type { RewardTier } from '../../types'

export function TierSettings() {
  const { state, dispatch } = useApp()
  const [editing, setEditing] = useState<RewardTier | null>(null)
  const totals = weekTotals(state)
  const tiers = sortedTiers(state.rewardTiers)

  const save = (tier: RewardTier) => {
    const next = state.rewardTiers.map((item) => (item.id === tier.id ? tier : item))
    dispatch({ type: 'tiers/save', tiers: next })
    setEditing(null)
  }

  return (
    <Section
      title="Níveis e recompensas"
      emoji="🏅"
      hint={`Total possível esta semana: ${totals.maxStars} estrelas. Só conta o nível mais alto atingido.`}
    >
      <ul className="space-y-2.5">
        {tiers.map((tier) => (
          <Card as="li" key={tier.id} className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden="true">
                {tier.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">
                  {tier.name}{' '}
                  <span className="text-sm font-bold text-ink-soft">
                    ({tier.min}–{tier.max} ⭐)
                  </span>
                </p>
                <p className="text-sm text-ink-soft">{tier.privilege}</p>
                {tier.options.length > 0 && (
                  <p className="mt-1 text-xs text-ink-soft">Opções: {tier.options.join(' · ')}</p>
                )}
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setEditing(tier)}>
              ✏️ Editar
            </Button>
          </Card>
        ))}
      </ul>

      {editing && <Editor tier={editing} onSave={save} onCancel={() => setEditing(null)} />}
    </Section>
  )
}

function Editor({
  tier,
  onSave,
  onCancel,
}: {
  tier: RewardTier
  onSave: (tier: RewardTier) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(tier.name)
  const [emoji, setEmoji] = useState(tier.emoji)
  const [min, setMin] = useState(String(tier.min))
  const [max, setMax] = useState(String(tier.max))
  const [privilege, setPrivilege] = useState(tier.privilege)
  const [options, setOptions] = useState(tier.options.join('\n'))

  const minValue = Number(min)
  const maxValue = Number(max)
  const valid =
    name.trim().length > 0 &&
    Number.isFinite(minValue) &&
    Number.isFinite(maxValue) &&
    minValue >= 0 &&
    maxValue >= minValue

  return (
    <Modal
      open
      onClose={onCancel}
      title="Editar nível"
      emoji="🏅"
      footer={
        <>
          <Button
            className="flex-1"
            size="lg"
            disabled={!valid}
            onClick={() =>
              onSave({
                ...tier,
                name: name.trim(),
                emoji: emoji.trim() || '⭐',
                min: minValue,
                max: maxValue,
                privilege: privilege.trim(),
                options: options
                  .split('\n')
                  .map((option) => option.trim())
                  .filter(Boolean),
              })
            }
          >
            Guardar
          </Button>
          <Button variant="ghost" size="lg" onClick={onCancel}>
            Cancelar
          </Button>
        </>
      }
    >
      <Field label="Nome do nível">
        <TextInput value={name} onChange={(event) => setName(event.target.value)} maxLength={30} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Estrelas mínimas">
          <TextInput
            value={min}
            onChange={(event) => setMin(event.target.value)}
            inputMode="numeric"
          />
        </Field>
        <Field label="Estrelas máximas">
          <TextInput
            value={max}
            onChange={(event) => setMax(event.target.value)}
            inputMode="numeric"
          />
        </Field>
      </div>
      <Field label="Emoji">
        <TextInput value={emoji} onChange={(event) => setEmoji(event.target.value)} maxLength={4} />
      </Field>
      <Field label="Privilégio">
        <TextInput
          value={privilege}
          onChange={(event) => setPrivilege(event.target.value)}
          maxLength={100}
        />
      </Field>
      <Field label="Opções à escolha (uma por linha)" hint="Deixem vazio se não houver escolha.">
        <textarea
          value={options}
          onChange={(event) => setOptions(event.target.value)}
          rows={4}
          className="w-full rounded-2xl border-0 bg-cloud px-4 py-3 text-base font-semibold text-ink ring-1 ring-black/10 focus:ring-2 focus:ring-brand-500"
        />
      </Field>
    </Modal>
  )
}
