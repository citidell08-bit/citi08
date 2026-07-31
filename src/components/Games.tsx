import { useCallback, useRef, useState } from 'react'
import { GAME_COSTS } from '../lib/coins'
import type { GameState, MiniGameId, MiniGameResult, Tab } from '../types'
import { GlowGame } from './games/GlowGame'
import { MathGame } from './games/MathGame'
import { MemoryGame } from './games/MemoryGame'
import './Games.css'

const CATALOG: {
  id: MiniGameId
  title: string
  blurb: string
  badge: string
}[] = [
  {
    id: 'memory',
    title: 'Memory Nest',
    blurb: 'Flip tiles and match pairs. Fewer moves earn more XP.',
    badge: 'Memory',
  },
  {
    id: 'math',
    title: 'Quick Sum',
    blurb: '30-second arithmetic sprint between study blocks.',
    badge: 'Speed',
  },
  {
    id: 'glow',
    title: 'Glow Catch',
    blurb: 'Tap the glowing cell before it fades. Train focus.',
    badge: 'Reflex',
  },
]

interface Props {
  state: GameState
  onComplete: (result: MiniGameResult) => void
  onSpend: (gameId: MiniGameId) => boolean
  onNavigate: (tab: Tab) => void
}

export function Games({ state, onComplete, onSpend, onNavigate }: Props) {
  const [active, setActive] = useState<MiniGameId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const rewardedRef = useRef(new Set<string>())

  const questsDone = state.quests.filter((q) => q.completed).length
  const arcadeUnlocked = questsDone > 0 || state.totalCoinsEarned > 0

  const handleFinish = useCallback(
    (result: MiniGameResult) => {
      const dedupe = `${result.gameId}:${result.score}:${result.xp}:${result.won}`
      if (rewardedRef.current.has(dedupe)) return
      rewardedRef.current.add(dedupe)
      window.setTimeout(() => rewardedRef.current.delete(dedupe), 1500)
      onComplete(result)
    },
    [onComplete],
  )

  function tryPlay(gameId: MiniGameId) {
    setError(null)
    if (!arcadeUnlocked) {
      setError('Complete a daily quest first to unlock the arcade.')
      return
    }
    const cost = GAME_COSTS[gameId]
    if (state.coins < cost) {
      setError(`Need ${cost} coins to play. Finish quests or level up to earn more.`)
      return
    }
    if (!onSpend(gameId)) {
      setError(`Need ${cost} coins to play.`)
      return
    }
    setActive(gameId)
  }

  if (active === 'memory') {
    return <MemoryGame onFinish={handleFinish} onBack={() => setActive(null)} />
  }
  if (active === 'math') {
    return <MathGame onFinish={handleFinish} onBack={() => setActive(null)} />
  }
  if (active === 'glow') {
    return <GlowGame onFinish={handleFinish} onBack={() => setActive(null)} />
  }

  return (
    <div className="games">
      <header>
        <h2 className="section-title">Arcade</h2>
        <p className="section-sub">
          Earn coins from quests and level-ups, then spend them on brain-break games.
        </p>
      </header>

      <div className="panel coin-banner">
        <div>
          <strong className="coin-balance">
            <span aria-hidden="true">◉</span> {state.coins} coins
          </strong>
          <p>
            {arcadeUnlocked
              ? 'Arcade unlocked — pick a game and spend coins to play.'
              : 'Clear at least one daily quest to unlock play. Level-ups also mint coins.'}
          </p>
        </div>
        {!arcadeUnlocked && (
          <button type="button" className="btn btn-ember" onClick={() => onNavigate('quests')}>
            View quests
          </button>
        )}
      </div>

      <div className="panel games-scoreboard">
        <div className="stat">
          <strong>{state.coins}</strong>
          <span>Coins</span>
        </div>
        <div className="stat">
          <strong>{state.totalGamesPlayed}</strong>
          <span>Played</span>
        </div>
        <div className="stat">
          <strong>{state.totalGamesWon}</strong>
          <span>Wins</span>
        </div>
        <div className="stat">
          <strong>{state.bestMemoryMoves ?? '—'}</strong>
          <span>Best memory</span>
        </div>
        <div className="stat">
          <strong>{state.bestMathScore}</strong>
          <span>Best sum</span>
        </div>
        <div className="stat">
          <strong>{state.bestGlowScore}</strong>
          <span>Best glow</span>
        </div>
      </div>

      {error && <p className="games-error">{error}</p>}

      <ul className={`game-catalog ${arcadeUnlocked ? '' : 'locked'}`}>
        {CATALOG.map((game) => {
          const cost = GAME_COSTS[game.id]
          const canAfford = state.coins >= cost
          return (
            <li key={game.id} className="panel game-card">
              <div>
                <em>{game.badge}</em>
                <strong>{game.title}</strong>
                <p>{game.blurb}</p>
                <span className="game-cost">Entry {cost} coins</span>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => tryPlay(game.id)}
                disabled={!arcadeUnlocked || !canAfford}
              >
                {!arcadeUnlocked ? 'Locked' : canAfford ? `Play · ${cost}` : `Need ${cost}`}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
