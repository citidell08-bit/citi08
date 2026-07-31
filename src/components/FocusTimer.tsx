import { useEffect, useRef, useState } from 'react'
import './FocusTimer.css'

const PRESETS = [
  { label: '15m', minutes: 15 },
  { label: '25m', minutes: 25 },
  { label: '45m', minutes: 45 },
]

interface Props {
  onComplete: (minutes: number) => void
}

export function FocusTimer({ onComplete }: Props) {
  const [minutes, setMinutes] = useState(25)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [sessionMinutes, setSessionMinutes] = useState(25)
  const endedRef = useRef(false)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [running])

  useEffect(() => {
    if (secondsLeft === 0 && running && !endedRef.current) {
      endedRef.current = true
      setRunning(false)
      onComplete(sessionMinutes)
    }
  }, [secondsLeft, running, onComplete, sessionMinutes])

  function selectPreset(m: number) {
    if (running) return
    setMinutes(m)
    setSessionMinutes(m)
    setSecondsLeft(m * 60)
    endedRef.current = false
  }

  function toggle() {
    if (secondsLeft === 0) {
      setSecondsLeft(minutes * 60)
      setSessionMinutes(minutes)
      endedRef.current = false
    }
    setRunning((r) => !r)
  }

  function reset() {
    setRunning(false)
    setSecondsLeft(minutes * 60)
    setSessionMinutes(minutes)
    endedRef.current = false
  }

  function finishEarly() {
    if (!running && secondsLeft === minutes * 60) return
    const elapsed = Math.max(1, Math.round((sessionMinutes * 60 - secondsLeft) / 60))
    setRunning(false)
    endedRef.current = true
    onComplete(elapsed)
    setSecondsLeft(minutes * 60)
    setSessionMinutes(minutes)
    endedRef.current = false
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const progress = 1 - secondsLeft / (sessionMinutes * 60 || 1)

  return (
    <div className="focus">
      <header>
        <h2 className="section-title">Focus den</h2>
        <p className="section-sub">
          Sit with your kith for a timed session. Finish to earn XP and quest progress.
        </p>
      </header>

      <div className="panel timer-panel">
        <div className="ring-wrap" style={{ ['--p' as string]: String(progress) }}>
          <div className="ring">
            <div className="time" aria-live="polite">
              {mm}:{ss}
            </div>
            <div className="time-label">{running ? 'In focus' : 'Ready'}</div>
          </div>
        </div>

        <div className="presets">
          {PRESETS.map((p) => (
            <button
              key={p.minutes}
              type="button"
              className={minutes === p.minutes && !running ? 'active' : ''}
              onClick={() => selectPreset(p.minutes)}
              disabled={running}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="timer-actions">
          <button type="button" className="btn btn-ember" onClick={toggle}>
            {running ? 'Pause' : secondsLeft === 0 ? 'Restart' : 'Begin'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={reset} disabled={running}>
            Reset
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={finishEarly}
            disabled={!running && secondsLeft === minutes * 60}
          >
            Finish early
          </button>
        </div>
      </div>
    </div>
  )
}
