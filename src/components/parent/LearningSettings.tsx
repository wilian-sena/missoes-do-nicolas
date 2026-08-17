import { useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { Card, Section } from '../ui/Card'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { EmojiPicker, Field, Select, TextInput, Toggle } from '../ui/Field'
import { createId } from '../../utils/id'
import type { LearningActivity } from '../../types'

const EMOJIS = ['🎹', '🇬🇧', '♟️', '📖', '🎨', '🔢', '🧪', '🩰', '⚽', '🎻', '💻', '🌍']

export function LearningSettings() {
  const { state, dispatch } = useApp()
  const [editing, setEditing] = useState<LearningActivity | null>(null)
  const [removing, setRemoving] = useState<LearningActivity | null>(null)

  const items = [...state.learningActivities].sort((a, b) => a.order - b.order)
  const cap = state.settings.maxLearningStarsPerDay

  const create = (): LearningActivity => ({
    id: createId('learn'),
    label: '',
    emoji: EMOJIS[0],
    goal: '',
    requiresApproval: false,
    active: true,
    order: items.length + 1,
  })

  return (
    <Section
      title="Atividades de aprendizagem"
      emoji="🌱"
      hint={`Máximo de ${cap} estrelas por dia · ${cap * 7} por semana.`}
    >
      <Card>
        <Field
          label="Máximo de estrelas de aprendizagem por dia"
          hint="Mesmo que faça mais atividades, só contam estas estrelas."
        >
          <Select
            value={String(cap)}
            onChange={(event) =>
              dispatch({
                type: 'settings/update',
                patch: { maxLearningStarsPerDay: Number(event.target.value) },
              })
            }
          >
            {[1, 2, 3, 4].map((value) => (
              <option key={value} value={value}>
                {value} {value === 1 ? 'estrela' : 'estrelas'} por dia
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      <ul className="space-y-2.5">
        {items.map((item) => (
          <Card as="li" key={item.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">
                {item.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">{item.label}</p>
                <p className="text-xs text-ink-soft">{item.goal}</p>
                <p className="text-xs text-ink-soft">
                  {item.requiresApproval ? 'Exige aprovação' : 'Sem aprovação'} ·{' '}
                  {item.active ? 'Ativa' : 'Inativa'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEditing(item)}>
                ✏️ Editar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  dispatch({ type: 'learning/save', activity: { ...item, active: !item.active } })
                }
              >
                {item.active ? '🙈 Desativar' : '👀 Ativar'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRemoving(item)}>
                🗑️ Apagar
              </Button>
            </div>
          </Card>
        ))}
      </ul>

      <Button variant="secondary" block onClick={() => setEditing(create())}>
        ➕ Nova atividade
      </Button>

      {editing && (
        <Editor
          item={editing}
          onCancel={() => setEditing(null)}
          onSave={(activity) => {
            dispatch({ type: 'learning/save', activity })
            setEditing(null)
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        title="Apagar atividade?"
        emoji="🗑️"
        tone="danger"
        description={
          <>
            <strong>{removing?.label}</strong> e as marcações desta atividade são removidas.
          </>
        }
        confirmLabel="Apagar"
        onConfirm={() => {
          if (removing) dispatch({ type: 'learning/remove', id: removing.id })
          setRemoving(null)
        }}
        onCancel={() => setRemoving(null)}
      />
    </Section>
  )
}

function Editor({
  item,
  onSave,
  onCancel,
}: {
  item: LearningActivity
  onSave: (item: LearningActivity) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState(item.label)
  const [goal, setGoal] = useState(item.goal)
  const [emoji, setEmoji] = useState(item.emoji)
  const [requiresApproval, setRequiresApproval] = useState(item.requiresApproval)

  const valid = label.trim().length > 0

  return (
    <Modal
      open
      onClose={onCancel}
      title={item.label ? 'Editar atividade' : 'Nova atividade'}
      emoji="🌱"
      footer={
        <>
          <Button
            className="flex-1"
            size="lg"
            disabled={!valid}
            onClick={() =>
              onSave({
                ...item,
                label: label.trim(),
                goal: goal.trim(),
                emoji,
                requiresApproval,
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
      <Field label="Nome">
        <TextInput value={label} onChange={(event) => setLabel(event.target.value)} maxLength={30} />
      </Field>
      <Field label="Meta" hint="Descrição simples do que conta como feito.">
        <TextInput value={goal} onChange={(event) => setGoal(event.target.value)} maxLength={90} />
      </Field>
      <EmojiPicker value={emoji} onChange={setEmoji} options={EMOJIS} />
      <Toggle
        checked={requiresApproval}
        onChange={setRequiresApproval}
        label="Exigir aprovação de um adulto"
      />
    </Modal>
  )
}
