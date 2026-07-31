/** Soft curve: level 1 at 0 XP, then rising gently. */
export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 40)) + 1
}

export function xpForLevel(level: number): number {
  const l = Math.max(1, level)
  return (l - 1) * (l - 1) * 40
}

export function progressToNextLevel(xp: number): {
  level: number
  current: number
  needed: number
  ratio: number
} {
  const level = levelFromXp(xp)
  const start = xpForLevel(level)
  const next = xpForLevel(level + 1)
  const current = xp - start
  const needed = next - start
  return { level, current, needed, ratio: needed === 0 ? 1 : current / needed }
}

export function companionStage(level: number): 1 | 2 | 3 | 4 {
  if (level >= 12) return 4
  if (level >= 7) return 3
  if (level >= 3) return 2
  return 1
}

export const STAGE_LABELS = {
  1: 'Hatchling',
  2: 'Nestling',
  3: 'Scholar',
  4: 'Sage',
} as const
