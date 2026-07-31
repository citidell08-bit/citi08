import { useEffect, useRef } from 'react'
import './NeonVoidBackdrop.css'

/** Deterministic hash → [0, 1) */
function hash2(x: number, y: number): number {
  let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return n - Math.floor(n)
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

function valueNoise(x: number, y: number): number {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = smoothstep(x - x0)
  const fy = smoothstep(y - y0)
  const a = hash2(x0, y0)
  const b = hash2(x0 + 1, y0)
  const c = hash2(x0, y0 + 1)
  const d = hash2(x0 + 1, y0 + 1)
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}

/** Fractal Brownian motion */
function fbm(x: number, y: number, octaves = 4): number {
  let v = 0
  let amp = 0.5
  let freq = 1
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    v += amp * valueNoise(x * freq, y * freq)
    norm += amp
    amp *= 0.5
    freq *= 2.03
  }
  return v / norm
}

/** Domain-warped fBm for filament / pillar shapes */
function warpedFbm(x: number, y: number): number {
  const wx = fbm(x + 2.1, y + 1.3, 3)
  const wy = fbm(x + 5.7, y + 3.9, 3)
  return fbm(x + 1.55 * wx, y + 1.55 * wy, 4)
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

interface Star {
  x: number
  y: number
  r: number
  bright: number
  tint: [number, number, number]
}

function paintNebula(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stars: Star[],
): void {
  const img = ctx.createImageData(w, h)
  const data = img.data
  const aspect = w / h

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = (x / w) * aspect * 3.2
      const v = (y / h) * 3.2

      // Large-scale structure + warped wisps (one warp pass keeps it organic + fast)
      const structure = warpedFbm(u * 0.55, v * 0.55)
      const wisps = fbm(u * 1.2 + 8 + structure * 0.8, v * 1.2 - 3 + structure * 0.6, 3)
      const fine = fbm(u * 2.2 + 20, v * 2.2 + 11, 2)

      // Emission density (pillars / clouds)
      let density = structure * 0.7 + wisps * 0.42 + fine * 0.16
      density = clamp01((density - 0.28) * 1.9)

      // Dark molecular-cloud lanes
      const dust = fbm(u * 0.85 - 4, v * 0.85 + 6, 3)
      const lane = clamp01((dust - 0.52) * 3.2)

      // Spatial color bias — magenta core, cyan rim, violet deep field
      const cx = x / w - 0.38
      const cy = y / h - 0.42
      const d1 = Math.sqrt(cx * cx + cy * cy)
      const cx2 = x / w - 0.78
      const cy2 = y / h - 0.22
      const d2 = Math.sqrt(cx2 * cx2 + cy2 * cy2)
      const cx3 = x / w - 0.62
      const cy3 = y / h - 0.78
      const d3 = Math.sqrt(cx3 * cx3 + cy3 * cy3)

      // Hubble-ish palette: Hα magenta/pink, OIII teal, deep purple
      let r = 8 + density * (95 + (1 - clamp01(d1 * 1.6)) * 140)
      let g = 4 + density * (35 + (1 - clamp01(d2 * 1.8)) * 110)
      let b = 18 + density * (90 + (1 - clamp01(d3 * 1.5)) * 130)

      // Cyan oxygen bloom
      const oiii = clamp01(1 - d2 * 2.1) * density
      r += oiii * 20
      g += oiii * 160
      b += oiii * 190

      // Hot pink hydrogen bloom
      const ha = clamp01(1 - d1 * 2.0) * density
      r += ha * 180
      g += ha * 55
      b += ha * 120

      // Warm amber knot (dust illuminated)
      const amber = clamp01(1 - d3 * 2.4) * density * 0.55
      r += amber * 120
      g += amber * 70
      b += amber * 20

      // Deep void base
      r = r * 0.55 + 2
      g = g * 0.5 + 1
      b = b * 0.7 + 8

      // Carve dust lanes
      const dustMul = 1 - lane * 0.78
      r *= dustMul
      g *= dustMul * 0.95
      b *= dustMul * 0.9

      // Soft vignette toward true black space
      const vx = (x / w - 0.5) * 1.15
      const vy = (y / h - 0.5) * 1.15
      const vig = clamp01(1 - Math.sqrt(vx * vx + vy * vy) * 0.85)
      const space = 0.22 + vig * 0.78
      r *= space
      g *= space
      b *= space

      const i = (y * w + x) * 4
      data[i] = Math.min(255, r)
      data[i + 1] = Math.min(255, g)
      data[i + 2] = Math.min(255, b)
      data[i + 3] = 255
    }
  }

  ctx.putImageData(img, 0, 0)

  // Soft emission bloom (photographic glow)
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  const blooms: Array<[number, number, number, string]> = [
    [0.28, 0.36, 0.42, 'rgba(236, 72, 153, 0.38)'],
    [0.76, 0.2, 0.34, 'rgba(34, 211, 238, 0.34)'],
    [0.58, 0.72, 0.4, 'rgba(139, 92, 246, 0.32)'],
    [0.48, 0.48, 0.22, 'rgba(251, 113, 133, 0.18)'],
  ]
  for (const [px, py, rad, color] of blooms) {
    const grd = ctx.createRadialGradient(
      px * w,
      py * h,
      0,
      px * w,
      py * h,
      rad * Math.max(w, h),
    )
    grd.addColorStop(0, color)
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, w, h)
  }
  ctx.restore()

  // Stars
  ctx.save()
  for (const s of stars) {
    const sx = s.x * w
    const sy = s.y * h
    const [tr, tg, tb] = s.tint
    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.r * 6)
    glow.addColorStop(0, `rgba(${tr},${tg},${tb},${0.55 * s.bright})`)
    glow.addColorStop(0.35, `rgba(${tr},${tg},${tb},${0.18 * s.bright})`)
    glow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(sx, sy, s.r * 6, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = `rgba(${tr},${tg},${tb},${0.85 + 0.15 * s.bright})`
    ctx.beginPath()
    ctx.arc(sx, sy, s.r, 0, Math.PI * 2)
    ctx.fill()

    // Subtle diffraction spikes on bright stars
    if (s.bright > 0.75 && s.r > 1.1) {
      ctx.strokeStyle = `rgba(${tr},${tg},${tb},${0.35 * s.bright})`
      ctx.lineWidth = 0.6
      const spike = s.r * 9
      ctx.beginPath()
      ctx.moveTo(sx - spike, sy)
      ctx.lineTo(sx + spike, sy)
      ctx.moveTo(sx, sy - spike)
      ctx.lineTo(sx, sy + spike)
      ctx.stroke()
    }
  }
  ctx.restore()
}

