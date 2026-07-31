import { useState } from 'react'
import { progressToNextLevel } from '../lib/xp'
import type { GameState, Tab } from '../types'
import { Companion } from './Companion'
import './Home.css'

interface Props {
  state: GameState
  onNavigate: (tab: Tab) => void
  onRename: (name: string) => void
  onReset: () => void
}

export function Home({ state, onNavigate, onRename, onReset }: Props) {
  const [confirmReset, setConfirmReset] = useState(false)
  const { level, current, needed, ratio } = progressToNextLevel(state.xp)
  const unlocked = state.achievements.filter((a) => a.unlockedAt).length

  return (
    <div className="home">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Gamified study companion</p>
          <h1 className="brand-mark">Cyber Kith</h1>
          <p className="lede">
            Clear quests for coins, take a break mid-focus, then customize neon backgrounds in the
            theme store with {state.companionName}.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={() => onNavigate('focus')}>
              Start focus
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => onNavigate('store')}>
              Theme store
            </button>
          </div>
        </div>
        <Companion name={state.companionName} level={level} />
      </header>

      <section className="panel progress-panel">
        <div className="progress-head">
          <div>
            <h2 className="section-title">Level {level}</h2>
            <p className="section-sub" style={{ marginBottom: 0 }}>
              {current} / {needed} XP to next level
            </p>
          </div>
          <div className="pill-stack">
            <div className="xp-pill">+{state.xp} XP</div>
            <div className="coin-pill">{state.coins} coins</div>
          </div>
        </div>
        <div className="xp-track" aria-hidden="true">
          <div className="xp-fill" style={{ width: `${Math.min(100, ratio * 100)}%` }} />
        </div>
        <div className="stat-row" style={{ marginTop: '1.1rem' }}>
          <div className="stat">
            <strong>{state.coins}</strong>
            <span>Coins</span>
          </div>
          <div className="stat">
            <strong>{state.streak}</strong>
            <span>Day streak</span>
          </div>
          <div className="stat">
            <strong>{state.totalFocusMinutes}</strong>
            <span>Focus minutes</span>
          </div>
          <div className="stat">
            <strong>{state.totalCardsReviewed}</strong>
            <span>Cards reviewed</span>
          </div>
          <div className="stat">
            <strong>{state.totalGamesPlayed}</strong>
            <span>Games played</span>
          </div>
          <div className="stat">
            <strong>
              {unlocked}/{state.achievements.length}
            </strong>
            <span>Achievements</span>
          </div>
        </div>
      </section>

      <section className="panel rename-panel">
        <h2 className="section-title">Name your Cyber Kith</h2>
        <p className="section-sub">Companions remember who they study with.</p>
        <form
          className="rename-form"
          onSubmit={(e) => {
            e.preventDefault()
            const data = new FormData(e.currentTarget)
            onRename(String(data.get('name') ?? ''))
          }}
        >
          <input
            className="field"
            name="name"
            defaultValue={state.companionName}
            maxLength={18}
            aria-label="Companion name"
          />
          <button type="submit" className="btn btn-ghost">
            Save
          </button>
        </form>
      </section>

      <section className="panel achievements-panel">
        <h2 className="section-title">Achievements</h2>
        <p className="section-sub">Milestones earned along the way.</p>
        <ul className="achievement-grid">
          {state.achievements.map((a) => (
            <li key={a.id} className={a.unlockedAt ? 'unlocked' : 'locked'}>
              <em aria-hidden="true">{iconFor(a.icon)}</em>
              <div>
                <strong>{a.title}</strong>
                <span>{a.description}</span>
              </div>
            </li>
          ))}
        </ul>
        {!confirmReset ? (
          <button
            type="button"
            className="btn btn-ghost reset-btn"
            onClick={() => setConfirmReset(true)}
          >
            Reset progress
          </button>
        ) : (
          <div className="reset-confirm panel" role="alertdialog" aria-label="Confirm reset">
            <p>
              Reset wipes XP, coins, quests, and scores. This cannot be undone.
              <strong> One more chance — keep your progress?</strong>
            </p>
            <div className="reset-confirm-actions">
              <button
                type="button"
                className="btn btn-ember"
                onClick={() => setConfirmReset(false)}
              >
                Keep progress
              </button>
              <button
                type="button"
                className="btn btn-ghost reset-btn"
                onClick={() => {
                  setConfirmReset(false)
                  onReset()
                }}
              >
                Yes, reset everything
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function iconFor(icon: string): string {
  switch (icon) {
    case 'flame':
      return '◉'
    case 'clock':
      return '◷'
    case 'cards':
      return '▤'
    case 'streak':
      return 'ϟ'
    case 'crown':
      return '♛'
    case 'star':
      return '✦'
    case 'scroll':
      return '✧'
    case 'book':
      return '▣'
    case 'game':
      return '◈'
    case 'trophy':
      return '♛'
    case 'brain':
      return '✦'
    case 'dash':
      return '▶'
    default:
      return '○'
  }
}
