import { useEffect, useState } from 'react'
import { isMusicEnabled, setMusicEnabled } from '../lib/bgm'
import { unlockAudio } from '../lib/sfx'
import './MusicToggle.css'

export function MusicToggle() {
  const [on, setOn] = useState(() => isMusicEnabled())

  useEffect(() => {
    setOn(isMusicEnabled())
  }, [])

  return (
    <button
      type="button"
      className={`music-toggle ${on ? 'on' : 'off'}`}
      aria-pressed={on}
      aria-label={on ? 'Mute background music' : 'Play background music'}
      title={on ? 'Music on — tap to mute' : 'Music off — tap to play'}
      onClick={() => {
        unlockAudio()
        const next = !on
        setMusicEnabled(next)
        setOn(next)
      }}
    >
      <span aria-hidden="true">{on ? '♪' : '♩'}</span>
      <span className="music-toggle-label">{on ? 'Music' : 'Muted'}</span>
    </button>
  )
}
