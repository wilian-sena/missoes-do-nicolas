import type { ReactNode } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  emoji?: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'primary' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  emoji,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      emoji={emoji}
      size="sm"
      footer={
        <>
          <Button variant={tone} onClick={onConfirm} className="flex-1">
            {confirmLabel}
          </Button>
          <Button variant="ghost" onClick={onCancel} className="flex-1">
            {cancelLabel}
          </Button>
        </>
      }
    >
      <div className="text-ink-soft">{description}</div>
    </Modal>
  )
}
