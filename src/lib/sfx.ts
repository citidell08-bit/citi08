/**
 * Cyber Kith SFX — offline Web Audio, zero asset files.
 * Clicks fire on pointerdown so sound matches the press, not the release.
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null
let clickBound = false
let lastClickKey = ''
let lastClickAt = 0
let resumePromise: Promise<void> | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!ctx) {
    ctx = new AC()
    master = ctx.createGain()
    // Keep headroom; individual tones set their own peaks.
    master.gain.value = 1
    master.connect(ctx.destination)
  }
  return ctx
}

function ensureRunning(): AudioContext | null {
  const ac = getCtx()
  if (!ac) return null
  if (ac.state === 'suspended') {
    resumePromise ??= ac
      .resume()
      .catch(() => {})
      .finally(() => {
        resumePromise = null
      })
  }
  return ac
}

function bus(): GainNode | null {
  const ac = ensureRunning()
  if (!ac || !master) return null
  return master
}

/** Unlock / resume audio from any user gesture. Safe to call often. */
export function unlockAudio(): void {
  const ac = ensureRunning()
  if (!ac || !master) return
  // Warm the graph so the first real SFX isn't dropped on some browsers.
  try {
    const osc = ac.createOscillator()
    const g = ac.createGain()
    g.gain.value = 0.00001
    osc.connect(g)
    g.connect(master)
    const t = ac.currentTime
    osc.start(t)
    osc.stop(t + 0.01)
  } catch {
    // ignore
  }
}

function tone(
  frequency: number,
  duration: number,
  opts?: {
    type?: OscillatorType
    gain?: number
    slideTo?: number
    delay?: number
    attack?: number
  },
) {
  const ac = ensureRunning()
  const out = bus()
  if (!ac || !out) return

  const start = ac.currentTime + (opts?.delay ?? 0)
  const attack = opts?.attack ?? 0.004
  const peak = opts?.gain ?? 0.1
  const osc = ac.createOscillator()
  const gain = ac.createGain()

  osc.type = opts?.type ?? 'square'
  osc.frequency.setValueAtTime(Math.max(20, frequency), start)
  if (opts?.slideTo != null) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(40, opts.slideTo),
      start + Math.max(0.02, duration),
    )
  }

  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.linearRampToValueAtTime(peak, start + attack)
  gain.gain.linearRampToValueAtTime(0.0001, start + duration)

  osc.connect(gain)
  gain.connect(out)
  osc.start(start)
  osc.stop(start + duration + 0.03)
}

function noiseBurst(
  duration: number,
  opts?: {
    gain?: number
    delay?: number
    filterFreq?: number
    filterEnd?: number
    filterType?: BiquadFilterType
  },
) {
  const ac = ensureRunning()
  const out = bus()
  if (!ac || !out) return

  const start = ac.currentTime + (opts?.delay ?? 0)
  const frames = Math.max(1, Math.floor(ac.sampleRate * duration))
  const buffer = ac.createBuffer(1, frames, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) {
    const env = 1 - i / frames
    data[i] = (Math.random() * 2 - 1) * env
  }

  const src = ac.createBufferSource()
  src.buffer = buffer
  const filter = ac.createBiquadFilter()
  const startFreq = opts?.filterFreq ?? 900
  const endFreq = opts?.filterEnd ?? Math.max(140, startFreq * 0.15)
  filter.type = opts?.filterType ?? 'lowpass'
  filter.Q.value = filter.type === 'bandpass' ? 0.85 : 0.7
  filter.frequency.setValueAtTime(startFreq, start)
  filter.frequency.linearRampToValueAtTime(endFreq, start + duration)
  const gain = ac.createGain()
  const peak = opts?.gain ?? 0.06
  const attack = Math.min(0.004, duration * 0.25)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.linearRampToValueAtTime(peak, start + attack)
  gain.gain.linearRampToValueAtTime(0.0001, start + duration)

  src.connect(filter)
  filter.connect(gain)
  gain.connect(out)
  src.start(start)
  src.stop(start + duration + 0.02)
}

/** Dry mechanical click — just a switch, nothing neon/musical. */
export function playClickSfx(): void {
  unlockAudio()
  // Soft body thump of the switch
  tone(120, 0.016, { type: 'sine', gain: 0.085, attack: 0.0003, slideTo: 55 })
  // Hard plastic snap
  noiseBurst(0.011, {
    gain: 0.11,
    filterFreq: 1800,
    filterEnd: 500,
    filterType: 'bandpass',
  })
}

