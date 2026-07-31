import { useEffect, useRef, useState } from 'react'
import { cellFromKey, isRestartKey } from '../../lib/gameInput'
import { playCoinSfx, playHitSfx, playMissSfx, playRestartSfx, playWinSfx } from '../../lib/sfx'
import type { MiniGameResult } from '../../types'
import { GameTimer } from './GameTimer'

interface Props {
  onFinish: (result: MiniGameResult) => void
  onBack: () => void
}

const ROUNDS = 12
const CELLS = 9
const DURATION = 45
const COIN_CHANCE = 0.38
const WIN_HITS = 7
/** Brief lock after a miss so mashing every cell can't cheese the round. */
const MISS_LOCK_MS = 160

export function GlowGame({ onFinish, onBack }: Props) {
  const [active, setActive] = useState<number | null>(null)
  const [hasCoin, setHasCoin] = useState(false)
  const [score, setScore] = useState(0)
  const [coinsGrabbed, setCoinsGrabbed] = useState(0)
  const [round, setRound] = useState(0)
  const [running, setRunning] = useState(true)
  const [finished, setFinished] = useState(false)
  const [missFlash, setMissFlash] = useState(false)
  const [seconds, setSeconds] = useState(DURATION)
  const [windowRatio, setWindowRatio] = useState(1)
  const [completedAll, setCompletedAll] = useState(false)

  const timerRef = useRef<number | null>(null)
  const tickRef = useRef<number | null>(null)
  const missTimerRef = useRef<number | null>(null)
  const scoreRef = useRef(0)
  const coinsRef = useRef(0)
  const reportedRef = useRef(false)
  const roundRef = useRef(0)
  const finishedRef = useRef(false)
  const runningRef = useRef(true)
  const activeRef = useRef<number | null>(null)
  const hasCoinRef = useRef(false)
  const missLockUntilRef = useRef(0)
  const onFinishRef = useRef(onFinish)
  const spawnRef = useRef<(nextRound: number) => void>(() => {})
  const playAgainRef = useRef<() => void>(() => {})
  const tapRef = useRef<(index: number) => void>(() => {})

  onFinishRef.current = onFinish
  finishedRef.current = finished
  runningRef.current = running
  activeRef.current = active
  hasCoinRef.current = hasCoin

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

  function clearMiss() {
    if (missTimerRef.current) {
      window.clearTimeout(missTimerRef.current)
      missTimerRef.current = null
    }
  }

  function flashMiss() {
    setMissFlash(true)
    clearMiss()
    missTimerRef.current = window.setTimeout(() => {
      missTimerRef.current = null
      setMissFlash(false)
    }, 140)
  }

  function endGame(completedRounds: boolean) {
    if (reportedRef.current) return
    reportedRef.current = true
    clearTimer()
    clearTick()
    setRunning(false)
    setFinished(true)
    setCompletedAll(completedRounds)
    setActive(null)
    setHasCoin(false)
    setWindowRatio(0)
    const final = scoreRef.current
    const earned = coinsRef.current
    const won = final >= WIN_HITS
    if (won) playWinSfx()
    const xp = Math.max(8, final * 5)
    onFinishRef.current({
      gameId: 'glow',
      won,
      score: final,
      xp,
      coinsEarned: earned,
      label:
        earned > 0
          ? `Glow Catch · ${final} hits · ${earned}◉`
          : `Glow Catch · ${final} hits`,
    })
  }

  spawnRef.current = (nextRound: number) => {
    if (nextRound > ROUNDS) {
      endGame(true)
      return
    }

    const cell = Math.floor(Math.random() * CELLS)
    const coinOnCell = Math.random() < COIN_CHANCE
    const windowMs = Math.max(520, 980 - nextRound * 35)
    roundRef.current = nextRound
    hasCoinRef.current = coinOnCell
    setActive(cell)
    setHasCoin(coinOnCell)
    setRound(nextRound)
    setWindowRatio(1)
    clearTimer()
    clearTick()

    const startedAt = performance.now()
    tickRef.current = window.setInterval(() => {
      const left = Math.max(0, windowMs - (performance.now() - startedAt))
      setWindowRatio(left / windowMs)
    }, 40)

    timerRef.current = window.setTimeout(() => {
      clearTick()
      setActive(null)
      setHasCoin(false)
      hasCoinRef.current = false
      setWindowRatio(0)
      playMissSfx()
      flashMiss()
      spawnRef.current(nextRound + 1)
    }, windowMs)
  }

  function playAgain() {
    clearTimer()
    clearTick()
    clearMiss()
    playRestartSfx()
    reportedRef.current = false
    scoreRef.current = 0
    coinsRef.current = 0
    roundRef.current = 0
    hasCoinRef.current = false
    missLockUntilRef.current = 0
    setScore(0)
    setCoinsGrabbed(0)
    setRound(0)
    setActive(null)
    setHasCoin(false)
    setMissFlash(false)
    setWindowRatio(1)
    setCompletedAll(false)
    setFinished(false)
    setSeconds(DURATION)
    setRunning(true)
    spawnRef.current(1)
  }

  function tap(index: number) {
    if (finishedRef.current) {
      playAgain()
      return
    }
    if (!runningRef.current || activeRef.current == null) return
    if (performance.now() < missLockUntilRef.current) return

    if (index === activeRef.current) {
      clearTimer()
      clearTick()
      scoreRef.current += 1
      setScore(scoreRef.current)
      if (hasCoinRef.current) {
        coinsRef.current += 1
        setCoinsGrabbed(coinsRef.current)
        playCoinSfx()
      } else {
        playHitSfx()
      }
      setActive(null)
      setHasCoin(false)
      hasCoinRef.current = false
      setWindowRatio(0)
      spawnRef.current(roundRef.current + 1)
    } else {
      playMissSfx()
      flashMiss()
      missLockUntilRef.current = performance.now() + MISS_LOCK_MS
    }
  }

  playAgainRef.current = playAgain
  tapRef.current = tap

  useEffect(() => {
    spawnRef.current(1)
    return () => {
      clearTimer()
      clearTick()
      clearMiss()
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.repeat) return
      if (finishedRef.current) {
        if (isRestartKey(e.code)) {
          e.preventDefault()
          playAgainRef.current()
        }
        return
      }
      const cell = cellFromKey(e.code)
      if (cell != null) {
        e.preventDefault()
        tapRef.current(cell)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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

  return (
    <div className="mini-game play-stage">
      <div className="mini-top">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Arcade
        </button>
        <div className="mini-stats">
          <span className="score-pill">◉ {coinsGrabbed}</span>
          <span>
            Round {Math.min(round, ROUNDS)}/{ROUNDS}
          </span>
          <span>Goal {WIN_HITS}+</span>
        </div>
      </div>

      <div className="play-header">
        <div>
          <h2 className="section-title">Glow Catch</h2>
          <p className="section-sub">
            Tap the lit cell (1–9). Coin cells bank ◉ when you hit them in time.
          </p>
        </div>
        <div className="hud-row">
          <div className="score-badge" aria-live="polite">
            <strong>{score}</strong>
            <span>Hits</span>
          </div>
          <div className="score-badge coin-grab-badge" aria-live="polite">
            <strong>{coinsGrabbed}</strong>
            <span>Coins</span>
          </div>
          <GameTimer seconds={seconds} total={DURATION} pulsing={running && !finished} />
        </div>
      </div>

      <div
        className={`panel glow-panel play-board ${missFlash ? 'miss' : ''} ${finished ? 'glow-ended' : ''}`}
        onPointerDown={
          finished
            ? (e) => {
                if ((e.target as HTMLElement).closest('button.btn')) return
                e.preventDefault()
                playAgain()
              }
            : undefined
        }
        role={finished ? 'button' : undefined}
        tabIndex={finished ? 0 : undefined}
        aria-label={finished ? 'Round over — tap to play again' : undefined}
      >
        {!finished && (
          <div
            className="glow-window"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(windowRatio * 100)}
            aria-label="Glow window remaining"
          >
            <div className="glow-window-fill" style={{ transform: `scaleX(${windowRatio})` }} />
          </div>
        )}

        <div className="glow-grid" aria-label="Glow catch board">
          {Array.from({ length: CELLS }, (_, i) => {
            const lit = active === i
            const coinLit = lit && hasCoin
            return (
              <button
                key={i}
                type="button"
                className={`glow-cell ${lit ? 'lit' : ''} ${coinLit ? 'has-coin' : ''} ${finished ? 'restartable' : ''}`}
                onPointerDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  tap(i)
                }}
                aria-label={
                  finished
                    ? 'Tap to play again'
                    : coinLit
                      ? `Glowing coin cell ${i + 1} — tap or press ${i + 1} to collect`
                      : lit
                        ? `Glowing target cell ${i + 1} — tap or press ${i + 1}`
                        : `Cell ${i + 1}`
                }
              >
                {coinLit ? (
                  <span className="glow-coin" aria-hidden="true">
                    ◉
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

        {finished && (
          <div className="mini-end overlay-end">
            <p>
              {completedAll ? 'Board clear' : 'Time’s up'} —{' '}
              <strong>{score}</strong>/{ROUNDS} hits
              {coinsGrabbed > 0 ? (
                <>
                  {' '}
                  · <strong>{coinsGrabbed}◉</strong>
                </>
              ) : null}
              {score >= WIN_HITS ? ' — sharp.' : ` · need ${WIN_HITS} to win.`}
            </p>
            <p className="section-sub again-hint">Space / Enter / R — play again</p>
            <div className="game-end-actions">
              <button
                type="button"
                className="btn btn-ember"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  playAgain()
                }}
              >
                Play again
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  onBack()
                }}
              >
                Back to arcade
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
