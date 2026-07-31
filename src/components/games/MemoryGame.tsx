import { useMemo, useState } from 'react'
import type { MiniGameResult } from '../../types'

const SYMBOLS = ['◉', '✦', '◷', '♛', 'ϟ', '▣', '✧', '◎']

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

export function MemoryGame({ onFinish, onBack }: Props) {
  const [tiles, setTiles] = useState<Tile[]>(() => makeBoard())
  const [flipped, setFlipped] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [lock, setLock] = useState(false)
  const [done, setDone] = useState(false)

  const matchedCount = useMemo(() => tiles.filter((t) => t.matched).length, [tiles])

  function makeBoard(): Tile[] {
    const pairs = SYMBOLS.flatMap((symbol, i) => [
      { id: i * 2, symbol, matched: false },
      { id: i * 2 + 1, symbol, matched: false },
    ])
    return shuffle(pairs)
  }

  function restart() {
    setTiles(makeBoard())
    setFlipped([])
    setMoves(0)
    setLock(false)
    setDone(false)
  }

  function flip(index: number) {
    if (lock || done || tiles[index].matched || flipped.includes(index)) return

    const nextFlipped = [...flipped, index]
    setFlipped(nextFlipped)

    if (nextFlipped.length < 2) return

    setMoves((m) => m + 1)
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
            const finalMoves = moves + 1
            const xp = Math.max(12, 40 - finalMoves)
            setDone(true)
            onFinish({
              gameId: 'memory',
              won: true,
              score: finalMoves,
              xp,
              label: `Memory Nest · ${finalMoves} moves`,
            })
          }
          return updated
        })
      }
      setFlipped([])
      setLock(false)
    }, 520)
  }

  return (
    <div className="mini-game">
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

      <h2 className="section-title">Memory Nest</h2>
      <p className="section-sub">Match every pair. Fewer moves = more XP.</p>

      <div className="memory-grid">
        {tiles.map((tile, index) => {
          const open = flipped.includes(index) || tile.matched
          return (
            <button
              key={`${tile.id}-${tile.symbol}`}
              type="button"
              className={`memory-tile ${open ? 'open' : ''} ${tile.matched ? 'matched' : ''}`}
              onClick={() => flip(index)}
              aria-label={open ? tile.symbol : 'Hidden tile'}
              disabled={lock && !open}
            >
              <span>{open ? tile.symbol : '?'}</span>
            </button>
          )
        })}
      </div>

      {done && (
        <div className="mini-end">
          <p>Nest cleared in {moves} moves.</p>
          <button type="button" className="btn btn-primary" onClick={restart}>
            Play again
          </button>
        </div>
      )}
    </div>
  )
}
