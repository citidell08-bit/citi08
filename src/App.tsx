import { useCallback, useEffect, useRef, useState } from 'react'
import { Flashcards } from './components/Flashcards'
import { FocusTimer } from './components/FocusTimer'
import { Games } from './components/Games'
import { Home } from './components/Home'
import { Nav } from './components/Nav'
import { Quests } from './components/Quests'
import { ThemeStore } from './components/ThemeStore'
import { useFocusSession } from './hooks/useFocusSession'
import { useGameState } from './hooks/useGameState'
import { installClickSfx, playAccessGrantedSfx, unlockAudio } from './lib/sfx'
import type { MiniGameId, Tab } from './types'
import { Companion } from './components/Companion'
import { COINS_PER_LEVEL } from './lib/coins'
import './App.css'

function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [playingGame, setPlayingGame] = useState<MiniGameId | null>(null)
  const {
    state,
    toasts,
    levelUp,
    completeFocusSession,
    reviewCard,
    spendCoinsForGame,
    buyTheme,
    equipTheme,
    completeMiniGame,
    createDeck,
    renameCompanion,
    dismissLevelUp,
  } = useGameState()

  const focus = useFocusSession(completeFocusSession)
  const lastLevelFanfare = useRef<number | null>(null)

  useEffect(() => installClickSfx(), [])

  useEffect(() => {
    if (levelUp == null) return
    if (lastLevelFanfare.current === levelUp.level) return
    lastLevelFanfare.current = levelUp.level
    playAccessGrantedSfx()
  }, [levelUp])

  const changeTab = useCallback((next: Tab) => {
    unlockAudio()
    setTab(next)
    if (next !== 'play') setPlayingGame(null)
  }, [])

  const onActiveGame = useCallback((gameId: MiniGameId | null) => {
    setPlayingGame(gameId)
  }, [])

  return (
    <div className="app-shell">
      <div className="coin-chip" aria-label={`${state.coins} coins`}>
        <span aria-hidden="true">◉</span> {state.coins}
      </div>

      {tab === 'home' && (
        <Home state={state} onNavigate={changeTab} onRename={renameCompanion} />
      )}
      {tab === 'focus' && (
        <FocusTimer
          session={focus.session}
          onSelectPreset={focus.selectPreset}
          onBegin={focus.begin}
          onBreak={focus.takeBreak}
          onResume={focus.resume}
          onReset={focus.reset}
          onFinishEarly={focus.finishEarly}
        />
      )}
      {tab === 'cards' && (
        <Flashcards decks={state.decks} onReview={reviewCard} onCreateDeck={createDeck} />
      )}
      {tab === 'play' && (
        <Games
          state={state}
          onComplete={completeMiniGame}
          onSpend={spendCoinsForGame}
          onNavigate={changeTab}
          onActiveChange={onActiveGame}
        />
      )}
      {tab === 'quests' && <Quests state={state} />}
      {tab === 'store' && (
        <ThemeStore state={state} onBuy={buyTheme} onEquip={equipTheme} />
      )}

      <Nav
        tab={tab}
        playingGame={tab === 'play' ? playingGame : null}
        onBreak={focus.session.onBreak}
        onChange={changeTab}
      />

      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.xp != null && <span className="xp">+{t.xp} XP</span>}
            {t.coins != null && (
              <span className={t.coins < 0 ? 'coins spend' : 'coins'}>
                {t.coins > 0 ? '+' : ''}
                {t.coins} ◉
              </span>
            )}
            {t.message}
          </div>
        ))}
      </div>

      {levelUp != null && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Level up">
          <div className="panel modal">
            <Companion name={state.companionName} level={levelUp.level} size="md" />
            <h2 className="section-title" style={{ marginTop: '0.75rem' }}>
              Access granted — Level {levelUp.level}!
            </h2>
            <p className="section-sub">
              Cyber Kith leveled up — {state.companionName} minted{' '}
              <strong className="coin-inline">+{levelUp.coins} coins</strong>
              {levelUp.coins > COINS_PER_LEVEL ? ' across those levels' : ''}.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                unlockAudio()
                dismissLevelUp()
              }}
            >
              Collect coins
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
