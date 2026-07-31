import { DEFAULT_ACHIEVEMENTS } from '../data/achievements'
import {
  generateAllQuests,
  generateDailyQuests,
  generateMonthlyQuests,
  generateWeeklyQuests,
} from '../data/quests'
import { FREE_THEME, VALID_THEMES } from '../data/themes'
import { SAMPLE_DECK } from '../data/sampleDecks'
import type { GameState, MiniGameId, Quest, QuestPeriod, ThemeId } from '../types'
import {
  currentKeyForPeriod,
  freshQuestPeriodKeys,
  type QuestPeriodKeys,
} from './questReset'
import { monthKey, todayKey, weekKey } from './dates'

const VALID_GAMES: MiniGameId[] = ['memory', 'math', 'glow', 'dash']
const VALID_PERIODS: QuestPeriod[] = ['daily', 'weekly', 'monthly']

const STORAGE_KEY = 'kith.game.v1'
const STARTER_COINS = 100

export function createInitialState(): GameState {
  return {
    xp: 0,
    coins: STARTER_COINS,
    totalCoinsEarned: STARTER_COINS,
    starterGranted: true,
    ownedGames: [],
    ownedThemes: [FREE_THEME],
    activeTheme: FREE_THEME,
    totalFocusMinutes: 0,
    totalSessions: 0,
    totalCardsReviewed: 0,
    totalGamesPlayed: 0,
    totalGamesWon: 0,
    bestMemoryMoves: null,
    bestMathScore: 0,
    bestGlowScore: 0,
    bestDashScore: 0,
    streak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    decks: [SAMPLE_DECK],
    quests: generateAllQuests(),
    questIssuedAt: freshQuestPeriodKeys(),
    achievements: DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a })),
    companionName: 'Ember',
    xpHistory: [],
  }
}

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw) as Partial<GameState> & {
      questDate?: string | null
      questWeek?: string | null
      questMonth?: string | null
    }
    const base: GameState = {
      ...createInitialState(),
      ...parsed,
      coins: typeof parsed.coins === 'number' ? Math.max(0, parsed.coins) : STARTER_COINS,
      totalCoinsEarned:
        typeof parsed.totalCoinsEarned === 'number'
          ? Math.max(0, parsed.totalCoinsEarned)
          : STARTER_COINS,
      starterGranted: Boolean(parsed.starterGranted),
      ownedGames: normalizeOwnedGames(parsed.ownedGames),
      ownedThemes: normalizeOwnedThemes(parsed.ownedThemes),
      activeTheme: normalizeActiveTheme(parsed.activeTheme, parsed.ownedThemes),
      achievements: mergeAchievements(parsed.achievements),
      quests: normalizeQuests(parsed.quests),
      questIssuedAt: normalizePeriodKeys(parsed),
      decks:
        Array.isArray(parsed.decks) && parsed.decks.length > 0
          ? parsed.decks
          : createInitialState().decks,
    }

    if (!base.starterGranted) {
      base.coins += STARTER_COINS
      base.totalCoinsEarned += STARTER_COINS
      base.starterGranted = true
    }

    return base
  } catch {
    return createInitialState()
  }
}

export function saveState(state: GameState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function normalizeOwnedGames(owned: unknown): MiniGameId[] {
  if (!Array.isArray(owned)) return []
  return [...new Set(owned.filter((id): id is MiniGameId => VALID_GAMES.includes(id as MiniGameId)))]
}

function normalizeOwnedThemes(owned: unknown): ThemeId[] {
  const list = Array.isArray(owned)
    ? owned.filter((id): id is ThemeId => VALID_THEMES.includes(id as ThemeId))
    : []
  return [...new Set<ThemeId>([FREE_THEME, ...list])]
}

function normalizeActiveTheme(active: unknown, owned: unknown): ThemeId {
  const ownedThemes = normalizeOwnedThemes(owned)
  if (typeof active === 'string' && ownedThemes.includes(active as ThemeId)) {
    return active as ThemeId
  }
  return FREE_THEME
}

function mergeAchievements(
  saved: GameState['achievements'] | undefined,
): GameState['achievements'] {
  const byId = new Map((saved ?? []).map((a) => [a.id, a]))
  return DEFAULT_ACHIEVEMENTS.map((def) => {
    const prev = byId.get(def.id)
    return prev ? { ...def, unlockedAt: prev.unlockedAt } : { ...def }
  })
}

function isPeriodKey(value: unknown, period: QuestPeriod): value is string {
  if (typeof value !== 'string' || value.length < 4) return false
  if (period === 'daily') return /^\d{4}-\d{2}-\d{2}$/.test(value)
  if (period === 'weekly') return /^\d{4}-W\d{2}$/.test(value)
  return /^\d{4}-\d{2}$/.test(value)
}

/** Migrate hour-timer stamps / legacy date fields into calendar period keys. */
function normalizePeriodKeys(
  parsed: Partial<GameState> & {
    questDate?: string | null
    questWeek?: string | null
    questMonth?: string | null
  },
): QuestPeriodKeys {
  const current = freshQuestPeriodKeys()
  const raw = parsed.questIssuedAt as Partial<Record<QuestPeriod, unknown>> | undefined

  const fromLegacy = {
    daily: parsed.questDate,
    weekly: parsed.questWeek,
    monthly: parsed.questMonth,
  }

  const next: QuestPeriodKeys = { ...current }
  for (const period of VALID_PERIODS) {
    const candidate = raw?.[period] ?? fromLegacy[period]
    if (isPeriodKey(candidate, period)) {
      next[period] = candidate
      continue
    }
    // Old numeric timestamps → pin to the current calendar period (no mid-day wipe).
    // Refresh still happens when the day/week/month rolls via refreshQuests.
    next[period] = currentKeyForPeriod(period)
  }

  // Sanity: never keep a future-looking garbage key
  if (next.daily !== todayKey() && !isPeriodKey(next.daily, 'daily')) next.daily = todayKey()
  if (next.weekly !== weekKey() && !isPeriodKey(next.weekly, 'weekly')) next.weekly = weekKey()
  if (next.monthly !== monthKey() && !isPeriodKey(next.monthly, 'monthly')) next.monthly = monthKey()

  return next
}

function normalizeQuests(quests: Quest[] | undefined): Quest[] {
  if (!Array.isArray(quests) || quests.length === 0) {
    return generateAllQuests()
  }

  const list = quests.map((q) => ({
    ...q,
    period: VALID_PERIODS.includes(q.period) ? q.period : ('daily' as QuestPeriod),
    coinReward: typeof q.coinReward === 'number' ? q.coinReward : 10,
    completed: Boolean(q.completed),
    progress: typeof q.progress === 'number' ? q.progress : 0,
    target: typeof q.target === 'number' ? q.target : 1,
  }))

  const next = [...list]
  if (!next.some((q) => q.period === 'daily')) next.push(...generateDailyQuests())
  if (!next.some((q) => q.period === 'weekly')) next.push(...generateWeeklyQuests())
  if (!next.some((q) => q.period === 'monthly')) next.push(...generateMonthlyQuests())
  return next
}
