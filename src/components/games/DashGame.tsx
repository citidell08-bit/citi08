import { useEffect, useRef, useState } from 'react'
import type { MiniGameResult } from '../../types'
import './DashGame.css'

interface Props {
  onFinish: (result: MiniGameResult) => void
  onBack: () => void
}

type ObstacleKind = 'spike' | 'block' | 'double'

interface Obstacle {
  x: number
  w: number
  h: number
  kind: ObstacleKind
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

const W = 900
const H = 360
const GROUND = 48
const PLAYER_SIZE = 30
const PLAYER_X = 110
const GRAVITY = 0.72
const JUMP_V = -12.2
const WIN_SCORE = 120

export function DashGame({ onFinish, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [score, setScore] = useState(0)
  const [alive, setAlive] = useState(true)
  const [finalScore, setFinalScore] = useState<number | null>(null)
  const reportedRef = useRef(false)
  const onFinishRef = useRef(onFinish)
  const lastScoreRef = useRef(0)
  onFinishRef.current = onFinish

  const stateRef = useRef({
    y: H - GROUND - PLAYER_SIZE,
    vy: 0,
    onGround: true,
    speed: 6.2,
    distance: 0,
    obstacles: [] as Obstacle[],
    spawnAt: 280,
    particles: [] as Particle[],
    dead: false,
    shake: 0,
    rot: 0,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const ctx: CanvasRenderingContext2D = context

    let raf = 0
    let last = performance.now()
    let active = true
    const st = stateRef.current
    lastScoreRef.current = 0

    function resetRun() {
      st.y = H - GROUND - PLAYER_SIZE
      st.vy = 0
      st.onGround = true
      st.speed = 6.2
      st.distance = 0
      st.obstacles = []
      st.spawnAt = 220
      st.particles = []
      st.dead = false
      st.shake = 0
      st.rot = 0
      reportedRef.current = false
      if (!active) return
      setAlive(true)
      setScore(0)
      setFinalScore(null)
      seedCourse()
    }

    function seedCourse() {
      let x = 420
      for (let i = 0; i < 8; i++) {
        st.obstacles.push(makeObstacle(x))
        x += 180 + Math.random() * 160
      }
      st.spawnAt = x
    }

    function makeObstacle(x: number): Obstacle {
      const roll = Math.random()
      if (roll < 0.45) {
        return { x, w: 28, h: 28, kind: 'spike' }
      }
      if (roll < 0.8) {
        const h = 34 + Math.floor(Math.random() * 28)
        return { x, w: 34, h, kind: 'block' }
      }
      return { x, w: 34, h: 52, kind: 'double' }
    }

    function jump() {
      if (st.dead) return
      if (st.onGround) {
        st.vy = JUMP_V
        st.onGround = false
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault()
        jump()
      }
    }

    function onPointer() {
      jump()
    }

    window.addEventListener('keydown', onKey)
    canvas.addEventListener('pointerdown', onPointer)

    function resolveHazards(prevY: number): boolean {
      const px = PLAYER_X + 3
      const py = st.y + 3
      const pw = PLAYER_SIZE - 6
      const ph = PLAYER_SIZE - 6
      let standing = st.y >= H - GROUND - PLAYER_SIZE - 0.5

      for (const o of st.obstacles) {
        const ox = o.x
        const top = H - GROUND - o.h

        if (o.kind === 'spike') {
          const sx = ox + 5
          const sy = top + 10
          const sw = o.w - 10
          const sh = o.h - 10
          if (aabb(px, py, pw, ph, sx, sy, sw, sh)) return true
          continue
        }

        if (!aabb(px, py, pw, ph, ox, top, o.w, o.h)) continue

        const prevBottom = prevY + PLAYER_SIZE
        const comingFromAbove = st.vy >= 0 && prevBottom <= top + 10

        if (comingFromAbove) {
          // Land on top of blocks (Geometry Dash style)
          st.y = top - PLAYER_SIZE
          st.vy = 0
          st.onGround = true
          st.rot = 0
          standing = true
          continue
        }

        // Side or underside hit = crash
        return true
      }

      if (!standing && st.y >= H - GROUND - PLAYER_SIZE - 0.5) {
        st.onGround = true
      }
      return false
    }

    function aabb(
      ax: number,
      ay: number,
      aw: number,
      ah: number,
      bx: number,
      by: number,
      bw: number,
      bh: number,
    ) {
      return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
    }

    function die() {
      if (st.dead) return
      st.dead = true
      st.shake = 10
      for (let i = 0; i < 18; i++) {
        st.particles.push({
          x: PLAYER_X + PLAYER_SIZE / 2,
          y: st.y + PLAYER_SIZE / 2,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.8) * 8,
          life: 1,
        })
      }
      const sc = Math.floor(st.distance / 10)
      if (active) {
        setAlive(false)
        setFinalScore(sc)
        setScore(sc)
      }
      if (!reportedRef.current) {
        reportedRef.current = true
        const xp = Math.max(8, Math.floor(sc / 3))
        onFinishRef.current({
          gameId: 'dash',
          won: sc >= WIN_SCORE,
          score: sc,
          xp,
          label: `Spike Dash · ${sc} pts`,
        })
      }
    }

    function draw(ctx: CanvasRenderingContext2D) {
      const shakeX = st.shake ? (Math.random() - 0.5) * st.shake : 0
      const shakeY = st.shake ? (Math.random() - 0.5) * st.shake : 0
      ctx.save()
      ctx.translate(shakeX, shakeY)

      // sky
      const grad = ctx.createLinearGradient(0, 0, 0, H)
      grad.addColorStop(0, '#020617')
      grad.addColorStop(1, '#0b1a33')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)

      // parallax grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)'
      ctx.lineWidth = 1
      const gridOff = (st.distance * 0.35) % 40
      for (let x = -gridOff; x < W; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H - GROUND)
        ctx.stroke()
      }

      // ground
      ctx.fillStyle = '#0f2748'
      ctx.fillRect(0, H - GROUND, W, GROUND)
      ctx.fillStyle = '#38bdf8'
      ctx.fillRect(0, H - GROUND, W, 3)

      // ground dashes
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)'
      const dashOff = st.distance % 50
      for (let x = -dashOff; x < W; x += 50) {
        ctx.fillRect(x, H - GROUND + 14, 26, 4)
      }

      // obstacles
      for (const o of st.obstacles) {
        const oy = H - GROUND - o.h
        if (o.kind === 'spike') {
          ctx.fillStyle = '#fb7185'
          ctx.beginPath()
          ctx.moveTo(o.x, H - GROUND)
          ctx.lineTo(o.x + o.w / 2, oy)
          ctx.lineTo(o.x + o.w, H - GROUND)
          ctx.closePath()
          ctx.fill()
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
          ctx.stroke()
        } else {
          ctx.fillStyle = o.kind === 'double' ? '#1d4ed8' : '#0369a1'
          roundRect(ctx, o.x, oy, o.w, o.h, 6)
          ctx.fill()
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)'
          ctx.stroke()
          // hazard stripe
          ctx.fillStyle = 'rgba(34, 211, 238, 0.65)'
          ctx.fillRect(o.x + 6, oy + 8, o.w - 12, 4)
        }
      }

