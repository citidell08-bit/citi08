import type { ReactNode, SyntheticEvent } from 'react'

interface Props {
  summary: ReactNode
  onAgain: () => void
  onBack: () => void
  /** Stop pointer events bubbling to a board restart handler. */
  stopBoardRestart?: boolean
}

/** Short pulsed end card — Play again? */
export function PlayAgainCard({ summary, onAgain, onBack, stopBoardRestart }: Props) {
  const stop = stopBoardRestart
    ? (e: SyntheticEvent) => e.stopPropagation()
    : undefined

  return (
    <div
      className="mini-end overlay-end play-again-card"
      onPointerDown={
        stopBoardRestart
          ? (e) => {
              if ((e.target as HTMLElement).closest('button')) return
              onAgain()
            }
          : undefined
      }
    >
      <p className="play-again-title">Play again?</p>
      <p className="play-again-summary">{summary}</p>
      <p className="section-sub again-hint">Space / Enter / R</p>
      <div className="game-end-actions">
        <button
          type="button"
          className="btn btn-ember"
          onPointerDown={stop}
          onClick={(e) => {
            stop?.(e)
            onAgain()
          }}
        >
          Play again
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onPointerDown={stop}
          onClick={(e) => {
            stop?.(e)
            onBack()
          }}
        >
          Arcade
        </button>
      </div>
    </div>
  )
}
