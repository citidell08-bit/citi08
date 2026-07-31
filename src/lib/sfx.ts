/**
 * Cyber Kith SFX — offline Web Audio, zero asset files.
 * Clicks fire on pointerdown so sound matches the press, not the release.
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null
let clickBound = false
let lastClickKey = ''
let lastClickAt = 0

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!ctx) {
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.85
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function bus(): GainNode | null {
  const ac = getCtx()
  if (!ac || !master) return null
  return master
}

/** Unlock / resume audio from any user gesture. */
export function unlockAudio(): void {
  getCtx()
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
  const ac = getCtx()
  const out = bus()
  if (!ac || !out) return

  const start = ac.currentTime + (opts?.delay ?? 0)
  const attack = opts?.attack ?? 0.004
  const peak = opts?.gain ?? 0.08
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

  // Linear ramps — reliable for very short UI clicks (exp ramps from ~0 can glitch)
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
  opts?: { gain?: number; delay?: number; filterFreq?: number },
) {
  const ac = getCtx()
  const out = bus()
  if (!ac || !out) return

  const start = ac.currentTime + (opts?.delay ?? 0)
  const frames = Math.max(1, Math.floor(ac.sampleRate * duration))
  const buffer = ac.createBuffer(1, frames, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) {
    // Soft noise envelope in the buffer itself
    const env = 1 - i / frames
    data[i] = (Math.random() * 2 - 1) * env
  }

  const src = ac.createBufferSource()
  src.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(opts?.filterFreq ?? 900, start)
  filter.frequency.linearRampToValueAtTime(140, start + duration)
  const gain = ac.createGain()
  const peak = opts?.gain ?? 0.05
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.linearRampToValueAtTime(peak, start + 0.008)
  gain.gain.linearRampToValueAtTime(0.0001, start + duration)

  src.connect(filter)
  filter.connect(gain)
  gain.connect(out)
  src.start(start)
  src.stop(start + duration + 0.02)
}

/** Sharp UI click — one press, one tick. */
export function playClickSfx(): void {
  unlockAudio()
  // Transient tick (matches finger/mouse down)
  tone(2400, 0.018, { type: 'sine', gain: 0.055, attack: 0.001, slideTo: 1800 })
  tone(1100, 0.028, { type: 'triangle', gain: 0.035, attack: 0.002, slideTo: 700 })
}

export function playJumpSfx(): void {
  unlockAudio()
  tone(480, 0.08, { type: 'square', gain: 0.085, attack: 0.003, slideTo: 920 })
  tone(760, 0.055, { type: 'triangle', gain: 0.04, delay: 0.015, slideTo: 1180 })
}

export function playCrashSfx(): void {
  playAccessDeniedSfx()
}

/** Access denied + sad whomp-whomp. */
export function playAccessDeniedSfx(): void {
  unlockAudio()
  tone(210, 0.14, { type: 'sawtooth', gain: 0.095, slideTo: 85 })
  tone(130, 0.18, { type: 'square', gain: 0.06, slideTo: 50, delay: 0.03 })
  noiseBurst(0.16, { gain: 0.045, filterFreq: 550 })
  // Whomp… whomp…
  tone(155, 0.24, { type: 'triangle', gain: 0.12, slideTo: 68, delay: 0.2 })
  tone(125, 0.3, { type: 'triangle', gain: 0.11, slideTo: 48, delay: 0.46 })
  tone(290, 0.07, { type: 'square', gain: 0.045, delay: 0.76 })
  tone(230, 0.12, { type: 'square', gain: 0.045, delay: 0.88 })
}

/** Access granted / level-up fanfare. */
export function playAccessGrantedSfx(): void {
  unlockAudio()
  tone(440, 0.07, { type: 'square', gain: 0.055 })
  tone(554, 0.07, { type: 'square', gain: 0.055, delay: 0.07 })
  tone(659, 0.09, { type: 'triangle', gain: 0.065, delay: 0.14 })
  tone(880, 0.16, { type: 'triangle', gain: 0.08, delay: 0.25 })
  tone(1175, 0.2, { type: 'sine', gain: 0.055, delay: 0.38 })
  tone(1760, 0.12, { type: 'sine', gain: 0.028, delay: 0.5 })
}

export function playWinSfx(): void {
  playAccessGrantedSfx()
}

export function playRestartSfx(): void {
  unlockAudio()
  tone(420, 0.045, { type: 'square', gain: 0.05, slideTo: 640 })
}

function isClickable(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null
  if (target.closest('[data-sfx="off"]')) return null
  if (target.closest('canvas')) return null
  return target.closest(
    'button, a, [role="button"], input[type="submit"], input[type="button"], .nav-dock button, .memory-tile, .glow-cell, .presets button, .deck-select button, .theme-card button',
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

    // Allow rapid clicks; only collapse true duplicate events in the same ms
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
    if (e.code !== 'Enter' && e.code !== 'Space') return
    const el = isClickable(document.activeElement)
    if (!el) return
    playClickSfx()
  }

  document.addEventListener('pointerdown', unlockAny, true)
  document.addEventListener('pointerdown', onPointer, true)
  document.addEventListener('keydown', onKey, true)

  return () => {
    document.removeEventListener('pointerdown', unlockAny, true)
    document.removeEventListener('pointerdown', onPointer, true)
    document.removeEventListener('keydown', onKey, true)
    clickBound = false
  }
}
