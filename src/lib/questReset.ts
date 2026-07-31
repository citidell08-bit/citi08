import type { QuestPeriod } from '../types'

/** Auto-refresh window for every quest board (~1 hour). */
export const QUEST_RESET_MS = 60 * 60 * 1000

export type QuestIssuedAt = Record<QuestPeriod, number>

export function freshQuestIssuedAt(now = Date.now()): QuestIssuedAt {
  return { daily: now, weekly: now, monthly: now }
}

export function nextResetAt(issuedAt: number): number {
  return issuedAt + QUEST_RESET_MS
}

export function msUntilQuestReset(issuedAt: number, now = Date.now()): number {
  return Math.max(0, nextResetAt(issuedAt) - now)
}

export function shouldResetQuestBoard(issuedAt: number, now = Date.now()): boolean {
  return now - issuedAt >= QUEST_RESET_MS
}

export function formatResetCountdown(ms: number): string {
  if (ms <= 0) return 'resetting…'
  const totalSec = Math.ceil(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  return `${m}:${String(s).padStart(2, '0')}`
}