      // player
      if (!st.dead) {
        ctx.save()
        ctx.translate(PLAYER_X + PLAYER_SIZE / 2, st.y + PLAYER_SIZE / 2)
        ctx.rotate(st.rot)
        ctx.fillStyle = '#38bdf8'
        roundRect(ctx, -PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE, 7)
        ctx.fill()
        ctx.strokeStyle = '#22d3ee'
        ctx.lineWidth = 2
        ctx.stroke()
        // eye
        ctx.fillStyle = '#020617'
        ctx.beginPath()
        ctx.arc(4, -2, 3.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // particles
      for (const p of st.particles) {
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = '#38bdf8'
        ctx.fillRect(p.x, p.y, 4, 4)
      }
      ctx.globalAlpha = 1

      // score HUD on canvas
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      roundRect(ctx, 16, 14, 150, 44, 12)
      ctx.fill()
      ctx.fillStyle = '#e8f2ed'
      ctx.font = '700 20px Syne, sans-serif'
      ctx.fillText(`SCORE ${Math.floor(st.distance / 10)}`, 28, 42)

      ctx.restore()
    }

    function tick(now: number) {
      const dt = Math.min(32, now - last) / 16.67
      last = now

      if (!st.dead) {
        const prevY = st.y
        st.vy += GRAVITY * dt
        st.y += st.vy * dt
        const floor = H - GROUND - PLAYER_SIZE
        if (st.y >= floor) {
          st.y = floor
          st.vy = 0
          st.onGround = true
          st.rot = 0
        } else {
          st.onGround = false
          st.rot += 0.18 * dt
        }

        st.speed = 6.2 + Math.min(7, st.distance / 900)
        const dx = st.speed * dt
        st.distance += dx

        for (const o of st.obstacles) o.x -= dx
        st.obstacles = st.obstacles.filter((o) => o.x + o.w > -40)
        st.spawnAt -= dx
        while (st.spawnAt < W + 80) {
          st.obstacles.push(makeObstacle(st.spawnAt + W * 0.15))
          st.spawnAt += 160 + Math.random() * (200 - Math.min(80, st.distance / 40))
        }

        if (resolveHazards(prevY)) die()
        const nextScore = Math.floor(st.distance / 10)
        if (active && nextScore !== lastScoreRef.current) {
          lastScoreRef.current = nextScore
          setScore(nextScore)
        }
      } else if (st.shake > 0) {
        st.shake *= 0.9
        if (st.shake < 0.4) st.shake = 0
      }

      for (const p of st.particles) {
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vy += 0.25 * dt
        p.life -= 0.03 * dt
      }
      st.particles = st.particles.filter((p) => p.life > 0)

      draw(ctx)
      raf = requestAnimationFrame(tick)
    }

    resetRun()
    raf = requestAnimationFrame(tick)

    return () => {
      active = false
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
      canvas.removeEventListener('pointerdown', onPointer)
    }
  }, [])

  return (
    <div className="mini-game play-stage dash-game">
      <div className="mini-top">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Arcade
        </button>
        <div className="mini-stats">
          <span className="score-pill">Score {score}</span>
          <span>Best run goal {WIN_SCORE}</span>
          <span>{alive ? 'Alive' : 'Crashed'}</span>
        </div>
      </div>

      <div className="play-header">
        <div>
          <h2 className="section-title">Spike Dash</h2>
          <p className="section-sub">
            Tap / click / Space to jump. Clear spikes and blocks — don&apos;t crash.
          </p>
        </div>
        <div className="dash-score-badge" aria-live="polite">
          <strong>{score}</strong>
          <span>Score</span>
        </div>
      </div>

      <div className="panel play-board dash-board">
        <canvas
          ref={canvasRef}
          className="dash-canvas"
          width={W}
          height={H}
          role="img"
          aria-label="Spike Dash playfield. Tap or press Space to jump."
        />
        <p className="play-hint">Controls: Space / ↑ / tap anywhere on the track</p>

        {finalScore != null && (
          <div className="mini-end overlay-end">
            <p>
              Final score <strong>{finalScore}</strong>
              {finalScore >= WIN_SCORE ? ' — run cleared!' : '. Jump earlier next time.'}
            </p>
            <button type="button" className="btn btn-primary" onClick={onBack}>
              Back to arcade
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}
