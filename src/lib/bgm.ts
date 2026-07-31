/**
 * Cyber Kith background music — procedural, zero asset files.
 * Hub ambient + per-game tracks (dash / glow / math / memory).
 */

import type { MiniGameId } from '../types'
import { getAudioGraph, unlockAudio } from './sfx'

const MUSIC_PREF_KEY = 'kith.music.on'

export type BgmTrack = 'hub' | MiniGameId

type TrackConfig = {
  bpm: number
  /** Master bus target while this track plays (0–1+). */
  volume: number
  bars: number
}

const TRACK: Record<BgmTrack, TrackConfig> = {
  hub: { bpm: 72, volume: 1.15, bars: 4 },
  dash: { bpm: 148, volume: 1.25, bars: 4 },
  glow: { bpm: 110, volume: 1.1, bars: 4 },
  math: { bpm: 132, volume: 1.2, bars: 4 },
  memory: { bpm: 88, volume: 1.05, bars: 4 },
}

let musicBus: GainNode | null = null
let running = false
let enabled = loadMusicPref()
let timer: number | null = null
let nextNoteTime = 0
let step = 0
let startedHook = false
let track: BgmTrack = 'hub'

function loadMusicPref(): boolean {
  try {
    const raw = localStorage.getItem(MUSIC_PREF_KEY)
    if (raw == null) return true
    return raw !== '0'
  } catch {
    return true
  }
}

export function isMusicEnabled(): boolean {
  return enabled
}

export function getBgmTrack(): BgmTrack {
  return track
}

export function setMusicEnabled(on: boolean): void {
  enabled = on
  try {
    localStorage.setItem(MUSIC_PREF_KEY, on ? '1' : '0')
  } catch {
    // ignore
  }
  if (on) {
    unlockAudio()
    startBgm()
  } else {
    stopBgm()
  }
}

/** Kill any already-scheduled notes so the previous track can't bleed through. */
function hardCutBus(): void {
  if (!musicBus) return
  try {
    musicBus.gain.value = 0
    musicBus.disconnect()
  } catch {
    // ignore
  }
  musicBus = null
}

/** Switch soundtrack — use 'hub' outside games. Stops the previous track immediately. */
export function setBgmTrack(next: BgmTrack): void {
  if (track === next && running && musicBus) return
  track = next
  step = 0
  hardCutBus()

  if (!enabled) return
  unlockAudio()
  const graph = getAudioGraph()
  if (!graph) return

  // Always rebuild the bus + restart scheduling on the new track
  running = false
  if (timer != null) {
    window.clearInterval(timer)
    timer = null
  }
  startBgm()
}

function ensureMusicBus(): GainNode | null {
  const graph = getAudioGraph()
  if (!graph) return null
  if (!musicBus || musicBus.context !== graph.ac) {
    musicBus = graph.ac.createGain()
    musicBus.gain.value = 0
    musicBus.connect(graph.master)
  }
  return musicBus
}

function toneAt(
  ac: AudioContext,
  dest: AudioNode,
  freq: number,
  when: number,
  dur: number,
  opts: {
    type?: OscillatorType
    gain?: number
    attack?: number
    release?: number
    filterFreq?: number
    slideTo?: number
  } = {},
) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  const filter = ac.createBiquadFilter()
  const peak = opts.gain ?? 0.04
  const attack = opts.attack ?? 0.02
  const release = opts.release ?? Math.max(0.04, dur * 0.45)

  osc.type = opts.type ?? 'sine'
  osc.frequency.setValueAtTime(Math.max(20, freq), when)
  if (opts.slideTo != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, opts.slideTo), when + dur)
  }

  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(opts.filterFreq ?? 1800, when)
  filter.Q.value = 0.7

  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.linearRampToValueAtTime(peak, when + attack)
  gain.gain.linearRampToValueAtTime(0.0001, when + dur)

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(dest)
  osc.start(when)
  osc.stop(when + dur + release)
}