function makeStars(count: number, seed = 1): Star[] {
  const stars: Star[] = []
  let s = seed
  const rnd = () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
  for (let i = 0; i < count; i++) {
    const roll = rnd()
    const bright = roll > 0.92 ? 0.85 + rnd() * 0.15 : 0.25 + rnd() * 0.55
    const r = bright > 0.8 ? 1.2 + rnd() * 1.6 : 0.35 + rnd() * 0.9
    const tintRoll = rnd()
    const tint: [number, number, number] =
      tintRoll < 0.55
        ? [255, 255, 255]
        : tintRoll < 0.75
          ? [186, 230, 253]
          : tintRoll < 0.9
            ? [253, 224, 255]
            : [255, 237, 200]
    stars.push({ x: rnd(), y: rnd(), r, bright, tint })
  }
  return stars
}

export function NeonVoidBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[] | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    if (!starsRef.current) {
      starsRef.current = makeStars(420, 42)
    }

    let frame = 0
    let idle: number | ReturnType<typeof setTimeout> | undefined
    const render = () => {
      // Soft upscale looks photographic; keep pixel work light
      const cssW = window.innerWidth
      const cssH = window.innerHeight
      const longEdge = Math.max(cssW, cssH)
      const target = longEdge < 700 ? 420 : 560
      const scale = Math.min(1, target / longEdge)
      const w = Math.max(280, Math.floor(cssW * scale))
      const h = Math.max(200, Math.floor(cssH * scale))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      paintNebula(ctx, w, h, starsRef.current!)
    }

    const schedule = () => {
      cancelAnimationFrame(frame)
      if (typeof idle === 'number') window.clearTimeout(idle)
      // Defer so equip/theme switch stays snappy
      idle = window.setTimeout(() => {
        frame = requestAnimationFrame(render)
      }, 16)
    }

    schedule()
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(frame)
      if (typeof idle === 'number') window.clearTimeout(idle)
    }
  }, [])

  return (
    <div className="neon-void-backdrop" aria-hidden="true">
      <canvas ref={canvasRef} className="neon-void-canvas" />
      <div className="neon-void-dust" />
      <div className="neon-void-stars" />
      <div className="neon-void-vignette" />
    </div>
  )
}
