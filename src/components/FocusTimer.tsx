import type { FocusSessionState } from '../hooks/useFocusSession'
import './FocusTimer.css'

const PRESETS = [
  { label: '15m', minutes: 15 },
  { label: '25m', minutes: 25 },
  { label: '45m', minutes: 45 },
]

interface Props {
  session: FocusSessionState
  onSelectPreset: (minutes: number) => void
  onBegin: () => void
  onBreak: () => void
  onResume: () => void
  onReset: () => void
  onFinishEarly: () => void
}

export function FocusTimer({
  session,
  onSelectPreset,
  onBegin,
  onBreak,
  onResume,
  onReset,
  onFinishEarly,
}: Props) {
  const { minutes, secondsLeft, sessionMinutes, running, onBreak: isBreak } = session
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const progress = 1 - secondsLeft / (sessionMinutes * 60 || 1)
  const inSession = running || isBreak || secondsLeft < sessionMinutes * 60
  const status = isBreak ? 'On break' : running ? 'In focus' : secondsLeft === 0 ? 'Done' : 'Ready'

  return (
    <div className="focus">
      <header>
        <h2 className="section-title">Focus den</h2>
        <p className="section-sub">
          Timed study with Cyber Kith. Need to step away? Hit Break — your timer stays paused even
          if you switch tabs.
        </p>
      </header>

      <div className={`panel timer-panel ${isBreak ? 'on-break' : ''}`}>
        <div className="ring-wrap" style={{ ['--p' as string]: String(progress) }}>
          <div className="ring">
            <div className="time" aria-live="polite">
              {mm}:{ss}
            </div>
            <div className={`time-label ${isBreak ? 'break-label' : ''}`}>{status}</div>
          </div>
        </div>

        {isBreak && (
          <p className="break-banner" role="status">
            Break mode — timer paused. Come back and resume whenever you’re ready.
          </p>
        )}

        <div className="presets">
          {PRESETS.map((p) => (
            <button
              key={p.minutes}
              type="button"
              className={minutes === p.minutes && !running && !isBreak ? 'active' : ''}
              onClick={() => onSelectPreset(p.minutes)}
              disabled={running}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="timer-actions">
          {isBreak ? (
            <button type="button" className="btn btn-ember" onClick={onResume}>
              Resume focus
            </button>
          ) : running ? (
            <button type="button" className="btn btn-ember" onClick={onBreak}>
              Take a break
            </button>
          ) : (
            <button type="button" className="btn btn-ember" onClick={onBegin}>
              {secondsLeft === 0 ? 'Restart' : inSession ? 'Resume' : 'Begin'}
            </button>
          )}

          <button
            type="button"
            className="btn btn-ghost"
            onClick={onReset}
            disabled={running}
          >
            Reset
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onFinishEarly}
            disabled={!inSession || secondsLeft === sessionMinutes * 60}
          >
            Finish early
          </button>
        </div>
      </div>
    </div>
  )
}