function noiseTick(
  ac: AudioContext,
  dest: AudioNode,
  when: number,
  dur: number,
  gainPeak: number,
  filterFreq: number,
) {
  const frames = Math.max(1, Math.floor(ac.sampleRate * dur))
  const buffer = ac.createBuffer(1, frames, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
  const src = ac.createBufferSource()
  src.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(filterFreq, when)
  filter.Q.value = 1.2
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.linearRampToValueAtTime(gainPeak, when + 0.003)
  gain.gain.linearRampToValueAtTime(0.0001, when + dur)
  src.connect(filter)
  filter.connect(gain)
  gain.connect(dest)
  src.start(when)
  src.stop(when + dur + 0.02)
}

/** Default lobby / app ambient — louder neon pad bed. */
function scheduleHub(ac: AudioContext, bus: GainNode, start: number, beat: number) {
  const padRoot = 110
  const padFifth = 164.81
  const bass = 55
  const arp = [220, 261.63, 329.63, 392, 440, 392, 329.63, 261.63]

  toneAt(ac, bus, padRoot, start, beat * 8, {
    type: 'sawtooth',
    gain: 0.07,
    attack: 0.3,
    filterFreq: 520,
  })
  toneAt(ac, bus, padFifth, start + 0.02, beat * 8, {
    type: 'triangle',
    gain: 0.055,
    attack: 0.35,
    filterFreq: 780,
  })
  toneAt(ac, bus, padFifth * 2, start + beat * 2, beat * 5, {
    type: 'sine',
    gain: 0.032,
    attack: 0.4,
    filterFreq: 2600,
  })

  for (let i = 0; i < 8; i += 2) {
    toneAt(ac, bus, bass, start + i * beat, beat * 0.7, {
      type: 'sine',
      gain: 0.12,
      attack: 0.01,
      filterFreq: 200,
      slideTo: bass * 0.92,
    })
  }

  for (let i = 0; i < 8; i++) {
    if (i % 4 === 3 && step % 2 === 1) continue
    const t = start + i * (beat / 2)
    const freq = arp[i % arp.length]
    toneAt(ac, bus, freq, t, beat * 0.42, {
      type: 'triangle',
      gain: 0.045,
      attack: 0.005,
      filterFreq: 2400,
    })
    toneAt(ac, bus, freq, t + beat * 0.28, beat * 0.3, {
      type: 'sine',
      gain: 0.02,
      attack: 0.01,
      filterFreq: 2000,
    })
  }

  if (step % 4 === 0) {
    toneAt(ac, bus, 880, start + beat * 5.5, beat * 1.2, {
      type: 'sine',
      gain: 0.035,
      attack: 0.08,
      filterFreq: 4200,
    })
  }
}

/** Spike Dash — high-thrill runner drive. */
function scheduleDash(ac: AudioContext, bus: GainNode, start: number, beat: number) {
  const root = 146.83 // D3
  const power = [146.83, 174.61, 220, 293.66] // D F A D
  const lead = [293.66, 349.23, 440, 523.25, 587.33, 523.25, 440, 349.23]

  // Driving saw bass
  for (let i = 0; i < 8; i++) {
    const t = start + i * (beat / 2)
    toneAt(ac, bus, root * (i % 4 === 2 ? 1.5 : 1), t, beat * 0.42, {
      type: 'sawtooth',
      gain: 0.1,
      attack: 0.005,
      filterFreq: 380 + (i % 2) * 120,
      slideTo: root * 0.9,
    })
  }

  // Punchy kick-ish hits
  for (let i = 0; i < 8; i += 1) {
    const t = start + i * beat
    toneAt(ac, bus, 70, t, beat * 0.28, {
      type: 'sine',
      gain: 0.16,
      attack: 0.002,
      filterFreq: 140,
      slideTo: 40,
    })
    noiseTick(ac, bus, t, 0.04, 0.05, 1800)
  }

  // Thrill lead
  for (let i = 0; i < 8; i++) {
    const t = start + i * (beat / 2)
    toneAt(ac, bus, lead[i % lead.length], t, beat * 0.35, {
      type: 'square',
      gain: 0.055,
      attack: 0.004,
      filterFreq: 3200,
    })
  }

  // Power chord stabs
  if (step % 2 === 0) {
    for (const f of power) {
      toneAt(ac, bus, f, start + beat * 2, beat * 1.4, {
        type: 'sawtooth',
        gain: 0.04,
        attack: 0.02,
        filterFreq: 900,
      })
    }
  }
}

/** Glow Catch — ticking timer tension. */
function scheduleGlow(ac: AudioContext, bus: GainNode, start: number, beat: number) {
  const tickHigh = 1760
  const tickLow = 880
  const pad = 196 // G3

  toneAt(ac, bus, pad, start, beat * 8, {
    type: 'triangle',
    gain: 0.05,
    attack: 0.25,
    filterFreq: 700,
  })
  toneAt(ac, bus, pad * 1.5, start + 0.03, beat * 8, {
    type: 'sine',
    gain: 0.03,
    attack: 0.3,
    filterFreq: 1400,
  })

  // Clock ticks — every 16th feels like a timer
  for (let i = 0; i < 16; i++) {
    const t = start + i * (beat / 4)
    const accent = i % 4 === 0
    noiseTick(ac, bus, t, accent ? 0.035 : 0.02, accent ? 0.08 : 0.045, accent ? 2400 : 1800)
    toneAt(ac, bus, accent ? tickHigh : tickLow, t, 0.04, {
      type: 'sine',
      gain: accent ? 0.055 : 0.03,
      attack: 0.001,
      filterFreq: 4000,
    })
  }

  // Rising tension blip each bar
  toneAt(ac, bus, 440, start + beat * 3, beat * 0.9, {
    type: 'square',
    gain: 0.04,
    attack: 0.01,
    filterFreq: 2200,
    slideTo: 660,
  })
}

/** Quick Sum — urgent math-sprint thrill. */
function scheduleMath(ac: AudioContext, bus: GainNode, start: number, beat: number) {
  // Bright “calculator” fifths + racing arp
  const scale = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25] // C major run
  const bass = [130.81, 146.83, 164.81, 174.61]

  for (let i = 0; i < 8; i++) {
    const t = start + i * (beat / 2)
    toneAt(ac, bus, bass[i % bass.length], t, beat * 0.4, {
      type: 'square',
      gain: 0.08,
      attack: 0.004,
      filterFreq: 500,
    })
  }

  for (let i = 0; i < 16; i++) {
    const t = start + i * (beat / 4)
    const freq = scale[(i + step) % scale.length]
    toneAt(ac, bus, freq, t, beat * 0.22, {
      type: 'triangle',
      gain: 0.05,
      attack: 0.002,
      filterFreq: 2800,
    })
    // Soft “click” like key presses
    if (i % 2 === 0) noiseTick(ac, bus, t, 0.015, 0.03, 3200)
  }

  // High thrill stab
  toneAt(ac, bus, 784, start + beat * 2, beat * 0.5, {
    type: 'sawtooth',
    gain: 0.045,
    attack: 0.01,
    filterFreq: 2400,
    slideTo: 988,
  })
  toneAt(ac, bus, 1046.5, start + beat * 3.2, beat * 0.55, {
    type: 'square',
    gain: 0.035,
    attack: 0.008,
    filterFreq: 3600,
  })
}

