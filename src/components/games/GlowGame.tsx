import { useEffect, useRef, useState } from 'react'
import { cellFromKey, isRestartKey } from '../../lib/gameInput'
import {
  playCoinSfx,
  playGlowSfx,
  playHitSfx,
  playMissSfx,
  playRestartSfx,
  playWinSfx,
  unlockAudio,
} from '../../lib/sfx'
import type { MiniGameResult } from '../../types'
import { GameTimer } from './GameTimer'
import { PlayAgainCard } from './PlayAgainCard'

interface Props {
  onFinish: (result: MiniGameResult) => void
  onBack: () => void
}

const CELLS = 9
const DURATION = 60
const COIN_CHANCE = 0.35
const LEVEL_PAUSE_SEC = 5
/** Brief lock after a miss so mashing every cell can't cheese the round. */
const MISS_LOCK_MS = 160

function wavesForLevel(level: number): number {
  return 4 + level
}

function targetsForLevel(level: number): number {
  return Math.min(4, 1 + Math.floor((level - 1) / 2))
}

function windowMsFor(level: number, wave: number): number {
  return Math.max(380, 980 - (level - 1) * 85 - (wave - 1) * 18)
}

function pickCells(count: number): number[] {
  const pool = Array.from({ length: CELLS }, (_, i) => i)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, Math.max(1, Math.min(CELLS, count)))
}

