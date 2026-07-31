import { useEffect, useMemo, useRef, useState } from 'react'
import { isRestartKey } from '../../lib/gameInput'
import {
  playCelebrateSfx,
  playFlipSfx,
  playMatchSfx,
  playMismatchSfx,
  playRestartSfx,
  unlockAudio,
} from '../../lib/sfx'
import type { MiniGameResult } from '../../types'
import { GameTimer } from './GameTimer'
import { PlayAgainCard } from './PlayAgainCard'

/** Larger pool so each round can draw a different random set of icons. */
const SYMBOL_POOL = [
  '◆',
  '●',
  '▲',
  '★',
  '✚',
  '◈',
  '⬡',
  '✦',
  '◇',
  '◎',
  '△',
  '✶',
  '⬢',
  '✧',
  '◉',
  '▣',
  '✵',
  '⊕',
  '❄',
  '☾',
] as const

const PAIR_COUNT = 8
const TILE_COUNT = PAIR_COUNT * 2
const DURATION = 60
/** Long enough to read a mismatch before cards flip back. */
const FLIP_REVEAL_MS = 560
const MATCH_HOLD_MS = 220

interface Tile {
  id: string
  symbol: string
  matched: boolean
}

interface Props {
  onFinish: (result: MiniGameResult) => void
  onBack: () => void
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickSymbols(count: number): string[] {
  const unique = [...new Set(SYMBOL_POOL)]
  return shuffle(unique).slice(0, count)
}

function makeBoard(round: number): Tile[] {
  const symbols = pickSymbols(PAIR_COUNT)
  const pairs = symbols.flatMap((symbol, i) => [
    { id: `r${round}-a${i}-${symbol}`, symbol, matched: false },
    { id: `r${round}-b${i}-${symbol}`, symbol, matched: false },
  ])
  return shuffle(pairs)
}

function inBounds(index: number, len: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < len
}

export function MemoryGame({ onFinish, onBack }: Props) {
  const [round, setRound] = useState(1)
  const [tiles, setTiles] = useState<Tile[]>(() => makeBoard(1))
  const [flipped, setFlipped] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [lock, setLock] = useState(false)
  const [done, setDone] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [seconds, setSeconds] = useState(DURATION)
  const [running, setRunning] = useState(true)
  const [focusIndex, setFocusIndex] = useState(0)

  const reportedRef = useRef(false)
  const movesRef = useRef(0)
  const secondsRef = useRef(DURATION)
  const flipTimerRef = useRef<number | null>(null)
  const doneRef = useRef(false)
  const lockRef = useRef(false)
  const flippedRef = useRef<number[]>([])
  const tilesRef = useRef(tiles)
  const runningRef = useRef(true)
  const focusRef = useRef(0)
  const onFinishRef = useRef(onFinish)
  const playAgainRef = useRef<() => void>(() => {})
  const flipRef = useRef<(index: number) => void>(() => {})
  const mountedRef = useRef(true)

  onFinishRef.current = onFinish
  doneRef.current = done
  lockRef.current = lock
  flippedRef.current = flipped
  tilesRef.current = tiles
  runningRef.current = running
  focusRef.current = focusIndex
  secondsRef.current = seconds

  const matchedCount = useMemo(() => tiles.filter((t) => t.matched).length, [tiles])
  const pairsFound = matchedCount / 2
  const won = done && matchedCount === TILE_COUNT

  function clearFlipTimer() {
    if (flipTimerRef.current != null) {
      window.clearTimeout(flipTimerRef.current)
      flipTimerRef.current = null
    }
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearFlipTimer()
    }
  }, [])

  useEffect(() => {
    if (!running || done) return
    if (seconds <= 0) {
      setRunning(false)
      setDone(true)
      doneRef.current = true
      clearFlipTimer()
      if (!reportedRef.current) {
        reportedRef.current = true
        onFinishRef.current({
          gameId: 'memory',
          won: false,
          score: movesRef.current,
          xp: 8,
          label: 'Memory Nest · time up',
        })
      }
      return
    }
    const id = window.setTimeout(() => setSeconds((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearTimeout(id)
  }, [running, seconds, done])

  function finishWin(finalMoves: number) {
    if (reportedRef.current || !mountedRef.current) return
    reportedRef.current = true
    doneRef.current = true
    lockRef.current = true
    clearFlipTimer()
    setRunning(false)
    setDone(true)
    setLock(true)
    setCelebrating(true)
    playCelebrateSfx()
    const xp = Math.max(12, 40 - finalMoves + Math.floor(secondsRef.current / 4))
    onFinishRef.current({
      gameId: 'memory',
      won: true,
      score: finalMoves,
      xp,
      label: `Memory Nest · ${finalMoves} moves`,
    })
  }

  function playAgain() {
    if (!mountedRef.current) return
    clearFlipTimer()
    unlockAudio()
    playRestartSfx()
    const nextRound = round + 1
    reportedRef.current = false
    movesRef.current = 0
    doneRef.current = false
    lockRef.current = false
    flippedRef.current = []
    setRound(nextRound)
    setTiles(makeBoard(nextRound))
    setFlipped([])
    setMoves(0)
    setLock(false)
    setDone(false)
    setCelebrating(false)
    setSeconds(DURATION)
    setRunning(true)
    setFocusIndex(0)
  }

  function flip(index: number) {
    unlockAudio()
    if (doneRef.current || !runningRef.current || lockRef.current) return

    const currentTiles = tilesRef.current
    if (!inBounds(index, currentTiles.length)) return
    const tile = currentTiles[index]
    if (!tile || tile.matched || flippedRef.current.includes(index)) return
    // Never flip more than one open card while waiting for a pair resolve
    if (flippedRef.current.length >= 2) return

    playFlipSfx()
    const nextFlipped = [...flippedRef.current, index]
    flippedRef.current = nextFlipped
    setFlipped(nextFlipped)
    setFocusIndex(index)

    if (nextFlipped.length < 2) return

    const [a, b] = nextFlipped
    if (!inBounds(a, currentTiles.length) || !inBounds(b, currentTiles.length)) {
      flippedRef.current = []
      setFlipped([])
      return
    }

    const nextMoves = movesRef.current + 1
    movesRef.current = nextMoves
    setMoves(nextMoves)
    setLock(true)
    lockRef.current = true

    const match = currentTiles[a].symbol === currentTiles[b].symbol
    if (match) playMatchSfx()
    else playMismatchSfx()

    clearFlipTimer()
    flipTimerRef.current = window.setTimeout(() => {
      flipTimerRef.current = null
      if (!mountedRef.current || doneRef.current) return

      if (match) {
        const updated = tilesRef.current.map((t, i) =>
          i === a || i === b ? { ...t, matched: true } : t,
        )
        tilesRef.current = updated
        setTiles(updated)
        const cleared = updated.length === TILE_COUNT && updated.every((t) => t.matched)
        flippedRef.current = []
        setFlipped([])
        if (cleared) {
          finishWin(nextMoves)
          return
        }
      } else {
        flippedRef.current = []
        setFlipped([])
      }

      if (!doneRef.current) {
        lockRef.current = false
        setLock(false)
      }
    }, match ? MATCH_HOLD_MS : FLIP_REVEAL_MS)
  }

  playAgainRef.current = playAgain
  flipRef.current = flip

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.repeat) return
      if (doneRef.current) {
        if (isRestartKey(e.code)) {
          e.preventDefault()
          playAgainRef.current()
        }
        return
      }
      if (!runningRef.current) return

      const cols = 4
      if (e.code === 'ArrowRight') {
        e.preventDefault()
        setFocusIndex((i) => (i + 1) % TILE_COUNT)
        return
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault()
        setFocusIndex((i) => (i - 1 + TILE_COUNT) % TILE_COUNT)
        return
      }
      if (e.code === 'ArrowDown') {
        e.preventDefault()
        setFocusIndex((i) => (i + cols) % TILE_COUNT)
        return
      }
      if (e.code === 'ArrowUp') {
        e.preventDefault()
        setFocusIndex((i) => (i - cols + TILE_COUNT) % TILE_COUNT)
        return
      }
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault()
        flipRef.current(focusRef.current)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className={`mini-game play-stage ${celebrating ? 'memory-celebrate' : ''}`}>
      <div className="mini-top">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Arcade
        </button>
        <div className="mini-stats">
          <span className="score-pill">Moves {moves}</span>
          <span>
            Pairs {pairsFound}/{PAIR_COUNT}
          </span>
          <span>Board {round}</span>
        </div>
      </div>

      <div className="play-header">
        <div>
          <h2 className="section-title">Memory Nest</h2>
          <p className="section-sub">
            Match every pair. Fewer moves is better — your best record keeps the lowest clear.
          </p>
        </div>
        <div className="hud-row">
          <div className="score-badge" aria-live="polite">
            <strong>{moves}</strong>
            <span>Moves</span>
          </div>
          <div className="score-badge" aria-live="polite">
            <strong>
              {pairsFound}/{PAIR_COUNT}
            </strong>
            <span>Pairs</span>
          </div>
          <GameTimer seconds={seconds} total={DURATION} pulsing={running && !done} />
        </div>
      </div>

      <div
        className={`panel play-board ${done ? 'memory-ended' : ''} ${celebrating ? 'celebrate' : ''}`}
        onPointerDown={
          done
            ? (e) => {
                if ((e.target as HTMLElement).closest('button.btn, .memory-tile')) return
                playAgain()
              }
            : undefined
        }
      >
        <div className="memory-grid" aria-label="Memory board" key={`board-${round}`}>
          {tiles.map((tile, index) => {
            const open = flipped.includes(index) || tile.matched
            return (
              <button
                key={tile.id}
                type="button"
                className={`memory-tile ${open ? 'open' : ''} ${tile.matched ? 'matched' : ''} ${focusIndex === index ? 'focused' : ''}`}
                onPointerDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (done) return
                  flip(index)
                }}
                aria-label={
                  tile.matched
                    ? `Matched ${tile.symbol}`
                    : open
                      ? `Revealed ${tile.symbol}`
                      : `Hidden tile ${index + 1}`
                }
                disabled={done || (lock && !open)}
              >
                <span aria-hidden="true">{open ? tile.symbol : '?'}</span>
              </button>
            )
          })}
        </div>

        {done && (
          <PlayAgainCard
            stopBoardRestart
            summary={
              won
                ? <>Nest cleared in <strong>{moves}</strong> moves</>
                : <>
                    Time’s up — <strong>{pairsFound}/{PAIR_COUNT}</strong> pairs
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
