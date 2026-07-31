import { useEffect, useRef, useState, type FormEvent } from 'react'
import { isRestartKey } from '../../lib/gameInput'
import {
  playHitSfx,
  playMissSfx,
  playRestartSfx,
  playWinSfx,
  unlockAudio,
} from '../../lib/sfx'
import type { MiniGameResult } from '../../types'
import { GameTimer } from './GameTimer'

interface Props {
  onFinish: (result: MiniGameResult) => void
  onBack: () => void
}

interface Problem {
  prompt: string
  answer: number
}

const DURATION = 30
const WIN_SCORE = 8

function nextProblem(solved: number): Problem {
  // Ramp: start gentle, introduce multiply later, widen range with streak of solves.
  const span = Math.min(12, 5 + Math.floor(solved / 3))
  const a = 2 + Math.floor(Math.random() * span)
  const b = 2 + Math.floor(Math.random() * span)
  const ops =
    solved < 3 ? (['+', '-'] as const) : solved < 7 ? (['+', '-', '×'] as const) : (['+', '-', '×'] as const)
  const op = ops[Math.floor(Math.random() * ops.length)]
  if (op === '+') return { prompt: `${a} + ${b}`, answer: a + b }
  if (op === '×') {
    const x = 2 + Math.floor(Math.random() * Math.min(9, span))
    const y = 2 + Math.floor(Math.random() * Math.min(9, span))
    return { prompt: `${x} × ${y}`, answer: x * y }
  }
  const hi = Math.max(a, b)
  const lo = Math.min(a, b)
  return { prompt: `${hi} − ${lo}`, answer: hi - lo }
}

export function MathGame({ onFinish, onBack }: Props) {
  const [seconds, setSeconds] = useState(DURATION)
  const [running, setRunning] = useState(true)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [problem, setProblem] = useState<Problem>(() => nextProblem(0))
  const [input, setInput] = useState('')
  const [finished, setFinished] = useState(false)
  const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null)
  const scoreRef = useRef(0)
  const streakRef = useRef(0)
  const reportedRef = useRef(false)
  const feedbackTimerRef = useRef<number | null>(null)
  const finishedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const onFinishRef = useRef(onFinish)
  const playAgainRef = useRef<() => void>(() => {})
  onFinishRef.current = onFinish
  finishedRef.current = finished

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current != null) {
        window.clearTimeout(feedbackTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!running || finished) return
    if (seconds <= 0) {
      setRunning(false)
      setFinished(true)
      if (!reportedRef.current) {
        reportedRef.current = true
        const finalScore = scoreRef.current
        const won = finalScore >= WIN_SCORE
        if (won) playWinSfx()
        const xp = Math.max(8, finalScore * 4 + streakRef.current)
        onFinishRef.current({
          gameId: 'math',
          won,
          score: finalScore,
          xp,
          label: `Quick Sum · ${finalScore} correct`,
        })
      }
      return
    }
    const id = window.setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => window.clearTimeout(id)
  }, [running, seconds, finished])

  function playAgain() {
    if (feedbackTimerRef.current != null) {
      window.clearTimeout(feedbackTimerRef.current)
      feedbackTimerRef.current = null
    }
    playRestartSfx()
    reportedRef.current = false
    scoreRef.current = 0
    streakRef.current = 0
    setScore(0)
    setStreak(0)
    setProblem(nextProblem(0))
    setInput('')
    setFeedback(null)
    setFinished(false)
    setSeconds(DURATION)
    setRunning(true)
    queueMicrotask(() => inputRef.current?.focus())
  }

  playAgainRef.current = playAgain

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.repeat || !finishedRef.current) return
      if (isRestartKey(e.code)) {
        e.preventDefault()
        playAgainRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function submit(e: FormEvent) {
    e.preventDefault()
    unlockAudio()
    if (!running || finished) return
    const value = Number(input.trim())
    if (Number.isNaN(value) || input.trim() === '') return

    if (value === problem.answer) {
      scoreRef.current += 1
      streakRef.current += 1
      setScore(scoreRef.current)
      setStreak(streakRef.current)
      setFeedback('ok')
      playHitSfx()
      setProblem(nextProblem(scoreRef.current))
      setInput('')
    } else {
      streakRef.current = 0
      setStreak(0)
      setFeedback('bad')
      playMissSfx()
      setInput('')
    }
    if (feedbackTimerRef.current != null) {
      window.clearTimeout(feedbackTimerRef.current)
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      feedbackTimerRef.current = null
      setFeedback(null)
    }, 280)
    inputRef.current?.focus()
  }

  return (
    <div className="mini-game play-stage">
      <div className="mini-top">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Arcade
        </button>
        <div className="mini-stats">
          <span className="score-pill">Streak {streak}</span>
          <span>Goal {WIN_SCORE}+</span>
        </div>
      </div>

      <div className="play-header">
        <div>
          <h2 className="section-title">Quick Sum</h2>
          <p className="section-sub">
            Answer fast — difficulty ramps as you score. Enter submits.
          </p>
        </div>
        <div className="hud-row">
          <div className="score-badge" aria-live="polite">
            <strong>{score}</strong>
            <span>Correct</span>
          </div>
          <div className="score-badge" aria-live="polite">
            <strong>{streak}</strong>
            <span>Streak</span>
          </div>
          <GameTimer seconds={seconds} total={DURATION} pulsing={running && !finished} />
        </div>
      </div>

      <div className={`panel math-panel play-board ${feedback ?? ''} ${finished ? 'math-ended' : ''}`}>
        <div className="math-prompt" aria-live="polite" aria-hidden={finished}>
          {finished ? '—' : problem.prompt}
        </div>
        {!finished ? (
          <form onSubmit={submit} className="math-form">
            <input
              ref={inputRef}
              className="field"
              inputMode="numeric"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Answer"
              aria-label="Answer"
            />
            <button type="submit" className="btn btn-primary">
              Go
            </button>
          </form>
        ) : null}
        <p className="play-hint">
          {finished ? 'Space / Enter / R — play again' : 'Type a number, then Enter'}
        </p>

        {finished && (
          <div
            className="mini-end overlay-end"
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest('button')) return
              playAgain()
            }}
          >
            <p>
              {score >= WIN_SCORE ? 'Solid round' : 'Round over'} —{' '}
              <strong>{score}</strong> correct
              {score >= WIN_SCORE ? '.' : ` · need ${WIN_SCORE} to win.`}
            </p>
            <p className="section-sub again-hint">Space / Enter / R — new set</p>
            <div className="game-end-actions">
              <button type="button" className="btn btn-ember" onClick={playAgain}>
                Play again
              </button>
              <button type="button" className="btn btn-ghost" onClick={onBack}>
                Back to arcade
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
