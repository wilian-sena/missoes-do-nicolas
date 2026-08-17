import { useRef, useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { Card, Section } from '../ui/Card'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { toISODate } from '../../utils/date'

export function DataSettings() {
  const { state, exportJson, importJson, resetAll } = useApp()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [pendingImport, setPendingImport] = useState<string | null>(null)

  const download = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `missoes-${state.profile.name.toLowerCase()}-${toISODate(new Date())}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setMessage({ tone: 'ok', text: 'Cópia exportada para o teu dispositivo.' })
  }

  const onFile = async (file: File) => {
    try {
      const raw = await file.text()
      // Valida antes de perguntar, para não assustar com um ficheiro errado.
      JSON.parse(raw)
      setPendingImport(raw)
    } catch {
      setMessage({ tone: 'error', text: 'Não consegui ler esse ficheiro.' })
    }
  }

  return (
    <Section title="Dados" emoji="💾" hint="Tudo fica guardado neste dispositivo, sem contas nem servidores.">
      <Card className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={download}>
            ⬇️ Exportar JSON
          </Button>
          <Button variant="secondary" onClick={() => fileInput.current?.click()}>
            ⬆️ Importar JSON
          </Button>
          <Button variant="danger" onClick={() => setConfirmReset(true)}>
            🗑️ Apagar tudo
          </Button>
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void onFile(file)
            event.target.value = ''
          }}
        />

        {message && (
          <p
            role="status"
            className={
              message.tone === 'ok'
                ? 'rounded-2xl bg-grow-50 p-3 text-sm font-bold text-grow-700'
                : 'rounded-2xl bg-berry-50 p-3 text-sm font-bold text-berry-700'
            }
          >
            {message.text}
          </p>
        )}

        <p className="text-xs text-ink-soft">
          Última alteração: {new Date(state.updatedAt).toLocaleString('pt-PT')}
        </p>
      </Card>

      <ConfirmDialog
        open={Boolean(pendingImport)}
        title="Importar cópia?"
        emoji="⬆️"
        description="Os dados atuais (estrelas, saldos, histórico) são substituídos pelos do ficheiro. Convém exportar uma cópia antes."
        confirmLabel="Importar e substituir"
        tone="danger"
        onConfirm={() => {
          try {
            importJson(pendingImport ?? '')
            setMessage({ tone: 'ok', text: 'Dados importados com sucesso.' })
          } catch (error) {
            setMessage({
              tone: 'error',
              text: error instanceof Error ? error.message : 'Ficheiro inválido.',
            })
          }
          setPendingImport(null)
        }}
        onCancel={() => setPendingImport(null)}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Apagar todos os dados?"
        emoji="⚠️"
        tone="danger"
        description="Estrelas, cofrinhos, histórico, objetivo e configurações voltam ao início. Esta ação não pode ser desfeita."
        confirmLabel="Apagar tudo"
        onConfirm={() => {
          resetAll()
          setConfirmReset(false)
          setMessage({ tone: 'ok', text: 'Dados reiniciados.' })
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </Section>
  )
}