/** Short cue when a mini-game starts. */
export function playStartSfx(): void {
  unlockAudio()
  tone(520, 0.05, { type: 'square', gain: 0.07, attack: 0.002, slideTo: 780 })
  tone(780, 0.07, { type: 'triangle', gain: 0.05, delay: 0.04, slideTo: 1040 })
}

export function playJumpSfx(): void {
  unlockAudio()
  tone(480, 0.085, { type: 'square', gain: 0.11, attack: 0.003, slideTo: 920 })
  tone(760, 0.06, { type: 'triangle', gain: 0.055, delay: 0.015, slideTo: 1180 })
}

/** Short percussive crash — dies often, so keep it snappy. */
export function playCrashSfx(): void {
  unlockAudio()
  noiseBurst(0.1, { gain: 0.07, filterFreq: 720 })
  tone(190, 0.11, { type: 'sawtooth', gain: 0.1, slideTo: 70, attack: 0.002 })
  tone(95, 0.13, { type: 'triangle', gain: 0.065, delay: 0.02, slideTo: 45 })
}

/** Access denied + sad whomp-whomp (level / gate fails). */
export function playAccessDeniedSfx(): void {
  unlockAudio()
  tone(210, 0.14, { type: 'sawtooth', gain: 0.11, slideTo: 85 })
  tone(130, 0.18, { type: 'square', gain: 0.07, slideTo: 50, delay: 0.03 })
  noiseBurst(0.16, { gain: 0.055, filterFreq: 550 })
  tone(155, 0.24, { type: 'triangle', gain: 0.13, slideTo: 68, delay: 0.2 })
  tone(125, 0.3, { type: 'triangle', gain: 0.12, slideTo: 48, delay: 0.46 })
  tone(290, 0.07, { type: 'square', gain: 0.055, delay: 0.76 })
  tone(230, 0.12, { type: 'square', gain: 0.055, delay: 0.88 })
}

/** Crisp correct hit (Glow / Quick Sum). */
export function playHitSfx(): void {
  unlockAudio()
  tone(880, 0.05, { type: 'square', gain: 0.075, attack: 0.001, slideTo: 1240 })
  tone(1320, 0.07, { type: 'triangle', gain: 0.05, delay: 0.02, slideTo: 1680 })
}

/** Soft miss / wrong tap. */
export function playMissSfx(): void {
  unlockAudio()
  tone(220, 0.08, { type: 'triangle', gain: 0.07, slideTo: 110 })
  noiseBurst(0.06, { gain: 0.04, filterFreq: 420 })
}

/** Memory tile flip. */
export function playFlipSfx(): void {
  unlockAudio()
  tone(620, 0.04, { type: 'triangle', gain: 0.06, attack: 0.001, slideTo: 860 })
}

/** Memory pair match. */
export function playMatchSfx(): void {
  unlockAudio()
  tone(660, 0.055, { type: 'square', gain: 0.07 })
  tone(880, 0.08, { type: 'triangle', gain: 0.055, delay: 0.05 })
  tone(1175, 0.1, { type: 'sine', gain: 0.05, delay: 0.1 })
}

/** Memory mismatch. */
export function playMismatchSfx(): void {
  unlockAudio()
  tone(340, 0.07, { type: 'square', gain: 0.06, slideTo: 180 })
  tone(260, 0.09, { type: 'triangle', gain: 0.045, delay: 0.04, slideTo: 140 })
}

/** Soft ping when a Glow cell lights up. */
export function playGlowSfx(): void {
  unlockAudio()
  tone(740, 0.06, { type: 'sine', gain: 0.055, attack: 0.002, slideTo: 980 })
  tone(1100, 0.05, { type: 'triangle', gain: 0.03, delay: 0.03 })
}

/** Access granted / level-up fanfare. */
export function playAccessGrantedSfx(): void {
  unlockAudio()
  tone(440, 0.07, { type: 'square', gain: 0.07 })
  tone(554, 0.07, { type: 'square', gain: 0.07, delay: 0.07 })
  tone(659, 0.09, { type: 'triangle', gain: 0.08, delay: 0.14 })
  tone(880, 0.16, { type: 'triangle', gain: 0.095, delay: 0.25 })
  tone(1175, 0.2, { type: 'sine', gain: 0.065, delay: 0.38 })
  tone(1760, 0.12, { type: 'sine', gain: 0.035, delay: 0.5 })
}

