import { useEffect, useRef, useState } from 'react'
import { isJumpKey, isRestartKey } from '../../lib/gameInput'
import {
  playCoinSfx,
  playCrashSfx,
  playJumpSfx,
  playRestartSfx,
  playWinSfx,
  unlockAudio,
} from '../../lib/sfx'
import type { MiniGameResult } from '../../types'
import { PlayAgainCard } from './PlayAgainCard'
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

interface CoinPickup {
  x: number
  y: number
  r: number
  value: number
}

const W = 900
const H = 360
const GROUND = 48
const PLAYER_SIZE = 28
const PLAYER_X = 110
/** Snappy Geometry Dash–style arc: peak ~52px — clears spikes & short blocks. */
const GRAVITY = 0.86
const JUMP_V = -9.45
const WIN_SCORE = 120
/** Remember jump presses briefly so clicks feel instant even mid-air. */
const JUMP_BUFFER_MS = 140
/** Allow a jump for a short time after leaving a surface. */
const COYOTE_MS = 90
const SCORE_UI_MS = 80

export function DashGame({ onFinish, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const boardRef = useRef<HTMLDivElement | null>(null)
  const [score, setScore] = useState(0)
  const [coinsGrabbed, setCoinsGrabbed] = useState(0)
  const [alive, setAlive] = useState(true)
  const [finalScore, setFinalScore] = useState<number | null>(null)
  const reportedRef = useRef(false)
  const onFinishRef = useRef(onFinish)
  const lastScoreRef = useRef(0)
  const lastScoreUiRef = useRef(0)
  const restartRef = useRef<() => void>(() => {})
  onFinishRef.current = onFinish

  const stateRef = useRef({
    y: H - GROUND - PLAYER_SIZE,
    vy: 0,
    onGround: true,
    groundedUntil: 0,
    jumpBufferedUntil: 0,
    speed: 5.8,
    distance: 0,
    obstacles: [] as Obstacle[],
    coins: [] as CoinPickup[],
    coinSpawnAt: 520,
    coinsCollected: 0,
    spawnAt: 280,
    particles: [] as Particle[],
    dead: false,
    shake: 0,
    rot: 0,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const board = boardRef.current
    if (!canvas) return
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) return
    const ctx: CanvasRenderingContext2D = context

    let raf = 0
    let last = performance.now()
    let active = true
    const st = stateRef.current
    lastScoreRef.current = 0
    lastScoreUiRef.current = 0

    function resetRun() {
      st.y = H - GROUND - PLAYER_SIZE
      st.vy = 0
      st.onGround = true
      st.groundedUntil = 0
      st.jumpBufferedUntil = 0
      st.speed = 5.8
      st.distance = 0
      st.obstacles = []
      st.coins = []
      st.coinSpawnAt = 480
      st.coinsCollected = 0
      st.spawnAt = 220
      st.particles = []
      st.dead = false
      st.shake = 0
      st.rot = 0
      reportedRef.current = false
      lastScoreRef.current = 0
      lastScoreUiRef.current = 0
      if (!active) return
      setAlive(true)
      setScore(0)
      setCoinsGrabbed(0)
      setFinalScore(null)
      seedCourse()
    }

    function seedCourse() {
      let x = 400
      for (let i = 0; i < 8; i++) {
        st.obstacles.push(makeObstacle(x))
        if (Math.random() < 0.4) {
          st.coins.push(makeCoin(x + 70 + Math.random() * 40))
        }
        x += 175 + Math.random() * 140
      }
      st.spawnAt = x
      st.coinSpawnAt = x + 80
    }

    function makeCoin(x: number): CoinPickup {
      // Hover at jumpable height — sometimes higher for a skill hop
      const lift = 36 + Math.floor(Math.random() * 50)
      return {
        x,
        y: H - GROUND - lift,
        r: 11,
        value: Math.random() < 0.2 ? 3 : 1,
      }
    }

    function makeObstacle(x: number): Obstacle {
      const roll = Math.random()
      if (roll < 0.42) {
        return { x, w: 26, h: 26, kind: 'spike' }
      }
      if (roll < 0.72) {
        const h = 28 + Math.floor(Math.random() * 10)
        return { x, w: 30, h, kind: 'block' }
      }
      if (roll < 0.9) {
        // Tall enough to demand a clean hop / land-on-top, not a coin-flip clear.
        return { x, w: 36, h: 42, kind: 'block' }
      }
      return { x, w: 44, h: 26, kind: 'double' }
    }

    function tryJump(now = performance.now()) {
      if (st.dead) return false
      const canCoyote = now <= st.groundedUntil
      if (st.onGround || canCoyote) {
        st.vy = JUMP_V
        st.onGround = false
        st.groundedUntil = 0
        st.jumpBufferedUntil = 0
        playJumpSfx()
        return true
      }
      // Buffer the press so landing a few ms later still jumps instantly
      st.jumpBufferedUntil = now + JUMP_BUFFER_MS
      return false
    }

    function restartOrJump() {
      unlockAudio()
      if (st.dead) {
        playRestartSfx()
        resetRun()
        return
      }
      tryJump()
    }

    restartRef.current = () => {
      if (!active) return
      resetRun()
    }

    function onKey(e: KeyboardEvent) {
      if (e.repeat) return
      if (st.dead && isRestartKey(e.code)) {
        e.preventDefault()
        restartOrJump()
        return
      }
      if (!isJumpKey(e.code)) return
      e.preventDefault()
      restartOrJump()
    }

    function onPointer(e: Event) {
      // Instant response — don't wait for click synthesis
      if ('button' in e && (e as PointerEvent).button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      restartOrJump()
    }

    function onBoardPointer(e: Event) {
      const target = e.target as HTMLElement | null
      if (!target || !canvas) return
      if (target.closest('button')) return
      if (target === canvas || canvas.contains(target)) return
      onPointer(e)
    }

    window.addEventListener('keydown', onKey)
    // pointerdown alone covers mouse + touch (avoid double-firing with mousedown)
    canvas.addEventListener('pointerdown', onPointer, { passive: false })
    board?.addEventListener('pointerdown', onBoardPointer, { passive: false })

    function resolveHazards(prevY: number, now: number): boolean {
      const px = PLAYER_X + 3
      const py = st.y + 3
      const pw = PLAYER_SIZE - 6
      const ph = PLAYER_SIZE - 6
      let standing = st.y >= H - GROUND - PLAYER_SIZE - 0.5

      for (const o of st.obstacles) {
        const ox = o.x
        const top = H - GROUND - o.h

        if (o.kind === 'spike' || o.kind === 'double') {
          const sx = ox + 4
          const sy = top + 8
          const sw = o.w - 8
          const sh = o.h - 8
          if (aabb(px, py, pw, ph, sx, sy, sw, sh)) return true
          continue
        }

        if (!aabb(px, py, pw, ph, ox, top, o.w, o.h)) continue

        const prevBottom = prevY + PLAYER_SIZE
        const comingFromAbove = st.vy >= 0 && prevBottom <= top + 12

        if (comingFromAbove) {
          st.y = top - PLAYER_SIZE
          st.vy = 0
          st.onGround = true
          st.groundedUntil = now + COYOTE_MS
          st.rot = 0
          standing = true
          continue
        }

        return true
      }

      if (!standing && st.y >= H - GROUND - PLAYER_SIZE - 0.5) {
        st.onGround = true
        st.groundedUntil = now + COYOTE_MS
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
      st.jumpBufferedUntil = 0
      playCrashSfx()
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
        const won = sc >= WIN_SCORE
        if (won) playWinSfx()
        const xp = Math.max(8, Math.floor(sc / 3))
        onFinishRef.current({
          gameId: 'dash',
          won,
          score: sc,
          xp,
          coinsEarned: st.coinsCollected,
          label:
            st.coinsCollected > 0
              ? `Spike Dash · ${sc} pts · ${st.coinsCollected}◉`
              : `Spike Dash · ${sc} pts`,
        })
      }
    }

    function coinBob(c: CoinPickup) {
      return Math.sin(st.distance * 0.08 + c.x * 0.05) * 3
    }

    function collectCoins() {
      const px = PLAYER_X + 3
      const py = st.y + 3
      const pw = PLAYER_SIZE - 6
      const ph = PLAYER_SIZE - 6
      let gained = 0
      st.coins = st.coins.filter((c) => {
        const cy = c.y + coinBob(c)
        const hit = aabb(px, py, pw, ph, c.x - c.r, cy - c.r, c.r * 2, c.r * 2)
        if (!hit) return true
        gained += c.value
        return false
      })
      if (gained > 0) {
        st.coinsCollected += gained
        playCoinSfx()
        if (active) setCoinsGrabbed(st.coinsCollected)
      }
    }

    function draw() {
      const shakeX = st.shake ? (Math.random() - 0.5) * st.shake : 0
      const shakeY = st.shake ? (Math.random() - 0.5) * st.shake : 0
      ctx.save()
      ctx.translate(shakeX, shakeY)

      const grad = ctx.createLinearGradient(0, 0, 0, H)
      grad.addColorStop(0, '#020617')
      grad.addColorStop(1, '#0b1a33')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)'
      ctx.lineWidth = 1
      const gridOff = (st.distance * 0.35) % 40
      for (let x = -gridOff; x < W; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H - GROUND)
        ctx.stroke()
      }

      ctx.fillStyle = '#0f2748'
      ctx.fillRect(0, H - GROUND, W, GROUND)
      ctx.fillStyle = '#38bdf8'
      ctx.fillRect(0, H - GROUND, W, 3)

      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)'
      const dashOff = st.distance % 50
      for (let x = -dashOff; x < W; x += 50) {
        ctx.fillRect(x, H - GROUND + 14, 26, 4)
      }

      // Floating coins
      for (const c of st.coins) {
        const cy = c.y + coinBob(c)
        ctx.beginPath()
        ctx.fillStyle = '#fbbf24'
        ctx.arc(c.x, cy, c.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.fillStyle = '#78350f'
        ctx.font = '700 11px Syne, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(c.value > 1 ? String(c.value) : '◉', c.x, cy + 0.5)
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
      }

      for (const o of st.obstacles) {
        const oy = H - GROUND - o.h
        if (o.kind === 'spike' || o.kind === 'double') {
          ctx.fillStyle = '#fb7185'
          if (o.kind === 'double') {
            const half = o.w / 2
            for (const offset of [0, half]) {
              ctx.beginPath()
              ctx.moveTo(o.x + offset, H - GROUND)
              ctx.lineTo(o.x + offset + half / 2, oy)
              ctx.lineTo(o.x + offset + half, H - GROUND)
              ctx.closePath()
              ctx.fill()
            }
          } else {
            ctx.beginPath()
            ctx.moveTo(o.x, H - GROUND)
            ctx.lineTo(o.x + o.w / 2, oy)
            ctx.lineTo(o.x + o.w, H - GROUND)
            ctx.closePath()
            ctx.fill()
          }
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
          ctx.stroke()
        } else {
          ctx.fillStyle = '#0369a1'
          roundRect(ctx, o.x, oy, o.w, o.h, 6)
          ctx.fill()
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)'
          ctx.stroke()
          ctx.fillStyle = 'rgba(34, 211, 238, 0.65)'
          ctx.fillRect(o.x + 6, oy + 8, o.w - 12, 4)
        }
      }

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
        ctx.fillStyle = '#020617'
        ctx.beginPath()
        ctx.arc(4, -2, 3.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      for (const p of st.particles) {
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = '#38bdf8'
        ctx.fillRect(p.x, p.y, 4, 4)
      }
      ctx.globalAlpha = 1

      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      roundRect(ctx, 16, 14, 210, 44, 12)
      ctx.fill()
      ctx.fillStyle = '#e8f2ed'
      ctx.font = '700 20px Syne, sans-serif'
      ctx.fillText(`SCORE ${Math.floor(st.distance / 10)}`, 28, 42)
      ctx.fillStyle = '#fbbf24'
      ctx.font = '700 16px Syne, sans-serif'
      ctx.fillText(`◉ ${st.coinsCollected}`, 150, 42)

      ctx.restore()
    }

    function tick(now: number) {
      const dt = Math.min(32, now - last) / 16.67
      last = now

      if (!st.dead) {
        const wasGrounded = st.onGround
        const prevY = st.y
        st.vy += GRAVITY * dt
        st.y += st.vy * dt
        const floor = H - GROUND - PLAYER_SIZE
        if (st.y >= floor) {
          st.y = floor
          st.vy = 0
          st.onGround = true
          st.groundedUntil = now + COYOTE_MS
          st.rot = 0
        } else if (wasGrounded && st.vy > 0) {
          st.onGround = false
          // keep coyote window from last groundedUntil
        } else if (!st.onGround) {
          st.rot += 0.18 * dt
        }

        if (st.jumpBufferedUntil > now && (st.onGround || now <= st.groundedUntil)) {
          // Buffered jump — SFX plays inside tryJump when it actually fires
          tryJump(now)
        }

        st.speed = 5.8 + Math.min(5.5, st.distance / 1000)
        const dx = st.speed * dt
        st.distance += dx

        for (const o of st.obstacles) o.x -= dx
        for (const c of st.coins) c.x -= dx
        st.obstacles = st.obstacles.filter((o) => o.x + o.w > -40)
        st.coins = st.coins.filter((c) => c.x + c.r > -20)
        st.spawnAt -= dx
        st.coinSpawnAt -= dx
        while (st.spawnAt < W + 80) {
          const ox = st.spawnAt + W * 0.15
          st.obstacles.push(makeObstacle(ox))
          st.spawnAt += 170 + Math.random() * (190 - Math.min(60, st.distance / 50))
        }
        while (st.coinSpawnAt < W + 80) {
          if (Math.random() < 0.45) {
            st.coins.push(makeCoin(st.coinSpawnAt + W * 0.2))
          }
          st.coinSpawnAt += 140 + Math.random() * 160
        }

        collectCoins()
        if (resolveHazards(prevY, now)) die()

        const nextScore = Math.floor(st.distance / 10)
        if (
          active &&
          nextScore !== lastScoreRef.current &&
          now - lastScoreUiRef.current >= SCORE_UI_MS
        ) {
          lastScoreRef.current = nextScore
          lastScoreUiRef.current = now
          setScore(nextScore)
        } else if (nextScore !== lastScoreRef.current) {
          lastScoreRef.current = nextScore
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

      draw()
      raf = requestAnimationFrame(tick)
    }

    resetRun()
    raf = requestAnimationFrame(tick)

    return () => {
      active = false
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
      canvas.removeEventListener('pointerdown', onPointer)
      board?.removeEventListener('pointerdown', onBoardPointer)
    }
  }, [])

  return (
    <div className="mini-game play-stage dash-game">
      <div className="mini-top">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Arcade
        </button>
        <div className="mini-stats">
          <span className="score-pill">◉ {coinsGrabbed}</span>
          <span>Clear {WIN_SCORE}</span>
          <span>{alive ? 'Running' : 'Crashed'}</span>
        </div>
      </div>

      <div className="play-header">
        <div>
          <h2 className="section-title">Spike Dash</h2>
          <p className="section-sub">
            Jump spikes, land on blocks, grab coins. Click / Space to hop — again after a crash.
          </p>
        </div>
        <div className="hud-row">
          <div className="score-badge" aria-live="polite">
            <strong>{score}</strong>
            <span>Score</span>
          </div>
          <div className="score-badge coin-grab-badge" aria-live="polite">
            <strong>{coinsGrabbed}</strong>
            <span>Coins</span>
          </div>
        </div>
      </div>

      <div className="panel play-board dash-board" ref={boardRef}>
        <canvas
          ref={canvasRef}
          className="dash-canvas"
          width={W}
          height={H}
          role="img"
          aria-label="Spike Dash playfield. Tap or press Space to jump. Tap again after a crash to restart."
        />
        <p className="play-hint">
          {alive
            ? 'Click · Space · ↑ · W · Enter · Z'
            : 'Click the track · Space / Enter / R — play again'}
        </p>

        {finalScore != null && !alive && (
          <PlayAgainCard
            summary={
              <>
                {finalScore >= WIN_SCORE ? 'Run cleared' : 'Crashed'} —{' '}
                <strong>{finalScore}</strong> pts
                {coinsGrabbed > 0 ? (
                  <>
                    {' '}
                    · <strong>{coinsGrabbed}◉</strong>
                  </>
                ) : null}
              </>
            }
            onAgain={() => {
              playRestartSfx()
              restartRef.current()
            }}
            onBack={onBack}
          />
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
