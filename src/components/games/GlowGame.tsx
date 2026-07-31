import { useEffect, useRef, useState } from 'react'
import type { MiniGameResult } from '../../types'

interface Props {
  onFinish: (result: MiniGameResult) => void
  onBack: () => void
}

const ROUNDS = 12
const CELLS = 9

export function GlowGame({ onFinish, onBack }: Props) {
  const [active, setActive] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [missFlash, setMissFlash] = useState(false)
  const timerRef = useRef<number | null>(null)
  const scoreRef = useRef(0)

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  function clearTimer() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  function spawn(nextRound: number) {
    if (nextRound > ROUNDS) {
      setRunning(false)
      setFinished(true)
      setActive(null)
      const final = scoreRef.current
      const xp = Math.max(8, final * 5)
      onFinish({
        gameId: 'glow',
        won: final >= 7,
        score: final,
        xp,
        label: `Glow Catch · ${final}/${ROUNDS}`,
      })
      return
    }

    const cell = Math.floor(Math.random() * CELLS)
    setActive(cell)
    setRound(nextRound)
    const windowMs = Math.max(520, 980 - nextRound * 35)
    clearTimer()
    timerRef.current = window.setTimeout(() => {
      setActive(null)
      setMissFlash(true)
      window.setTimeout(() => setMissFlash(false), 180)
      spawn(nextRound + 1)
    }, windowMs)
  }

  function start() {
    clearTimer()
    scoreRef.current = 0
    setScore(0)
    setRound(0)
    setFinished(false)
    setMissFlash(false)
    setRunning(true)
    spawn(1)
  }

  function tap(index: number) {
    if (!running || active == null) return
    if (index === active) {
      clearTimer()
      scoreRef.current += 1
      setScore(scoreRef.current)
      setActive(null)
      spawn(round + 1)
    } else {
      setMissFlash(true)
      window.setTimeout(() => setMissFlash(false), 180)
    }
  }

  return (
    <div className="mini-game">
      <div className="mini-top">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Arcade
        </button>
        <div className="mini-stats">
          <span>
            Round {Math.min(round, ROUNDS)}/{ROUNDS}
          </span>
          <span>Hits {score}</span>
        </div>
      </div>

      <h2 className="section-title">Glow Catch</h2>
      <p className="section-sub">Tap the glowing cell before it fades. Train your focus.</p>

      <div className={`panel glow-panel ${missFlash ? 'miss' : ''}`}>
        {!running && !finished && (
          <div className="mini-end">
            <p>A quick reaction break for tired eyes.</p>
            <button type="button" className="btn btn-ember" onClick={start}>
              Start round
            </button>
          </div>
        )}

        {(running || finished) && (
          <div className="glow-grid" aria-label="Glow catch board">
            {Array.from({ length: CELLS }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`glow-cell ${active === i ? 'lit' : ''}`}
                onClick={() => tap(i)}
                aria-label={active === i ? 'Glowing target' : `Cell ${i + 1}`}
                disabled={finished}
              />
            ))}
          </div>
        )}

        {finished && (
          <div className="mini-end" style={{ marginTop: '1rem' }}>
            <p>
              Caught <strong>{score}</strong> of {ROUNDS}
              {score >= 7 ? ' — sharp!' : '.'}
            </p>
            <button type="button" className="btn btn-primary" onClick={start}>
              Play again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