export function playWinSfx(): void {
  playAccessGrantedSfx()
}

/**
 * Birthday-party style celebration — short “Happy Birthday”–flavored fanfare
 * for clearing Memory Nest (and similar full clears).
 */
export function playCelebrateSfx(): void {
  unlockAudio()
  // Phrase 1: C C D C F E
  const phrase1: Array<[number, number]> = [
    [523.25, 0],
    [523.25, 0.14],
    [587.33, 0.3],
    [523.25, 0.5],
    [698.46, 0.7],
    [659.25, 0.96],
  ]
  // Phrase 2: C C D C G F
  const phrase2: Array<[number, number]> = [
    [523.25, 1.28],
    [523.25, 1.42],
    [587.33, 1.58],
    [523.25, 1.78],
    [783.99, 1.98],
    [698.46, 2.24],
  ]
  for (const [freq, delay] of [...phrase1, ...phrase2]) {
    tone(freq, 0.16, { type: 'triangle', gain: 0.075, delay, attack: 0.008 })
    tone(freq * 2, 0.1, { type: 'sine', gain: 0.028, delay: delay + 0.02 })
  }
  // Party sparkles / confetti chirps
  tone(1568, 0.07, { type: 'sine', gain: 0.04, delay: 0.85 })
  tone(2093, 0.08, { type: 'sine', gain: 0.035, delay: 1.15 })
  tone(2349, 0.1, { type: 'sine', gain: 0.03, delay: 2.35 })
  tone(2794, 0.12, { type: 'sine', gain: 0.025, delay: 2.5 })
}

export function playRestartSfx(): void {
  unlockAudio()
  tone(420, 0.05, { type: 'square', gain: 0.065, slideTo: 680 })
}

/** Bright coin pickup chime. */
export function playCoinSfx(): void {
  unlockAudio()
  tone(980, 0.055, { type: 'square', gain: 0.08, attack: 0.002, slideTo: 1400 })
  tone(1320, 0.09, { type: 'triangle', gain: 0.055, delay: 0.03, slideTo: 1760 })
}

function isClickable(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null
  if (target.closest('[data-sfx="off"]')) return null
  if (target.closest('canvas')) return null
  // Arcade tiles own their SFX — don't double-fire the UI click tick.
  if (target.closest('.memory-tile, .glow-cell, .dash-canvas')) return null
  return target.closest(
    'button, a, [role="button"], input[type="submit"], input[type="button"], .nav-dock button, .presets button, .deck-select button, .theme-card button',
  )
}

/**
 * Global UI clicks on pointerdown so audio lines up with the press.
 * Each distinct press gets a sound — no missed clicks.
 */
export function installClickSfx(): () => void {
  if (clickBound) return () => {}
  clickBound = true

  const unlockAny = () => unlockAudio()

  const onPointer = (e: Event) => {
    unlockAudio()
    const el = isClickable(e.target)
    if (!el) return
    if (el instanceof HTMLButtonElement && el.disabled) return

    const pe = e as PointerEvent
    const key = `${el}-${pe.pointerId ?? 0}-${Math.floor(performance.now())}`
    const now = performance.now()
    if (key === lastClickKey && now - lastClickAt < 8) return
    lastClickKey = key
    lastClickAt = now
    playClickSfx()
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.repeat) return
    unlockAudio()
    if (e.code !== 'Enter' && e.code !== 'Space') return
    const el = isClickable(document.activeElement)
    if (!el) return
    playClickSfx()
  }

  document.addEventListener('pointerdown', unlockAny, true)
  document.addEventListener('keydown', unlockAny, true)
  document.addEventListener('pointerdown', onPointer, true)
  document.addEventListener('keydown', onKey, true)

  return () => {
    document.removeEventListener('pointerdown', unlockAny, true)
    document.removeEventListener('keydown', unlockAny, true)
    document.removeEventListener('pointerdown', onPointer, true)
    document.removeEventListener('keydown', onKey, true)
    clickBound = false
  }
}
