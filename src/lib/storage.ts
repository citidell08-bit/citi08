import { DEFAULT_ACHIEVEMENTS } from '../data/achievements'
import {
  generateAllQuests,
  generateDailyQuests,
  generateMonthlyQuests,
  generateWeeklyQuests,
} from '../data/quests'
import { SAMPLE_DECK } from '../data/sampleDecks'
import type { GameState, MiniGameId, Quest, QuestPeriod } from '../types'
import { freshQuestIssuedAt, type QuestIssuedAt } from './questReset'

const VALID_GAMES: MiniGameId[] = ['memory', 'math', 'glow', 'dash']
const VALID_PERIODS: QuestPeriod[] = ['daily', 'weekly', 'monthly']

const STORAGE_KEY = 'kith.game.v1'
const STARTER_COINS = 100

export function createInitialState(): GameState {
  const now = Date.now()
  return {
    xp: 0,
    coins: STARTER_COINS,
    totalCoinsEarned: STARTER_COINS,
    starterGranted: true,
    ownedGames: [],
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
    questIssuedAt: freshQuestIssuedAt(now),
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
      achievements: mergeAchievements(parsed.achievements),
      quests: normalizeQuests(parsed.quests),
      questIssuedAt: normalizeIssuedAt(parsed.questIssuedAt),
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

function mergeAchievements(
  saved: GameState['achievements'] | undefined,
): GameState['achievements'] {
  const byId = new Map((saved ?? []).map((a) => [a.id, a]))
  return DEFAULT_ACHIEVEMENTS.map((def) => {
    const prev = byId.get(def.id)
    return prev ? { ...def, unlockedAt: prev.unlockedAt } : { ...def }
  })
}

function normalizeIssuedAt(raw: unknown): QuestIssuedAt {
  const now = Date.now()
  const fallback = freshQuestIssuedAt(now)
  if (!raw || typeof raw !== 'object') return fallback
  const obj = raw as Partial<QuestIssuedAt>
  return {
    daily: typeof obj.daily === 'number' ? obj.daily : now,
    weekly: typeof obj.weekly === 'number' ? obj.weekly : now,
    monthly: typeof obj.monthly === 'number' ? obj.monthly : now,
  }
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
