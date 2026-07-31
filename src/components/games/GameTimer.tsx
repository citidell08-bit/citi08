import './GameTimer.css'

interface Props {
  seconds: number
  total: number
  label?: string
  pulsing?: boolean
}

export function GameTimer({ seconds, total, label = 'Time', pulsing }: Props) {
  const ratio = total <= 0 ? 0 : Math.max(0, Math.min(1, seconds / total))
  const urgent = seconds <= 5 && seconds > 0

  return (
    <div
      className={`game-timer ${urgent ? 'urgent' : ''} ${pulsing ? 'pulse' : ''}`}
      role="timer"
      aria-live="polite"
      aria-label={`${label}: ${seconds} seconds remaining`}
    >
      <div
        className="game-timer-ring"
        style={{ ['--ratio' as string]: String(ratio) }}
      >
        <div className="game-timer-core">
          <strong>{seconds}</strong>
          <span>{label}</span>
        </div>
      </div>
    </div>
  )
}
