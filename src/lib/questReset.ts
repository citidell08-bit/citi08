import { monthKey, todayKey, weekKey } from './dates'
import type { QuestPeriod } from '../types'

/** Calendar keys for when each board is valid. */
export type QuestPeriodKeys = Record<QuestPeriod, string>

export function freshQuestPeriodKeys(date = new Date()): QuestPeriodKeys {
  return {
    daily: todayKey(date),
    weekly: weekKey(date),
    monthly: monthKey(date),
  }
}

/** @deprecated Use freshQuestPeriodKeys — kept for older imports. */
export function freshQuestIssuedAt(date = new Date()): QuestPeriodKeys {
  return freshQuestPeriodKeys(date)
}

export type QuestIssuedAt = QuestPeriodKeys

export function currentKeyForPeriod(period: QuestPeriod, date = new Date()): string {
  if (period === 'weekly') return weekKey(date)
  if (period === 'monthly') return monthKey(date)
  return todayKey(date)
}

export function shouldResetQuestBoard(
  storedKey: string | undefined,
  period: QuestPeriod,
  date = new Date(),
): boolean {
  if (!storedKey || typeof storedKey !== 'string') return true
  return storedKey !== currentKeyForPeriod(period, date)
}

/** Local midnight of the next calendar day. */
export function nextDayStart(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0)
}

/** Next Monday 00:00 local (week starts Monday). */
export function nextWeekStart(date = new Date()): Date {
  const day = (date.getDay() + 6) % 7 // Mon=0
  const daysUntil = 7 - day
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + daysUntil, 0, 0, 0, 0)
}

/** 1st of next month 00:00 local. */
export function nextMonthStart(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0)
}

export function msUntilPeriodReset(period: QuestPeriod, now = Date.now()): number {
  const date = new Date(now)
  const target =
    period === 'weekly'
      ? nextWeekStart(date)
      : period === 'monthly'
        ? nextMonthStart(date)
        : nextDayStart(date)
  return Math.max(0, target.getTime() - now)
}

export function formatResetCountdown(ms: number): string {
  if (ms <= 0) return 'resetting…'
  const totalSec = Math.ceil(ms / 1000)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  return `${m}:${String(s).padStart(2, '0')}`
}

export const PERIOD_RESET_HINT: Record<QuestPeriod, string> = {
  daily: 'Resets every day at midnight',
  weekly: 'Resets every week (Monday)',
  monthly: 'Resets every month',
}
