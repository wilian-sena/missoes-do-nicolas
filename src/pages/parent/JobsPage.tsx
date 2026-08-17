import { useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { Card, Section } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmojiPicker, Field, TextInput, Toggle } from '../../components/ui/Field'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatEuro, parseMoneyInput } from '../../utils/money'
import { createId } from '../../utils/id'
import type { ExtraJob } from '../../types'

const JOB_EMOJIS = ['🧹', '🗄️', '👟', '♻️', '🧽', '🚪', '🪴', '📦', '🧺', '🪣', '🌱', '🚿']

const STATUS_LABEL: Record<string, string> = {
  claimed: '🙋 Aceite',
  submitted: '⏳ A aguardar aprovação',
  approved: '✓ Aprovado',
  rejected: '↩️ Devolvido',
}

export function JobsPage() {
  const { state, dispatch } = useApp()
  const [editing, setEditing] = useState<ExtraJob | null>(null)
  const [removing, setRemoving] = useState<ExtraJob | null>(null)

  const jobs = [...state.extraJobs].sort((a, b) => a.order - b.order)
  const weekCompletions = state.extraJobCompletions.filter(
    (item) => item.weekStart === state.currentWeekStart,
  )

  const newJob = (): ExtraJob => ({
    id: createId('job'),
    label: '',
    emoji: JOB_EMOJIS[0],
    amount: 0.5,
    available: true,
    order: jobs.length + 1,
  })

  return (
    <div className="space-y-7">
      <header className="px-1">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Trabalhos extra</h1>
        <p className="text-sm font-bold text-ink-soft">
          Trabalho fora das responsabilidades. Dão dinheiro — nunca estrelas.
        </p>
      </header>

      <Button size="lg" block onClick={() => setEditing(newJob())}>
        <span aria-hidden="true">➕</span> Nova missão extra
      </Button>

      <Section title="Missões" emoji="🧹">
        <ul className="space-y-2.5">
          {jobs.map((job) => (
            <Card as="li" key={job.id} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl" aria-hidden="true">
                  {job.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold">{job.label}</p>
                  {job.description && <p className="text-xs text-ink-soft">{job.description}</p>}
                </div>
                <span className="rounded-full bg-coin-100 px-3 py-1.5 font-black text-coin-700">
                  {formatEuro(job.amount)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditing(job)}>
                  ✏️ Editar
                </Button>
                <Button
                  size="sm"
                  variant={job.available ? 'ghost' : 'success'}
                  onClick={() => dispatch({ type: 'job/save', job: { ...job, available: !job.available } })}
                >
                  {job.available ? '🙈 Tornar indisponível' : '👀 Disponibilizar'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRemoving(job)}>
                  🗑️ Apagar
                </Button>
                <span
                  className={
                    job.available
                      ? 'ml-auto rounded-full bg-grow-50 px-2.5 py-1 text-xs font-bold text-grow-700'
                      : 'ml-auto rounded-full bg-black/5 px-2.5 py-1 text-xs font-bold text-ink-soft'
                  }
                >
                  {job.available ? 'Disponível' : 'Indisponível'}
                </span>
              </div>
            </Card>
          ))}
        </ul>
      </Section>

      <Section title="Esta semana" emoji="📋">
        {weekCompletions.length === 0 ? (
          <EmptyState emoji="🫙" title="Nenhuma missão extra aceite esta semana" />
        ) : (
          <Card>
            <ul className="divide-y divide-black/5">
              {weekCompletions.map((completion) => (
                <li key={completion.id} className="flex items-center gap-3 py-2.5">
                  <span className="text-xl" aria-hidden="true">
                    {completion.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{completion.label}</p>
                    <p className="text-xs text-ink-soft">{STATUS_LABEL[completion.status]}</p>
                  </div>
                  <span className="font-black text-coin-700">{formatEuro(completion.amount)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </Section>

      {editing && (
        <JobEditor
          job={editing}
          onCancel={() => setEditing(null)}
          onSave={(job) => {
            dispatch({ type: 'job/save', job })
            setEditing(null)
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        title="Apagar missão?"
        emoji="🗑️"
        tone="danger"
        description={
          <>
            A missão <strong>{removing?.label}</strong> deixa de aparecer. O histórico e o dinheiro
            já aprovado mantêm-se.
          </>
        }
        confirmLabel="Apagar"
        onConfirm={() => {
          if (removing) dispatch({ type: 'job/remove', id: removing.id })
          setRemoving(null)
        }}
        onCancel={() => setRemoving(null)}
      />
    </div>
  )
}

function JobEditor({
  job,
  onSave,
  onCancel,
}: {
  job: ExtraJob
  onSave: (job: ExtraJob) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState(job.label)
  const [description, setDescription] = useState(job.description ?? '')
  const [emoji, setEmoji] = useState(job.emoji)
  const [amount, setAmount] = useState(String(job.amount).replace('.', ','))
  const [available, setAvailable] = useState(job.available)

  const parsed = parseMoneyInput(amount)
  const valid = label.trim().length > 0 && parsed !== null && parsed >= 0

  return (
    <Modal
      open
      onClose={onCancel}
      title={job.label ? 'Editar missão' : 'Nova missão extra'}
      emoji="🧹"
      footer={
        <>
          <Button
            className="flex-1"
            size="lg"
            disabled={!valid}
            onClick={() =>
              onSave({
                ...job,
                label: label.trim(),
                description: description.trim() || undefined,
                emoji,
                amount: parsed ?? 0,
                available,
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
      <Field label="Nome da missão">
        <TextInput value={label} onChange={(event) => setLabel(event.target.value)} maxLength={60} />
      </Field>
      <Field label="Descrição (opcional)">
        <TextInput
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={90}
        />
      </Field>
      <Field label="Valor (€)" hint="Use vírgula ou ponto — ex.: 0,75">
        <TextInput
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          inputMode="decimal"
        />
      </Field>
      <EmojiPicker value={emoji} onChange={setEmoji} options={JOB_EMOJIS} />
      <Toggle
        checked={available}
        onChange={setAvailable}
        label="Disponível para o Nicolas"
        description="Só as missões disponíveis aparecem no Modo Nicolas."
      />
    </Modal>
  )
}
