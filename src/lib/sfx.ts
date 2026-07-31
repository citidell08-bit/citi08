/** Tiny Web Audio SFX — works offline, no asset files. */

let ctx: AudioContext | null = null
let clickBound = false
let lastClickAt = 0

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  return ctx
}

/** Call once from a user gesture so browsers allow sound. */
export function unlockAudio(): void {
  audio()
}

function tone(
  frequency: number,
  duration: number,
  opts?: { type?: OscillatorType; gain?: number; slideTo?: number; delay?: number },
) {
  const ac = audio()
  if (!ac) return
  const start = ac.currentTime + (opts?.delay ?? 0)
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = opts?.type ?? 'square'
  osc.frequency.setValueAtTime(frequency, start)
  if (opts?.slideTo != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, opts.slideTo), start + duration)
  }
  const peak = opts?.gain ?? 0.08
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

function noiseBurst(duration: number, opts?: { gain?: number; delay?: number; filterFreq?: number }) {
  const ac = audio()
  if (!ac) return
  const start = ac.currentTime + (opts?.delay ?? 0)
  const frames = Math.max(1, Math.floor(ac.sampleRate * duration))
  const buffer = ac.createBuffer(1, frames, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  src.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(opts?.filterFreq ?? 800, start)
  filter.frequency.exponentialRampToValueAtTime(120, start + duration)
  const gain = ac.createGain()
  const peak = opts?.gain ?? 0.06
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  src.connect(filter)
  filter.connect(gain)
  gain.connect(ac.destination)
  src.start(start)
  src.stop(start + duration + 0.02)
}

export function playClickSfx(): void {
  unlockAudio()
  tone(880, 0.04, { type: 'triangle', gain: 0.045, slideTo: 1200 })
  tone(1320, 0.03, { type: 'sine', gain: 0.02, delay: 0.01 })
}

export function playJumpSfx(): void {
  tone(520, 0.09, { type: 'square', gain: 0.09, slideTo: 880 })
  tone(780, 0.06, { type: 'triangle', gain: 0.04, slideTo: 1200, delay: 0.02 })
}

/** Crash thump + sad "whomp whomp" + access-denied sting. */
export function playCrashSfx(): void {
  playAccessDeniedSfx()
}

export function playAccessDeniedSfx(): void {
  unlockAudio()
  // Harsh deny buzz
  tone(220, 0.16, { type: 'sawtooth', gain: 0.1, slideTo: 90 })
  tone(140, 0.2, { type: 'square', gain: 0.07, slideTo: 55, delay: 0.04 })
  noiseBurst(0.18, { gain: 0.05, filterFreq: 600 })
  // Whomp whomp — two sad low drops
  tone(160, 0.22, { type: 'triangle', gain: 0.11, slideTo: 70, delay: 0.22 })
  tone(130, 0.28, { type: 'triangle', gain: 0.1, slideTo: 50, delay: 0.48 })
  // Flat "denied" blip
  tone(300, 0.08, { type: 'square', gain: 0.05, delay: 0.78 })
  tone(240, 0.14, { type: 'square', gain: 0.05, delay: 0.9 })
}

/** Sci-fi access granted / level-up fanfare. */
export function playAccessGrantedSfx(): void {
  unlockAudio()
  tone(440, 0.08, { type: 'square', gain: 0.06 })
  tone(554, 0.08, { type: 'square', gain: 0.06, delay: 0.08 })
  tone(659, 0.1, { type: 'triangle', gain: 0.07, delay: 0.16 })
  tone(880, 0.18, { type: 'triangle', gain: 0.085, delay: 0.28 })
  tone(1175, 0.22, { type: 'sine', gain: 0.06, delay: 0.42 })
  // Soft shimmer
  tone(1760, 0.12, { type: 'sine', gain: 0.03, delay: 0.55 })
}

export function playWinSfx(): void {
  playAccessGrantedSfx()
}

export function playRestartSfx(): void {
  tone(400, 0.05, { type: 'square', gain: 0.05, slideTo: 600 })
}

function isClickable(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  if (target.closest('[data-sfx="off"]')) return false
  if (target.closest('canvas')) return false
  return Boolean(
    target.closest(
      'button, a, [role="button"], input[type="submit"], input[type="button"], label, .nav-dock button, .memory-tile, .glow-cell, .theme-card button',
    ),
  )
}

/** Global UI click blips — call once from App. */
export function installClickSfx(): () => void {
  if (clickBound) return () => {}
  clickBound = true

  const onPointer = (e: Event) => {
    if (!isClickable(e.target)) return
    const now = performance.now()
    if (now - lastClickAt < 40) return
    lastClickAt = now
    playClickSfx()
  }

  document.addEventListener('pointerdown', onPointer, true)
  return () => {
    document.removeEventListener('pointerdown', onPointer, true)
    clickBound = false
  }
}
