import { useEffect, useMemo, useRef, useState } from 'react'
import type { MiniGameResult } from '../../types'
import { GameTimer } from './GameTimer'

const SYMBOLS = ['◉', '✦', '◷', '♛', 'ϟ', '▣', '✧', '◎']
const DURATION = 60

interface Tile {
  id: number
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

function makeBoard(): Tile[] {
  const pairs = SYMBOLS.flatMap((symbol, i) => [
    { id: i * 2, symbol, matched: false },
    { id: i * 2 + 1, symbol, matched: false },
  ])
  return shuffle(pairs)
}

export function MemoryGame({ onFinish, onBack }: Props) {
  const [tiles, setTiles] = useState<Tile[]>(() => makeBoard())
  const [flipped, setFlipped] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [lock, setLock] = useState(false)
  const [done, setDone] = useState(false)
  const [seconds, setSeconds] = useState(DURATION)
  const [running, setRunning] = useState(true)
  const reportedRef = useRef(false)
  const movesRef = useRef(0)

  const matchedCount = useMemo(() => tiles.filter((t) => t.matched).length, [tiles])

  useEffect(() => {
    if (!running || done) return
    if (seconds <= 0) {
      setRunning(false)
      setDone(true)
      if (!reportedRef.current) {
        reportedRef.current = true
        onFinish({
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
  }, [running, seconds, done, onFinish])

  function finishWin(finalMoves: number) {
    if (reportedRef.current) return
    reportedRef.current = true
    setRunning(false)
    setDone(true)
    const xp = Math.max(12, 40 - finalMoves + Math.floor(seconds / 4))
    onFinish({
      gameId: 'memory',
      won: true,
      score: finalMoves,
      xp,
      label: `Memory Nest · ${finalMoves} moves`,
    })
  }

  function flip(index: number) {
    if (!running || lock || done || tiles[index].matched || flipped.includes(index)) return

    const nextFlipped = [...flipped, index]
    setFlipped(nextFlipped)

    if (nextFlipped.length < 2) return

    const nextMoves = movesRef.current + 1
    movesRef.current = nextMoves
    setMoves(nextMoves)
    setLock(true)
    const [a, b] = nextFlipped
    const match = tiles[a].symbol === tiles[b].symbol

    window.setTimeout(() => {
      if (match) {
        setTiles((prev) => {
          const updated = prev.map((t, i) =>
            i === a || i === b ? { ...t, matched: true } : t,
          )
          if (updated.every((t) => t.matched)) {
            finishWin(nextMoves)
          }
          return updated
        })
      }
      setFlipped([])
      setLock(false)
    }, 480)
  }

  return (
    <div className="mini-game play-stage">
      <div className="mini-top">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Arcade
        </button>
        <div className="mini-stats">
          <span>Moves {moves}</span>
          <span>
            Pairs {matchedCount / 2}/{SYMBOLS.length}
          </span>
        </div>
      </div>

      <div className="play-header">
        <div>
          <h2 className="section-title">Memory Nest</h2>
          <p className="section-sub">Match every pair before the timer hits zero.</p>
        </div>
        <GameTimer seconds={seconds} total={DURATION} pulsing={running && !done} />
      </div>

      <div className="panel play-board">
        <div className="memory-grid" aria-label="Memory board">
          {tiles.map((tile, index) => {
            const open = flipped.includes(index) || tile.matched
            return (
              <button
                key={`${tile.id}-${tile.symbol}`}
                type="button"
                className={`memory-tile ${open ? 'open' : ''} ${tile.matched ? 'matched' : ''}`}
                onClick={() => flip(index)}
                aria-label={open ? `Tile ${tile.symbol}` : 'Hidden tile'}
                disabled={(lock && !open) || done}
              >
                <span>{open ? tile.symbol : '?'}</span>
              </button>
            )
          })}
        </div>

        {done && (
          <div className="mini-end overlay-end">
            <p>
              {matchedCount === tiles.length
                ? `Nest cleared in ${moves} moves!`
                : 'Time is up — try again for a clearer board.'}
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
