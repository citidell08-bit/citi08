import type { MiniGameId } from '../types'

/** Coins awarded for each level gained. */
export const COINS_PER_LEVEL = 25

/** Coins awarded when unlocking an achievement. */
export const COINS_PER_ACHIEVEMENT = 10

/** One-time purchase price to unlock each mini-game forever. */
export const GAME_COSTS: Record<MiniGameId, number> = {
  memory: 15,
  math: 10,
  glow: 10,
  dash: 15,
}

export function coinsForLevelsGained(fromLevel: number, toLevel: number): number {
  const gained = Math.max(0, toLevel - fromLevel)
  return gained * COINS_PER_LEVEL
}
