import { useCallback, useEffect, useRef, useState } from 'react'
import { setBgmTrack } from '../lib/bgm'
import { GAME_COSTS } from '../lib/coins'
import { playStartSfx, unlockAudio } from '../lib/sfx'
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
  goal: string
  bestKey: ScoreKey
}[] = [
  {
    id: 'dash',
    title: 'Spike Dash',
    blurb: 'Geometry Dash–style runner. Clear spikes, land on blocks, grab coins.',
    badge: 'Runner',
    goal: 'Clear 120',
    bestKey: 'bestDashScore',
  },
  {
    id: 'memory',
    title: 'Memory Nest',
    blurb: 'Match every pair before the clock. Lower moves is a better record.',
    badge: 'Memory',
    goal: 'Clear board',
    bestKey: 'bestMemoryMoves',
  },
  {
    id: 'math',
    title: 'Quick Sum',
    blurb: '30-second arithmetic sprint. Difficulty ramps as you score.',
    badge: 'Speed',
    goal: '8+ correct',
    bestKey: 'bestMathScore',
  },
  {
    id: 'glow',
    title: 'Glow Catch',
    blurb: 'Hit lit cells before they fade. Coin cells bank ◉ when you catch them.',
    badge: 'Reflex',
    goal: '7+ hits',
    bestKey: 'bestGlowScore',
  },
]

interface Props {
  state: GameState
  onComplete: (result: MiniGameResult) => void
  onSpend: (gameId: MiniGameId) => boolean
  onNavigate: (tab: Tab) => void
  onActiveChange?: (gameId: MiniGameId | null) => void
}

export function Games({ state, onComplete, onSpend, onNavigate, onActiveChange }: Props) {
  const [active, setActive] = useState<MiniGameId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const rewardedRef = useRef(new Set<string>())

  useEffect(() => {
    onActiveChange?.(active)
    return () => onActiveChange?.(null)
  }, [active, onActiveChange])

  // Per-game soundtrack — restore hub music when leaving a run
  useEffect(() => {
    setBgmTrack(active ?? 'hub')
    return () => setBgmTrack('hub')
  }, [active])

  const questsDone = state.quests.filter((q) => q.completed).length
  const arcadeUnlocked =
    questsDone > 0 || state.totalCoinsEarned > 0 || state.totalSessions > 0 || state.totalGamesPlayed > 0
  const owned = new Set(state.ownedGames)

  const handleFinish = useCallback(
    (result: MiniGameResult) => {
      // Dedupe only true double-fires from the same finish event, not same-score retries.
      const dedupe = `${result.gameId}:${result.score}:${result.xp}:${result.won}:${result.coinsEarned ?? 0}:${result.label}`
      if (rewardedRef.current.has(dedupe)) return
      rewardedRef.current.add(dedupe)
      window.setTimeout(() => rewardedRef.current.delete(dedupe), 800)
      onComplete(result)
    },
    [onComplete],
  )

  function tryPlay(gameId: MiniGameId) {
    setError(null)
    unlockAudio()
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

    playStartSfx()
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
          Buy once, play free forever. Personal bests save on this device.
        </p>
      </header>

      <div className="panel coin-banner">
        <div>
          <strong className="coin-balance">
            <span aria-hidden="true">◉</span> {state.coins} coins
          </strong>
          <p>
            {arcadeUnlocked
              ? 'Owned games never charge again. Win rounds for a small coin bonus.'
              : 'Clear at least one daily quest to unlock play. Level-ups also mint coins.'}
          </p>
        </div>
        {!arcadeUnlocked && (
          <button type="button" className="btn btn-ember" onClick={() => onNavigate('quests')}>
            View quests
          </button>
        )}
      </div>

      <div className="panel games-scoreboard" aria-label="Arcade records">
        <div className="stat">
          <strong>{state.bestDashScore}</strong>
          <span>Dash best</span>
        </div>
        <div className="stat">
          <strong>{state.bestMemoryMoves ?? '—'}</strong>
          <span>Memory moves</span>
        </div>
        <div className="stat">
          <strong>{state.bestMathScore}</strong>
          <span>Sum best</span>
        </div>
        <div className="stat">
          <strong>{state.bestGlowScore}</strong>
          <span>Glow best</span>
        </div>
        <div className="stat">
          <strong>{state.ownedGames.length}/4</strong>
          <span>Owned</span>
        </div>
        <div className="stat">
          <strong>{state.totalGamesPlayed}</strong>
          <span>Played</span>
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
                <span className="game-meta">
                  <span className="game-goal">{game.goal}</span>
                  <span className="game-cost">
                    {isOwned
                      ? `Owned · Best ${bestLabel(game.id, best)}`
                      : `Buy ${cost}◉ · Best ${bestLabel(game.id, best)}`}
                  </span>
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
