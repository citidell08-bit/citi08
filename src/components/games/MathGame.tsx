import { useEffect, useRef, useState, type FormEvent } from 'react'
import { isRestartKey } from '../../lib/gameInput'
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

function nextProblem(): Problem {
  const a = 2 + Math.floor(Math.random() * 12)
  const b = 2 + Math.floor(Math.random() * 12)
  const ops = ['+', '-', '×'] as const
  const op = ops[Math.floor(Math.random() * ops.length)]
  if (op === '+') return { prompt: `${a} + ${b}`, answer: a + b }
  if (op === '×') return { prompt: `${a} × ${b}`, answer: a * b }
  const hi = Math.max(a, b)
  const lo = Math.min(a, b)
  return { prompt: `${hi} − ${lo}`, answer: hi - lo }
}

const DURATION = 30

export function MathGame({ onFinish, onBack }: Props) {
  const [seconds, setSeconds] = useState(DURATION)
  const [running, setRunning] = useState(true)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [problem, setProblem] = useState<Problem>(() => nextProblem())
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
        const xp = Math.max(8, finalScore * 4 + streakRef.current)
        onFinishRef.current({
          gameId: 'math',
          won: finalScore >= 8,
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
    reportedRef.current = false
    scoreRef.current = 0
    streakRef.current = 0
    setScore(0)
    setStreak(0)
    setProblem(nextProblem())
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
    if (!running || finished) return
    const value = Number(input.trim())
    if (Number.isNaN(value)) return

    if (value === problem.answer) {
      scoreRef.current += 1
      streakRef.current += 1
      setScore(scoreRef.current)
      setStreak(streakRef.current)
      setFeedback('ok')
      setProblem(nextProblem())
      setInput('')
    } else {
      streakRef.current = 0
      setStreak(0)
      setFeedback('bad')
      setInput('')
    }
    if (feedbackTimerRef.current != null) {
      window.clearTimeout(feedbackTimerRef.current)
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      feedbackTimerRef.current = null
      setFeedback(null)
    }, 200)
    inputRef.current?.focus()
  }

  return (
    <div className="mini-game play-stage">
      <div className="mini-top">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Arcade
        </button>
        <div className="mini-stats">
          <span className="score-pill">Score {score}</span>
          <span>Streak {streak}</span>
        </div>
      </div>

      <div className="play-header">
        <div>
          <h2 className="section-title">Quick Sum</h2>
          <p className="section-sub">
            Type numbers and press Enter. When time is up, Space / Enter starts another round.
          </p>
        </div>
        <div className="hud-row">
          <div className="dash-score-badge" aria-live="polite">
            <strong>{score}</strong>
            <span>Score</span>
          </div>
          <GameTimer seconds={seconds} total={DURATION} pulsing={running && !finished} />
        </div>
      </div>

      <div className={`panel math-panel play-board ${feedback ?? ''}`}>
        {!finished ? (
          <>
            <div className="math-prompt" aria-live="polite">
              {problem.prompt}
            </div>
            <form onSubmit={submit} className="math-form">
              <input
                ref={inputRef}
                className="field"
                inputMode="numeric"
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type answer"
                aria-label="Answer"
              />
              <button type="submit" className="btn btn-primary">
                Go
              </button>
            </form>
            <p className="play-hint">Numbers + Enter to submit instantly.</p>
          </>
        ) : (
          <div
            className="mini-end overlay-end"
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest('button')) return
              playAgain()
            }}
          >
            <p>
              You scored <strong>{score}</strong>
              {score >= 8 ? ' — solid round!' : '.'}
            </p>
            <p className="section-sub memory-again-hint">
              Click here or press Space / Enter / R for a new random set.
            </p>
            <div className="dash-end-actions">
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
