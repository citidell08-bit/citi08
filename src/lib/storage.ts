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
const VALID_QUEST_TYPES = [
  'focus_minutes',
  'cards_reviewed',
  'sessions',
  'games_played',
  'manual',
] as const

/** Bumped to wipe legacy starter-coin saves — fresh installs start at 0. */
const STORAGE_KEY = 'kith.game.v2'

export function createInitialState(): GameState {
  return {
    xp: 0,
    coins: 0,
    totalCoinsEarned: 0,
    /** Legacy flag — starter packs are no longer granted. Fresh saves start at 0. */
    starterGranted: true,
    projectGift100: false,
    projectGift10k: false,
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
      xp: typeof parsed.xp === 'number' ? Math.max(0, parsed.xp) : 0,
      coins: typeof parsed.coins === 'number' ? Math.max(0, parsed.coins) : 0,
      totalCoinsEarned:
        typeof parsed.totalCoinsEarned === 'number' ? Math.max(0, parsed.totalCoinsEarned) : 0,
      starterGranted: true,
      projectGift100: Boolean(parsed.projectGift100),
      projectGift10k: Boolean(parsed.projectGift10k),
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

    return base
  } catch {
    return createInitialState()
  }
}

export function saveState(state: GameState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

/** Wipe all Cyber Kith progress on this device and return a blank save. */
export function clearState(): GameState {
  try {
    localStorage.removeItem(STORAGE_KEY)
    // Drop the old v1 slot too so leftover starter saves can't linger.
    localStorage.removeItem('kith.game.v1')
  } catch {
    /* ignore quota / private mode */
  }
  const fresh = createInitialState()
  saveState(fresh)
  return fresh
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

  const list: Quest[] = quests.map((q) => {
    const type = VALID_QUEST_TYPES.includes(q.type as (typeof VALID_QUEST_TYPES)[number])
      ? q.type
      : ('sessions' as const)
    return {
      ...q,
      type,
      period: VALID_PERIODS.includes(q.period) ? q.period : ('daily' as QuestPeriod),
      coinReward: typeof q.coinReward === 'number' ? q.coinReward : 10,
      completed: Boolean(q.completed),
      progress: typeof q.progress === 'number' ? q.progress : 0,
      target: typeof q.target === 'number' ? q.target : 1,
      custom: Boolean(q.custom) || undefined,
    }
  })

  const next: Quest[] = [...list]
  if (!next.some((q) => q.period === 'daily' && !q.custom)) next.push(...generateDailyQuests())
  if (!next.some((q) => q.period === 'weekly' && !q.custom)) next.push(...generateWeeklyQuests())
  if (!next.some((q) => q.period === 'monthly' && !q.custom)) next.push(...generateMonthlyQuests())
  return next
}