/** Memory Nest — calm puzzle / memory-game vibe. */
function scheduleMemory(ac: AudioContext, bus: GainNode, start: number, beat: number) {
  const soft = [196, 246.94, 293.66, 392, 349.23, 293.66, 246.94, 220] // G-ish lullaby loop
  const pad = 98

  toneAt(ac, bus, pad, start, beat * 8, {
    type: 'sine',
    gain: 0.07,
    attack: 0.5,
    filterFreq: 400,
  })
  toneAt(ac, bus, pad * 1.5, start + 0.05, beat * 8, {
    type: 'triangle',
    gain: 0.04,
    attack: 0.55,
    filterFreq: 900,
  })

  for (let i = 0; i < 8; i++) {
    const t = start + i * beat
    toneAt(ac, bus, soft[i % soft.length], t, beat * 0.85, {
      type: 'sine',
      gain: 0.055,
      attack: 0.04,
      filterFreq: 1800,
    })
    // Soft chime echo — “card flip” atmosphere
    toneAt(ac, bus, soft[i % soft.length] * 2, t + beat * 0.35, beat * 0.5, {
      type: 'triangle',
      gain: 0.025,
      attack: 0.02,
      filterFreq: 2600,
    })
  }

  if (step % 2 === 0) {
    toneAt(ac, bus, 523.25, start + beat * 6, beat * 1.5, {
      type: 'sine',
      gain: 0.03,
      attack: 0.1,
      filterFreq: 3000,
    })
  }
}

