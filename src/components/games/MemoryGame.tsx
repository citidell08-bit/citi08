import { useEffect, useMemo, useRef, useState } from 'react'
import { isRestartKey } from '../../lib/gameInput'
import type { MiniGameResult } from '../../types'
import { GameTimer } from './GameTimer'

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
]

const PAIR_COUNT = 8
const DURATION = 60
const FLIP_REVEAL_MS = 300

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

export function MemoryGame({ onFinish, onBack }: Props) {
  const [round, setRound] = useState(1)
  const [tiles, setTiles] = useState<Tile[]>(() => makeBoard(1))
  const [flipped, setFlipped] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [lock, setLock] = useState(false)
  const [done, setDone] = useState(false)
  const [seconds, setSeconds] = useState(DURATION)
  const [running, setRunning] = useState(true)
  const [focusIndex, setFocusIndex] = useState(0)
  const reportedRef = useRef(false)
  const movesRef = useRef(0)
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

  onFinishRef.current = onFinish
  doneRef.current = done
  lockRef.current = lock
  flippedRef.current = flipped
  tilesRef.current = tiles
  runningRef.current = running
  focusRef.current = focusIndex

  const matchedCount = useMemo(() => tiles.filter((t) => t.matched).length, [tiles])
  const won = done && matchedCount === tiles.length

  useEffect(() => {
    return () => {
      if (flipTimerRef.current != null) {
        window.clearTimeout(flipTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!running || done) return
    if (seconds <= 0) {
      setRunning(false)
      setDone(true)
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
    const id = window.setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => window.clearTimeout(id)
  }, [running, seconds, done])

  function finishWin(finalMoves: number) {
    if (reportedRef.current) return
    reportedRef.current = true
    setRunning(false)
    setDone(true)
    const xp = Math.max(12, 40 - finalMoves + Math.floor(seconds / 4))
    onFinishRef.current({
      gameId: 'memory',
      won: true,
      score: finalMoves,
      xp,
      label: `Memory Nest · ${finalMoves} moves`,
    })
  }

  function playAgain() {
    if (flipTimerRef.current != null) {
      window.clearTimeout(flipTimerRef.current)
      flipTimerRef.current = null
    }
    const nextRound = round + 1
    reportedRef.current = false
    movesRef.current = 0
    setRound(nextRound)
    setTiles(makeBoard(nextRound))
    setFlipped([])
    setMoves(0)
    setLock(false)
    setDone(false)
    setSeconds(DURATION)
    setRunning(true)
    setFocusIndex(0)
  }

  function flip(index: number) {
    const currentTiles = tilesRef.current
    if (
      !runningRef.current ||
      lockRef.current ||
      doneRef.current ||
      currentTiles[index]?.matched ||
      flippedRef.current.includes(index)
    ) {
      return
    }

    const nextFlipped = [...flippedRef.current, index]
    flippedRef.current = nextFlipped
    setFlipped(nextFlipped)
    setFocusIndex(index)

    if (nextFlipped.length < 2) return

    const nextMoves = movesRef.current + 1
    movesRef.current = nextMoves
    setMoves(nextMoves)
    setLock(true)
    lockRef.current = true
    const [a, b] = nextFlipped
    const match = currentTiles[a].symbol === currentTiles[b].symbol

    flipTimerRef.current = window.setTimeout(() => {
      flipTimerRef.current = null
      if (match) {
        let cleared = false
        setTiles((prev) => {
          const updated = prev.map((t, i) =>
            i === a || i === b ? { ...t, matched: true } : t,
          )
          cleared = updated.every((t) => t.matched)
          return updated
        })
        if (cleared) {
          queueMicrotask(() => finishWin(nextMoves))
        }
      }
      flippedRef.current = []
      setFlipped([])
      lockRef.current = false
      setLock(false)
    }, FLIP_REVEAL_MS)
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
      const total = PAIR_COUNT * 2
      if (e.code === 'ArrowRight') {
        e.preventDefault()
        setFocusIndex((i) => (i + 1) % total)
        return
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault()
        setFocusIndex((i) => (i - 1 + total) % total)
        return
      }
      if (e.code === 'ArrowDown') {
        e.preventDefault()
        setFocusIndex((i) => (i + cols) % total)
        return
      }
      if (e.code === 'ArrowUp') {
        e.preventDefault()
        setFocusIndex((i) => (i - cols + total) % total)
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
    <div className="mini-game play-stage">
      <div className="mini-top">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Arcade
        </button>
        <div className="mini-stats">
          <span className="score-pill">Score {(matchedCount / 2) * 100}</span>
          <span>Round {round}</span>
          <span>Moves {moves}</span>
          <span>
            Pairs {matchedCount / 2}/{PAIR_COUNT}
          </span>
        </div>
      </div>

      <div className="play-header">
        <div>
          <h2 className="section-title">Memory Nest</h2>
          <p className="section-sub">
            Click tiles or use arrows + Space/Enter. When done, Space restarts a random board.
          </p>
        </div>
        <div className="hud-row">
          <div className="dash-score-badge" aria-live="polite">
            <strong>{(matchedCount / 2) * 100}</strong>
            <span>Score</span>
          </div>
          <GameTimer seconds={seconds} total={DURATION} pulsing={running && !done} />
        </div>
      </div>

      <div className="panel play-board">
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
                  if (done) {
                    playAgain()
                    return
                  }
                  flip(index)
                }}
                aria-label={open ? `Tile ${tile.symbol}` : 'Hidden tile'}
                disabled={!done && lock && !open}
              >
                <span>{open ? tile.symbol : '?'}</span>
              </button>
            )
          })}
        </div>

        {done && (
          <div className="mini-end overlay-end">
            <p>
              {won
                ? `Nest cleared in ${moves} moves!`
                : 'Time is up — try a new random board.'}
            </p>
            <p className="section-sub memory-again-hint">
              Click a tile or press Space / Enter / R for a fresh random board.
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
