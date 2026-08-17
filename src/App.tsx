import { useMemo, useState } from 'react'
import { useApp } from './hooks/useApp'
import { NavBar, type NavItem } from './components/ui/NavBar'
import { Button } from './components/ui/Button'
import { ParentGate } from './components/parent/ParentGate'
import { TodayPage } from './pages/child/TodayPage'
import { WeekPage } from './pages/child/WeekPage'
import { WalletsPage } from './pages/child/WalletsPage'
import { GoalPage } from './pages/child/GoalPage'
import { ExtrasPage } from './pages/child/ExtrasPage'
import { SummaryPage } from './pages/parent/SummaryPage'
import { ApprovalsPage } from './pages/parent/ApprovalsPage'
import { JobsPage } from './pages/parent/JobsPage'
import { MoneyPage } from './pages/parent/MoneyPage'
import { HistoryPage } from './pages/parent/HistoryPage'
import { SettingsPage } from './pages/parent/SettingsPage'
import { pendingApprovals } from './utils/scoring'

const CHILD_TABS: NavItem[] = [
  { id: 'today', label: 'Hoje', emoji: '🏠' },
  { id: 'week', label: 'Semana', emoji: '⭐' },
  { id: 'wallets', label: 'Cofrinhos', emoji: '💰' },
  { id: 'goal', label: 'Objetivo', emoji: '🎯' },
  { id: 'extras', label: 'Extras', emoji: '🧹' },
]

const PARENT_TABS: NavItem[] = [
  { id: 'summary', label: 'Resumo', emoji: '📊' },
  { id: 'approvals', label: 'Aprovações', emoji: '✅' },
  { id: 'jobs', label: 'Trabalhos', emoji: '🧹' },
  { id: 'money', label: 'Dinheiro', emoji: '💰' },
  { id: 'history', label: 'Histórico', emoji: '📅' },
  { id: 'settings', label: 'Config.', emoji: '⚙️' },
]

export default function App() {
  const { state } = useApp()
  const [mode, setMode] = useState<'child' | 'parent'>('child')
  const [unlocked, setUnlocked] = useState(false)
  const [childTab, setChildTab] = useState('today')
  const [parentTab, setParentTab] = useState('summary')

  const pendingCount = useMemo(() => pendingApprovals(state).total, [state])

  const parentTabs = PARENT_TABS.map((tab) =>
    tab.id === 'approvals' ? { ...tab, badge: pendingCount || undefined } : tab,
  )

  const inParent = mode === 'parent' && unlocked
  const tabs = inParent ? parentTabs : CHILD_TABS
  const current = inParent ? parentTab : childTab
  const setCurrent = inParent ? setParentTab : setChildTab

  const leaveParent = () => {
    setMode('child')
    setUnlocked(false)
    setParentTab('summary')
  }

  if (mode === 'parent' && !unlocked) {
    return (
      <div className="min-h-dvh">
        <TopBar
          title="Modo Pais"
          subtitle="Área protegida"
          emoji="🔐"
          action={
            <Button variant="ghost" onClick={leaveParent}>
              Voltar
            </Button>
          }
        />
        <ParentGate onUnlock={() => setUnlocked(true)} onCancel={leaveParent} />
      </div>
    )
  }

  return (
    <div className="min-h-dvh md:flex md:gap-2">
      <NavBar items={tabs} current={current} onSelect={setCurrent} variant="side" />

      <div className="min-w-0 flex-1">
        <TopBar
          title={inParent ? 'Modo Pais' : `Missões do ${state.profile.name}`}
          subtitle={inParent ? 'Aprovações, dinheiro e configurações' : 'Responsabilidades, aprender e poupar'}
          emoji={inParent ? '🔐' : state.profile.emoji}
          action={
            inParent ? (
              <Button variant="secondary" onClick={leaveParent}>
                <span aria-hidden="true">👋</span> Sair
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => setMode('parent')}
                aria-label="Entrar no Modo Pais"
              >
                <span aria-hidden="true">🔐</span> Pais
              </Button>
            )
          }
        />

        <main className="mx-auto w-full max-w-3xl px-4 pt-4 pb-28 md:pb-10">
          {inParent ? (
            <>
              {parentTab === 'summary' && <SummaryPage onGoTo={setParentTab} />}
              {parentTab === 'approvals' && <ApprovalsPage />}
              {parentTab === 'jobs' && <JobsPage />}
              {parentTab === 'money' && <MoneyPage />}
              {parentTab === 'history' && <HistoryPage />}
              {parentTab === 'settings' && <SettingsPage />}
            </>
          ) : (
            <>
              {childTab === 'today' && <TodayPage />}
              {childTab === 'week' && <WeekPage />}
              {childTab === 'wallets' && <WalletsPage />}
              {childTab === 'goal' && <GoalPage />}
              {childTab === 'extras' && <ExtrasPage />}
            </>
          )}
        </main>
      </div>

      <NavBar items={tabs} current={current} onSelect={setCurrent} variant="bottom" />
    </div>
  )
}

function TopBar({
  title,
  subtitle,
  emoji,
  action,
}: {
  title: string
  subtitle: string
  emoji: string
  action: React.ReactNode
}) {
  return (
    <header className="safe-top sticky top-0 z-30 border-b border-black/5 bg-cloud/85 px-4 pb-3 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-paper text-2xl shadow-sm"
          aria-hidden="true"
        >
          {emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base leading-tight font-black">{title}</p>
          <p className="truncate text-xs font-bold text-ink-soft">{subtitle}</p>
        </div>
        {action}
      </div>
    </header>
  )
}
