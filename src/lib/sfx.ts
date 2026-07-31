/** Tiny Web Audio SFX — works offline, no asset files. */

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
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

export function playJumpSfx(): void {
  tone(520, 0.09, { type: 'square', gain: 0.09, slideTo: 880 })
  tone(780, 0.06, { type: 'triangle', gain: 0.04, slideTo: 1200, delay: 0.02 })
}

export function playCrashSfx(): void {
  tone(180, 0.22, { type: 'sawtooth', gain: 0.1, slideTo: 60 })
  tone(90, 0.28, { type: 'square', gain: 0.06, slideTo: 40, delay: 0.02 })
}

export function playWinSfx(): void {
  tone(523, 0.1, { type: 'triangle', gain: 0.07 })
  tone(659, 0.1, { type: 'triangle', gain: 0.07, delay: 0.09 })
  tone(784, 0.16, { type: 'triangle', gain: 0.08, delay: 0.18 })
}

export function playRestartSfx(): void {
  tone(400, 0.05, { type: 'square', gain: 0.05, slideTo: 600 })
}
