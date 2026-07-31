/**
 * Cyber Kith background music — procedural neon ambient, zero asset files.
 * Soft A-minor pulse + pad + sparse arp that sits under the UI.
 */

import { getAudioGraph, unlockAudio } from './sfx'

const MUSIC_PREF_KEY = 'kith.music.on'
const BPM = 72
const BEAT = 60 / BPM

let musicBus: GainNode | null = null
let running = false
let enabled = loadMusicPref()
let timer: number | null = null
let nextNoteTime = 0
let step = 0
let startedHook = false

/** A minor cyber palette (Hz). */
const PAD_ROOT = 110 // A2
const PAD_FIFTH = 164.81 // E3
const BASS = 55 // A1
const ARP = [220, 261.63, 329.63, 392, 440, 392, 329.63, 261.63] // A3…A4 wave

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

function scheduleBar(ac: AudioContext, bus: GainNode, start: number) {
  // Warm pad bed
  toneAt(ac, bus, PAD_ROOT, start, BEAT * 8, {
    type: 'sawtooth',
    gain: 0.028,
    attack: 0.35,
    release: 0.5,
    filterFreq: 420,
  })
  toneAt(ac, bus, PAD_FIFTH, start + 0.02, BEAT * 8, {
    type: 'triangle',
    gain: 0.022,
    attack: 0.4,
    release: 0.5,
    filterFreq: 620,
  })
  // Soft fifth shimmer an octave up
  toneAt(ac, bus, PAD_FIFTH * 2, start + BEAT * 2, BEAT * 5, {
    type: 'sine',
    gain: 0.012,
    attack: 0.5,
    filterFreq: 2400,
  })

  // Heartbeat bass every other beat
  for (let i = 0; i < 8; i += 2) {
    const t = start + i * BEAT
    toneAt(ac, bus, BASS, t, BEAT * 0.7, {
      type: 'sine',
      gain: 0.055,
      attack: 0.01,
      release: 0.2,
      filterFreq: 180,
      slideTo: BASS * 0.92,
    })
  }

  // Sparse neon arp
  for (let i = 0; i < 8; i++) {
    const t = start + i * (BEAT / 2)
    const freq = ARP[i % ARP.length]
    // Leave breathing room — skip every 4th hit occasionally
    if (i % 4 === 3 && step % 2 === 1) continue
    toneAt(ac, bus, freq, t, BEAT * 0.42, {
      type: 'triangle',
      gain: 0.018,
      attack: 0.005,
      filterFreq: 2200,
    })
    // Quiet echo
    toneAt(ac, bus, freq, t + BEAT * 0.28, BEAT * 0.3, {
      type: 'sine',
      gain: 0.008,
      attack: 0.01,
      filterFreq: 1800,
    })
  }

  // Occasional high neon sparkle
  if (step % 4 === 0) {
    toneAt(ac, bus, 880, start + BEAT * 5.5, BEAT * 1.2, {
      type: 'sine',
      gain: 0.014,
      attack: 0.08,
      filterFreq: 4000,
    })
  }
}

function scheduler() {
  const graph = getAudioGraph()
  const bus = ensureMusicBus()
  if (!graph || !bus || !running || !enabled) return

  const { ac } = graph
  const horizon = ac.currentTime + 0.35

  while (nextNoteTime < horizon) {
    scheduleBar(ac, bus, nextNoteTime)
    nextNoteTime += BEAT * 4
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
  if (!enabled || running) return
  const graph = getAudioGraph()
  const bus = ensureMusicBus()
  if (!graph || !bus) return

  running = true
  nextNoteTime = graph.ac.currentTime + 0.08
  step = 0
  fadeMusic(0.55, 1.2)
  scheduler()
  if (timer != null) window.clearInterval(timer)
  timer = window.setInterval(scheduler, 100)
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