function scheduleBar(
  ac: AudioContext,
  bus: GainNode,
  start: number,
  activeTrack: BgmTrack,
) {
  const cfg = TRACK[activeTrack]
  const beat = 60 / cfg.bpm
  switch (activeTrack) {
    case 'dash':
      scheduleDash(ac, bus, start, beat)
      break
    case 'glow':
      scheduleGlow(ac, bus, start, beat)
      break
    case 'math':
      scheduleMath(ac, bus, start, beat)
      break
    case 'memory':
      scheduleMemory(ac, bus, start, beat)
      break
    default:
      scheduleHub(ac, bus, start, beat)
  }
}

function scheduler() {
  const graph = getAudioGraph()
  const bus = ensureMusicBus()
  if (!graph || !bus || !running || !enabled) return

  // Capture track for this schedule pass so a mid-loop switch can't mix bars
  const activeTrack = track
  const { ac } = graph
  const cfg = TRACK[activeTrack]
  const beat = 60 / cfg.bpm
  const barLen = beat * cfg.bars
  const horizon = ac.currentTime + 0.35

  while (nextNoteTime < horizon) {
    // Abort if track changed while we were filling the horizon
    if (track !== activeTrack || bus !== musicBus) return
    scheduleBar(ac, bus, nextNoteTime, activeTrack)
    nextNoteTime += barLen
    step += 1
  }
}

function fadeMusic(to: number, seconds = 0.9) {
  const graph = getAudioGraph()
  const bus = ensureMusicBus()
  if (!graph || !bus) return
  const now = graph.ac.currentTime
  bus.gain.cancelScheduledValues(now)
  bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), now)
  bus.gain.linearRampToValueAtTime(Math.max(0.0001, to), now + seconds)
}

export function startBgm(): void {
  if (!enabled) return
  const graph = getAudioGraph()
  const bus = ensureMusicBus()
  if (!graph || !bus) return

  if (!running) {
    running = true
    nextNoteTime = graph.ac.currentTime + 0.08
    step = 0
    if (timer != null) window.clearInterval(timer)
    timer = window.setInterval(scheduler, 80)
  }
  fadeMusic(TRACK[track].volume, 0.8)
  scheduler()
}

export function stopBgm(): void {
  if (!running && musicBus == null) return
  running = false
  if (timer != null) {
    window.clearInterval(timer)
    timer = null
  }
  fadeMusic(0.0001, 0.5)
}

/** Auto-start BGM after the first user gesture (browser autoplay rules). */
export function installBgm(): () => void {
  if (startedHook) return () => {}
  startedHook = true

  const tryStart = () => {
    if (!enabled) return
    unlockAudio()
    startBgm()
  }

  document.addEventListener('pointerdown', tryStart, true)
  document.addEventListener('keydown', tryStart, true)

  return () => {
    document.removeEventListener('pointerdown', tryStart, true)
    document.removeEventListener('keydown', tryStart, true)
    stopBgm()
    startedHook = false
  }
}
