import { useState } from 'react'
import { useApp } from '../../hooks/useApp'
import { Card, Section } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { EmojiPicker, Field, TextInput, Toggle } from '../../components/ui/Field'
import { ResponsibilitySettings } from '../../components/parent/ResponsibilitySettings'
import { LearningSettings } from '../../components/parent/LearningSettings'
import { TierSettings } from '../../components/parent/TierSettings'
import { WalletSettings } from '../../components/parent/WalletSettings'
import { PinSettings } from '../../components/parent/PinSettings'
import { DataSettings } from '../../components/parent/DataSettings'
import { formatEuro, parseMoneyInput } from '../../utils/money'

const PROFILE_EMOJIS = ['🚀', '🦖', '🐯', '⚽', '🦸', '🐙', '🎨', '🤖']

export function SettingsPage() {
  const { state, dispatch } = useApp()
  const [name, setName] = useState(state.profile.name)
  const [allowance, setAllowance] = useState(String(state.settings.allowance).replace('.', ','))
  const [savedProfile, setSavedProfile] = useState(false)

  const parsedAllowance = parseMoneyInput(allowance)
  const profileValid = name.trim().length > 0 && parsedAllowance !== null && parsedAllowance >= 0

  return (
    <div className="space-y-8">
      <header className="px-1">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Configurações</h1>
        <p className="text-sm font-bold text-ink-soft">
          Tudo aqui pode ser adaptado à vossa família.
        </p>
      </header>

      <Section title="Criança e semanada" emoji="🧒">
        <Card className="space-y-4">
          <Field label="Nome">
            <TextInput
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setSavedProfile(false)
              }}
              maxLength={20}
            />
          </Field>

          <EmojiPicker
            label="Emoji do perfil"
            value={state.profile.emoji}
            options={PROFILE_EMOJIS}
            onChange={(emoji) => dispatch({ type: 'profile/update', patch: { emoji } })}
          />

          <Field
            label="Semanada (€)"
            hint="Dinheiro dado regularmente para aprender a gerir. Não depende das estrelas."
          >
            <TextInput
              value={allowance}
              inputMode="decimal"
              onChange={(event) => {
                setAllowance(event.target.value)
                setSavedProfile(false)
              }}
            />
          </Field>

          <Button
            disabled={!profileValid}
            onClick={() => {
              dispatch({ type: 'profile/update', patch: { name: name.trim() } })
              dispatch({
                type: 'settings/update',
                patch: { allowance: parsedAllowance ?? state.settings.allowance },
              })
              setSavedProfile(true)
            }}
          >
            Guardar
          </Button>
          {savedProfile && (
            <p className="text-sm font-bold text-grow-700" role="status">
              ✓ Guardado. Semanada atual: {formatEuro(parsedAllowance ?? 0)}.
            </p>
          )}
        </Card>
      </Section>

      <Section title="Experiência" emoji="✨">
        <div className="space-y-2.5">
          <Toggle
            checked={state.settings.celebrationsEnabled}
            onChange={(value) =>
              dispatch({ type: 'settings/update', patch: { celebrationsEnabled: value } })
            }
            label="Pequenas celebrações"
            description="Confete curto quando o dia fica completo ou o objetivo é alcançado."
          />
          <Toggle
            checked={state.settings.showStreak}
            onChange={(value) => dispatch({ type: 'settings/update', patch: { showStreak: value } })}
            label="Mostrar dias seguidos"
            description="Contador discreto de consistência. Nunca retira estrelas."
          />
        </div>
      </Section>

      <ResponsibilitySettings />
      <LearningSettings />
      <TierSettings />
      <WalletSettings />
      <PinSettings />
      <DataSettings />

      <Card className="bg-brand-50 text-sm text-ink-soft ring-brand-100">
        <p className="font-extrabold text-brand-700">Como funciona o sistema</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Responsabilidades e aprendizagem dão estrelas — nunca dinheiro.</li>
          <li>Estrelas dão privilégios e experiências em família.</li>
          <li>Trabalhos extra dão dinheiro — nunca estrelas.</li>
          <li>A semanada é fixa e não depende das estrelas.</li>
        </ul>
      </Card>
    </div>
  )
}
