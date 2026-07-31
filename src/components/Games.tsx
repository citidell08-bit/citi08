import { useCallback, useRef, useState } from 'react'
import { GAME_COSTS } from '../lib/coins'
import type { GameState, MiniGameId, MiniGameResult, Tab } from '../types'
import { DashGame } from './games/DashGame'
import { GlowGame } from './games/GlowGame'
import { MathGame } from './games/MathGame'
import { MemoryGame } from './games/MemoryGame'
import './Games.css'

type ScoreKey =
  | 'bestDashScore'
  | 'bestMemoryMoves'
  | 'bestMathScore'
  | 'bestGlowScore'

const CATALOG: {
  id: MiniGameId
  title: string
  blurb: string
  badge: string
  bestKey: ScoreKey
}[] = [
  {
    id: 'dash',
    title: 'Spike Dash',
    blurb: 'Geometry-dash style runner — jump spikes and blocks. Don’t crash.',
    badge: 'Runner',
    bestKey: 'bestDashScore',
  },
  {
    id: 'memory',
    title: 'Memory Nest',
    blurb: 'Flip tiles and match pairs before time runs out. Track your score.',
    badge: 'Memory',
    bestKey: 'bestMemoryMoves',
  },
  {
    id: 'math',
    title: 'Quick Sum',
    blurb: '30-second arithmetic sprint. Higher score wins more XP.',
    badge: 'Speed',
    bestKey: 'bestMathScore',
  },
  {
    id: 'glow',
    title: 'Glow Catch',
    blurb: 'Tap glowing cells before they fade. Score every hit.',
    badge: 'Reflex',
    bestKey: 'bestGlowScore',
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
  const arcadeUnlocked =
    questsDone > 0 || state.totalCoinsEarned > 0 || state.totalSessions > 0 || state.totalGamesPlayed > 0
  const owned = new Set(state.ownedGames)

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

    const alreadyOwned = owned.has(gameId)
    const cost = GAME_COSTS[gameId]

    if (!alreadyOwned && state.coins < cost) {
      setError(`Need ${cost} coins to buy this game. Finish quests or level up to earn more.`)
      return
    }

    if (!onSpend(gameId)) {
      setError(alreadyOwned ? 'Could not start game.' : `Need ${cost} coins to buy this game.`)
      return
    }

    setActive(gameId)
  }

  function bestLabel(gameId: MiniGameId, value: unknown): string {
    if (gameId === 'memory') {
      return value == null ? '—' : `${value} moves`
    }
    return String(value ?? 0)
  }

  if (active === 'dash') {
    return <DashGame onFinish={handleFinish} onBack={() => setActive(null)} />
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
        <h2 className="section-title">Cyber Arcade</h2>
        <p className="section-sub">
          Buy a game once with coins — then play it free anytime. Scores save forever.
        </p>
      </header>

      <div className="panel coin-banner">
        <div>
          <strong className="coin-balance">
            <span aria-hidden="true">◉</span> {state.coins} coins
          </strong>
          <p>
            {arcadeUnlocked
              ? 'Buy to unlock. Owned games never charge you again.'
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
          <strong>{state.ownedGames.length}</strong>
          <span>Owned</span>
        </div>
        <div className="stat">
          <strong>{state.bestDashScore}</strong>
          <span>Best dash</span>
        </div>
        <div className="stat">
          <strong>{state.bestMathScore}</strong>
          <span>Best sum</span>
        </div>
        <div className="stat">
          <strong>{state.bestGlowScore}</strong>
          <span>Best glow</span>
        </div>
        <div className="stat">
          <strong>{state.bestMemoryMoves ?? '—'}</strong>
          <span>Best memory</span>
        </div>
      </div>

      {error && <p className="games-error">{error}</p>}

      <ul className={`game-catalog ${arcadeUnlocked ? '' : 'locked'}`}>
        {CATALOG.map((game) => {
          const cost = GAME_COSTS[game.id]
          const isOwned = owned.has(game.id)
          const canAfford = state.coins >= cost
          const best = state[game.bestKey]
          return (
            <li key={game.id} className={`panel game-card ${isOwned ? 'owned' : ''}`}>
              <div>
                <em>{game.badge}</em>
                <strong>{game.title}</strong>
                <p>{game.blurb}</p>
                <span className="game-cost">
                  {isOwned
                    ? `Owned · Play free · Best ${bestLabel(game.id, best)}`
                    : `Buy once ${cost} coins · Best ${bestLabel(game.id, best)}`}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => tryPlay(game.id)}
                disabled={!arcadeUnlocked || (!isOwned && !canAfford)}
              >
                {!arcadeUnlocked
                  ? 'Locked'
                  : isOwned
                    ? 'Play'
                    : canAfford
                      ? `Buy · ${cost}`
                      : `Need ${cost}`}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
