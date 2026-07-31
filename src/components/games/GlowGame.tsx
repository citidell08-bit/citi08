import { useEffect, useRef, useState } from 'react'
import type { MiniGameResult } from '../../types'
import { GameTimer } from './GameTimer'

interface Props {
  onFinish: (result: MiniGameResult) => void
  onBack: () => void
}

const ROUNDS = 12
const CELLS = 9
const DURATION = 45

export function GlowGame({ onFinish, onBack }: Props) {
  const [active, setActive] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [running, setRunning] = useState(true)
  const [finished, setFinished] = useState(false)
  const [missFlash, setMissFlash] = useState(false)
  const [seconds, setSeconds] = useState(DURATION)
  const [windowLeft, setWindowLeft] = useState(0)

  const timerRef = useRef<number | null>(null)
  const tickRef = useRef<number | null>(null)
  const scoreRef = useRef(0)
  const reportedRef = useRef(false)
  const roundRef = useRef(0)
  const onFinishRef = useRef(onFinish)
  const spawnRef = useRef<(nextRound: number) => void>(() => {})

  onFinishRef.current = onFinish

  function clearTimer() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  function clearTick() {
    if (tickRef.current) {
      window.clearInterval(tickRef.current)
      tickRef.current = null
    }
  }

  function endGame(completedRounds: boolean) {
    if (reportedRef.current) return
    reportedRef.current = true
    clearTimer()
    clearTick()
    setRunning(false)
    setFinished(true)
    setActive(null)
    const final = scoreRef.current
    const xp = Math.max(8, final * 5)
    onFinishRef.current({
      gameId: 'glow',
      won: final >= 7,
      score: final,
      xp,
      label: completedRounds
        ? `Glow Catch · ${final}/${ROUNDS}`
        : `Glow Catch · ${final} hits`,
    })
  }

  spawnRef.current = (nextRound: number) => {
    if (nextRound > ROUNDS) {
      endGame(true)
      return
    }

    const cell = Math.floor(Math.random() * CELLS)
    const windowMs = Math.max(520, 980 - nextRound * 35)
    roundRef.current = nextRound
    setActive(cell)
    setRound(nextRound)
    setWindowLeft(Math.ceil(windowMs / 1000))
    clearTimer()
    clearTick()

    const startedAt = Date.now()
    tickRef.current = window.setInterval(() => {
      const left = Math.max(0, windowMs - (Date.now() - startedAt))
      setWindowLeft(Math.ceil(left / 1000))
    }, 100)

    timerRef.current = window.setTimeout(() => {
      clearTick()
      setActive(null)
      setMissFlash(true)
      window.setTimeout(() => setMissFlash(false), 180)
      spawnRef.current(nextRound + 1)
    }, windowMs)
  }

  useEffect(() => {
    spawnRef.current(1)
    return () => {
      clearTimer()
      clearTick()
    }
  }, [])

  const endGameRef = useRef(endGame)
  endGameRef.current = endGame

  useEffect(() => {
    if (!running || finished) return
    if (seconds <= 0) {
      endGameRef.current(false)
      return
    }
    const id = window.setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => window.clearTimeout(id)
  }, [running, seconds, finished])

  function tap(index: number) {
    if (!running || finished || active == null) return
    if (index === active) {
      clearTimer()
      clearTick()
      scoreRef.current += 1
      setScore(scoreRef.current)
      setActive(null)
      spawnRef.current(roundRef.current + 1)
    } else {
      setMissFlash(true)
      window.setTimeout(() => setMissFlash(false), 180)
    }
  }

  return (
    <div className="mini-game play-stage">
      <div className="mini-top">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Arcade
        </button>
        <div className="mini-stats">
          <span className="score-pill">Score {score}</span>
          <span>
            Round {Math.min(round, ROUNDS)}/{ROUNDS}
          </span>
          <span>Glow {windowLeft}s</span>
        </div>
      </div>

      <div className="play-header">
        <div>
          <h2 className="section-title">Glow Catch</h2>
          <p className="section-sub">Tap the lit cell before it fades. Watch the timer.</p>
        </div>
        <div className="hud-row">
          <div className="dash-score-badge" aria-live="polite">
            <strong>{score}</strong>
            <span>Score</span>
          </div>
          <GameTimer seconds={seconds} total={DURATION} pulsing={running && !finished} />
        </div>
      </div>

      <div className={`panel glow-panel play-board ${missFlash ? 'miss' : ''}`}>
        <div className="glow-grid" aria-label="Glow catch board">
          {Array.from({ length: CELLS }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`glow-cell ${active === i ? 'lit' : ''}`}
              onClick={() => tap(i)}
              aria-label={active === i ? 'Glowing target — tap now' : `Cell ${i + 1}`}
              disabled={finished}
            />
          ))}
        </div>

        {finished && (
          <div className="mini-end overlay-end">
            <p>
              Caught <strong>{score}</strong> of {ROUNDS}
              {score >= 7 ? ' — sharp!' : '.'}
            </p>
            <button type="button" className="btn btn-primary" onClick={onBack}>
              Back to arcade
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