export function GlowGame({ onFinish, onBack }: Props) {
  const [level, setLevel] = useState(1)
  const [wave, setWave] = useState(0)
  const [lit, setLit] = useState<number[]>([])
  const [coinCell, setCoinCell] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [coinsGrabbed, setCoinsGrabbed] = useState(0)
  const [bestLevel, setBestLevel] = useState(1)
  const [running, setRunning] = useState(true)
  const [finished, setFinished] = useState(false)
  const [missFlash, setMissFlash] = useState(false)
  const [seconds, setSeconds] = useState(DURATION)
  const [windowRatio, setWindowRatio] = useState(1)
  const [pauseLeft, setPauseLeft] = useState(0)
  const [levelClearBanner, setLevelClearBanner] = useState(false)

  const timerRef = useRef<number | null>(null)
  const tickRef = useRef<number | null>(null)
  const missTimerRef = useRef<number | null>(null)
  const pauseTimerRef = useRef<number | null>(null)
  const scoreRef = useRef(0)
  const coinsRef = useRef(0)
  const levelRef = useRef(1)
  const waveRef = useRef(0)
  const bestLevelRef = useRef(1)
  const reportedRef = useRef(false)
  const finishedRef = useRef(false)
  const runningRef = useRef(true)
  const pausingRef = useRef(false)
  const litRef = useRef<number[]>([])
  const coinCellRef = useRef<number | null>(null)
  const missLockUntilRef = useRef(0)
  const onFinishRef = useRef(onFinish)
  const spawnWaveRef = useRef<(lvl: number, nextWave: number) => void>(() => {})
  const clearLevelRef = useRef<(clearedLevel: number) => void>(() => {})
  const playAgainRef = useRef<() => void>(() => {})
  const tapRef = useRef<(index: number) => void>(() => {})

  onFinishRef.current = onFinish
  finishedRef.current = finished
  runningRef.current = running
  litRef.current = lit
  coinCellRef.current = coinCell

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

  function clearPause() {
    if (pauseTimerRef.current) {
      window.clearInterval(pauseTimerRef.current)
      pauseTimerRef.current = null
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

  function endGame(reason: 'time' | 'miss') {
    if (reportedRef.current || pausingRef.current) return
    reportedRef.current = true
    clearTimer()
    clearTick()
    clearPause()
    setRunning(false)
    setFinished(true)
    setLit([])
    setCoinCell(null)
    setWindowRatio(0)
    setPauseLeft(0)
    setLevelClearBanner(false)
    pausingRef.current = false
    const final = scoreRef.current
    const earned = coinsRef.current
    const reached = bestLevelRef.current
    const won = reached >= 2 || final >= 8
    if (won) playWinSfx()
    const xp = Math.max(8, final * 4 + reached * 6)
    onFinishRef.current({
      gameId: 'glow',
      won,
      score: final,
      xp,
      coinsEarned: earned,
      label:
        earned > 0
          ? `Glow Catch · Lv ${reached} · ${final} hits · ${earned}◉`
          : `Glow Catch · Lv ${reached} · ${final} hits`,
    })
    void reason
  }

  clearLevelRef.current = (clearedLevel: number) => {
    if (finishedRef.current || pausingRef.current) return
    pausingRef.current = true
    clearTimer()
    clearTick()
    setLit([])
    setCoinCell(null)
    litRef.current = []
    coinCellRef.current = null
    setWindowRatio(0)
    setLevelClearBanner(true)
    setPauseLeft(LEVEL_PAUSE_SEC)
    playWinSfx()

    const nextLevel = clearedLevel + 1
    let left = LEVEL_PAUSE_SEC
    clearPause()
    pauseTimerRef.current = window.setInterval(() => {
      left -= 1
      setPauseLeft(Math.max(0, left))
      if (left <= 0) {
        clearPause()
        pausingRef.current = false
        setLevelClearBanner(false)
        levelRef.current = nextLevel
        bestLevelRef.current = Math.max(bestLevelRef.current, nextLevel)
        setLevel(nextLevel)
        setBestLevel(bestLevelRef.current)
        waveRef.current = 0
        setWave(0)
        if (!finishedRef.current && runningRef.current) {
          spawnWaveRef.current(nextLevel, 1)
        }
      }
    }, 1000)
  }

  spawnWaveRef.current = (lvl: number, nextWave: number) => {
    if (finishedRef.current || pausingRef.current) return
    const totalWaves = wavesForLevel(lvl)
    if (nextWave > totalWaves) {
      clearLevelRef.current(lvl)
      return
    }

    const count = targetsForLevel(lvl)
    const cells = pickCells(count)
    const coinOn =
      Math.random() < COIN_CHANCE ? cells[Math.floor(Math.random() * cells.length)] : null
    const windowMs = windowMsFor(lvl, nextWave)

    waveRef.current = nextWave
    levelRef.current = lvl
    litRef.current = cells
    coinCellRef.current = coinOn
    setWave(nextWave)
    setLevel(lvl)
    setLit(cells)
    setCoinCell(coinOn)
    setWindowRatio(1)
    playGlowSfx()
    clearTimer()
    clearTick()

    const startedAt = performance.now()
    tickRef.current = window.setInterval(() => {
      const left = Math.max(0, windowMs - (performance.now() - startedAt))
      setWindowRatio(left / windowMs)
    }, 40)

    timerRef.current = window.setTimeout(() => {
      clearTick()
      setLit([])
      setCoinCell(null)
      litRef.current = []
      coinCellRef.current = null
      setWindowRatio(0)
      playMissSfx()
      flashMiss()
      // Missed a wave — run over, back to level 1 on play again
      endGame('miss')
    }, windowMs)
  }

  function playAgain() {
    clearTimer()
    clearTick()
    clearMiss()
    clearPause()
    playRestartSfx()
    reportedRef.current = false
    pausingRef.current = false
    scoreRef.current = 0
    coinsRef.current = 0
    levelRef.current = 1
    waveRef.current = 0
    bestLevelRef.current = 1
    litRef.current = []
    coinCellRef.current = null
    missLockUntilRef.current = 0
    setScore(0)
    setCoinsGrabbed(0)
    setLevel(1)
    setWave(0)
    setBestLevel(1)
    setLit([])
    setCoinCell(null)
    setMissFlash(false)
    setWindowRatio(1)
    setPauseLeft(0)
    setLevelClearBanner(false)
    setFinished(false)
    setSeconds(DURATION)
    setRunning(true)
    spawnWaveRef.current(1, 1)
  }

  function tap(index: number) {
    unlockAudio()
    if (finishedRef.current) {
      playAgain()
      return
    }
    if (pausingRef.current) return
    if (!runningRef.current) return
    if (performance.now() < missLockUntilRef.current) return

    const current = litRef.current
    if (!current.includes(index)) {
      playMissSfx()
      flashMiss()
      missLockUntilRef.current = performance.now() + MISS_LOCK_MS
      return
    }

    // Remove this lit cell
    const remaining = current.filter((c) => c !== index)
    litRef.current = remaining
    setLit(remaining)

    scoreRef.current += 1
    setScore(scoreRef.current)

    if (coinCellRef.current === index) {
      coinsRef.current += 1
      setCoinsGrabbed(coinsRef.current)
      coinCellRef.current = null
      setCoinCell(null)
      playCoinSfx()
    } else {
      playHitSfx()
    }

    if (remaining.length === 0) {
      clearTimer()
      clearTick()
      setWindowRatio(0)
      spawnWaveRef.current(levelRef.current, waveRef.current + 1)
    }
  }

  playAgainRef.current = playAgain
  tapRef.current = tap

  useEffect(() => {
    spawnWaveRef.current(1, 1)
    return () => {
      clearTimer()
      clearTick()
      clearMiss()
      clearPause()
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
      if (pausingRef.current) return
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
    if (!running || finished || pauseLeft > 0) return
    if (seconds <= 0) {
      endGameRef.current('time')
      return
    }
    const id = window.setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => window.clearTimeout(id)
  }, [running, seconds, finished, pauseLeft])

  const totalWaves = wavesForLevel(level)
  const targetsNow = targetsForLevel(level)

  return (
    <div className="mini-game play-stage">
      <div className="mini-top">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Arcade
        </button>
        <div className="mini-stats">
          <span className="score-pill">◉ {coinsGrabbed}</span>
          <span className="score-pill">Lv {level}</span>
          <span>
            Wave {Math.min(wave, totalWaves)}/{totalWaves}
          </span>
          <span>{targetsNow} lit</span>
        </div>
      </div>

      <div className="play-header">
        <div>
          <h2 className="section-title">Glow Catch</h2>
          <p className="section-sub">
            Clear every lit cell before time runs out. Win a level for a 5s break — then it gets
            faster with more targets. Lose and Play again restarts at level 1.
          </p>
        </div>
        <div className="hud-row">
          <div className="score-badge" aria-live="polite">
            <strong>{score}</strong>
            <span>Hits</span>
          </div>
          <div className="score-badge" aria-live="polite">
            <strong>{level}</strong>
            <span>Level</span>
          </div>
          <div className="score-badge coin-grab-badge" aria-live="polite">
            <strong>{coinsGrabbed}</strong>
            <span>Coins</span>
          </div>
          <GameTimer
            seconds={seconds}
            total={DURATION}
            pulsing={running && !finished && pauseLeft === 0}
          />
        </div>
      </div>

      <div
        className={`panel glow-panel play-board ${missFlash ? 'miss' : ''} ${finished ? 'glow-ended' : ''} ${levelClearBanner ? 'level-pause' : ''}`}
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
        {levelClearBanner && (
          <div className="glow-level-pause" aria-live="polite">
            <strong>Level {level} cleared</strong>
            <p>Harder &amp; faster in {pauseLeft}s…</p>
          </div>
        )}

        {!finished && !levelClearBanner && (
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
            const isLit = lit.includes(i)
            const coinLit = isLit && coinCell === i
            return (
              <button
                key={i}
                type="button"
                className={`glow-cell ${isLit ? 'lit' : ''} ${coinLit ? 'has-coin' : ''} ${finished ? 'restartable' : ''}`}
                disabled={levelClearBanner && !finished}
                onPointerDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  tap(i)
                }}
                aria-label={
                  finished
                    ? 'Tap to play again'
                    : coinLit
                      ? `Glowing coin cell ${i + 1}`
                      : isLit
                        ? `Glowing target cell ${i + 1}`
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
          <PlayAgainCard
            stopBoardRestart
            summary={
              <>
                Reached <strong>Lv {bestLevel}</strong> — <strong>{score}</strong> hits
                {coinsGrabbed > 0 ? (
                  <>
                    {' '}
                    · <strong>{coinsGrabbed}◉</strong>
                  </>
                ) : null}
                <span className="play-again-note"> Play again starts at level 1.</span>
              </>
            }
            onAgain={playAgain}
            onBack={onBack}
          />
        )}
      </div>
    </div>
  )
}
