import { useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { Card, Section } from '../ui/Card'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { EmojiPicker, Field, Select, TextInput, Toggle } from '../ui/Field'
import { createId } from '../../utils/id'
import type { Responsibility } from '../../types'

const EMOJIS = ['🧸', '🧺', '🍽️', '🛁', '🪥', '🚻', '🛏️', '📚', '🐕', '🎒', '🧦', '🌙']

export function ResponsibilitySettings() {
  const { state, dispatch } = useApp()
  const [editing, setEditing] = useState<Responsibility | null>(null)
  const [removing, setRemoving] = useState<Responsibility | null>(null)

  const items = [...state.responsibilities].sort((a, b) => a.order - b.order)
  const activeCount = items.filter((item) => item.active).length

  const create = (): Responsibility => ({
    id: createId('resp'),
    label: '',
    shortLabel: '',
    emoji: EMOJIS[0],
    mode: 'simple',
    requiresApproval: false,
    active: true,
    order: items.length + 1,
  })

  return (
    <Section
      title="Responsabilidades"
      emoji="🧹"
      hint={`${activeCount} ativas · ${activeCount * 7} estrelas possíveis por semana.`}
    >
      <ul className="space-y-2.5">
        {items.map((item) => (
          <Card as="li" key={item.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">
                {item.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">{item.label}</p>
                <p className="text-xs text-ink-soft">
                  {item.mode === 'twice' ? 'Manhã + noite · ' : ''}
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
                  dispatch({
                    type: 'responsibility/save',
                    responsibility: { ...item, active: !item.active },
                  })
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
        ➕ Nova responsabilidade
      </Button>

      {editing && (
        <Editor
          item={editing}
          onCancel={() => setEditing(null)}
          onSave={(responsibility) => {
            dispatch({ type: 'responsibility/save', responsibility })
            setEditing(null)
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        title="Apagar responsabilidade?"
        emoji="🗑️"
        tone="danger"
        description={
          <>
            <strong>{removing?.label}</strong> e as marcações desta responsabilidade são removidas.
            Se for temporário, prefiram desativar.
          </>
        }
        confirmLabel="Apagar"
        onConfirm={() => {
          if (removing) dispatch({ type: 'responsibility/remove', id: removing.id })
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
  item: Responsibility
  onSave: (item: Responsibility) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState(item.label)
  const [shortLabel, setShortLabel] = useState(item.shortLabel)
  const [hint, setHint] = useState(item.hint ?? '')
  const [emoji, setEmoji] = useState(item.emoji)
  const [mode, setMode] = useState(item.mode)
  const [requiresApproval, setRequiresApproval] = useState(item.requiresApproval)

  const valid = label.trim().length > 0

  return (
    <Modal
      open
      onClose={onCancel}
      title={item.label ? 'Editar responsabilidade' : 'Nova responsabilidade'}
      emoji="🧹"
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
                shortLabel: shortLabel.trim() || label.trim(),
                hint: hint.trim() || undefined,
                emoji,
                mode,
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
      <Field label="Nome completo">
        <TextInput value={label} onChange={(event) => setLabel(event.target.value)} maxLength={70} />
      </Field>
      <Field label="Nome curto" hint="É este que aparece no ecrã do Nicolas.">
        <TextInput
          value={shortLabel}
          onChange={(event) => setShortLabel(event.target.value)}
          maxLength={28}
        />
      </Field>
      <Field label="Dica (opcional)">
        <TextInput value={hint} onChange={(event) => setHint(event.target.value)} maxLength={80} />
      </Field>
      <Field label="Tipo de marcação">
        <Select
          value={mode}
          onChange={(event) => setMode(event.target.value as Responsibility['mode'])}
        >
          <option value="simple">Uma marcação por dia</option>
          <option value="twice">Manhã e noite (1 estrela só com as duas)</option>
        </Select>
      </Field>
      <EmojiPicker value={emoji} onChange={setEmoji} options={EMOJIS} />
      <Toggle
        checked={requiresApproval}
        onChange={setRequiresApproval}
        label="Exigir aprovação de um adulto"
        description="Se estiver ligado, fica 'a aguardar aprovação' até um adulto confirmar."
      />
    </Modal>
  )
}
