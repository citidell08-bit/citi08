import { useState } from 'react'
import { Flashcards } from './components/Flashcards'
import { FocusTimer } from './components/FocusTimer'
import { Games } from './components/Games'
import { Home } from './components/Home'
import { Nav } from './components/Nav'
import { Quests } from './components/Quests'
import { useGameState } from './hooks/useGameState'
import type { Tab } from './types'
import { Companion } from './components/Companion'
import './App.css'

function App() {
  const [tab, setTab] = useState<Tab>('home')
  const {
    state,
    toasts,
    levelUp,
    completeFocusSession,
    reviewCard,
    completeMiniGame,
    createDeck,
    renameCompanion,
    dismissLevelUp,
    resetProgress,
  } = useGameState()

  return (
    <div className="app-shell">
      {tab === 'home' && (
        <Home
          state={state}
          onNavigate={setTab}
          onRename={renameCompanion}
          onReset={resetProgress}
        />
      )}
      {tab === 'focus' && <FocusTimer onComplete={completeFocusSession} />}
      {tab === 'cards' && (
        <Flashcards decks={state.decks} onReview={reviewCard} onCreateDeck={createDeck} />
      )}
      {tab === 'play' && <Games state={state} onComplete={completeMiniGame} />}
      {tab === 'quests' && <Quests state={state} />}

      <Nav tab={tab} onChange={setTab} />

      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.xp != null && <span className="xp">+{t.xp} XP</span>}
            {t.message}
          </div>
        ))}
      </div>

      {levelUp != null && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Level up">
          <div className="panel modal">
            <Companion name={state.companionName} level={levelUp} size="md" />
            <h2 className="section-title" style={{ marginTop: '0.75rem' }}>
              Level {levelUp}!
            </h2>
            <p className="section-sub">
              {state.companionName} evolved a little. Keep the streak alive.
            </p>
            <button type="button" className="btn btn-primary" onClick={dismissLevelUp}>
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
