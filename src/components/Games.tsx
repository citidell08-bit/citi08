import { useCallback, useRef, useState } from 'react'
import type { GameState, MiniGameId, MiniGameResult } from '../types'
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
}

export function Games({ state, onComplete }: Props) {
  const [active, setActive] = useState<MiniGameId | null>(null)
  const rewardedRef = useRef(new Set<string>())

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
          Brain-break mini-games that still feed your XP and daily quests.
        </p>
      </header>

      <div className="panel games-scoreboard">
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

      <ul className="game-catalog">
        {CATALOG.map((game) => (
          <li key={game.id} className="panel game-card">
            <div>
              <em>{game.badge}</em>
              <strong>{game.title}</strong>
              <p>{game.blurb}</p>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setActive(game.id)}>
              Play
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
