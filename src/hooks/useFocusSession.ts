import { useEffect, useRef, useState } from 'react'

export interface FocusSessionState {
  minutes: number
  secondsLeft: number
  sessionMinutes: number
  running: boolean
  onBreak: boolean
}

const DEFAULT: FocusSessionState = {
  minutes: 25,
  secondsLeft: 25 * 60,
  sessionMinutes: 25,
  running: false,
  onBreak: false,
}

/** Focus timer that keeps ticking/paused across tab switches. */
export function useFocusSession(onComplete: (minutes: number) => void) {
  const [session, setSession] = useState<FocusSessionState>(DEFAULT)
  const endedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!session.running || session.onBreak) return
    const id = window.setInterval(() => {
      setSession((s) => {
        if (s.secondsLeft <= 1) return { ...s, secondsLeft: 0, running: false, onBreak: false }
        return { ...s, secondsLeft: s.secondsLeft - 1 }
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [session.running, session.onBreak])

  useEffect(() => {
    if (session.secondsLeft !== 0 || endedRef.current) return
    endedRef.current = true
    onCompleteRef.current(session.sessionMinutes)
  }, [session.secondsLeft, session.sessionMinutes])

  function selectPreset(m: number) {
    if (session.running && !session.onBreak) return
    endedRef.current = false
    setSession({
      minutes: m,
      sessionMinutes: m,
      secondsLeft: m * 60,
      running: false,
      onBreak: false,
    })
  }

  function begin() {
    if (session.secondsLeft === 0) {
      endedRef.current = false
      setSession((s) => ({
        ...s,
        secondsLeft: s.minutes * 60,
        sessionMinutes: s.minutes,
        running: true,
        onBreak: false,
      }))
      return
    }
    setSession((s) => ({ ...s, running: true, onBreak: false }))
  }

  function takeBreak() {
    setSession((s) => {
      if (!s.running && !s.onBreak) return s
      return { ...s, running: false, onBreak: true }
    })
  }

  function resume() {
    if (session.secondsLeft <= 0) return
    setSession((s) => ({ ...s, running: true, onBreak: false }))
  }

  function reset() {
    endedRef.current = false
    setSession((s) => ({
      minutes: s.minutes,
      sessionMinutes: s.minutes,
      secondsLeft: s.minutes * 60,
      running: false,
      onBreak: false,
    }))
  }

  function finishEarly() {
    if (endedRef.current) return
    const full = session.sessionMinutes * 60
    if (!session.running && !session.onBreak && session.secondsLeft === full) return
    const elapsed = Math.max(1, Math.round((full - session.secondsLeft) / 60))
    endedRef.current = true
    onCompleteRef.current(elapsed)
    endedRef.current = false
    setSession((s) => ({
      minutes: s.minutes,
      sessionMinutes: s.minutes,
      secondsLeft: s.minutes * 60,
      running: false,
      onBreak: false,
    }))
  }

  return {
    session,
    selectPreset,
    begin,
    takeBreak,
    resume,
    reset,
    finishEarly,
  }
}
