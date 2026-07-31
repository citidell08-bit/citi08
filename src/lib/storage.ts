import { DEFAULT_ACHIEVEMENTS } from '../data/achievements'
import { generateDailyQuests } from '../data/quests'
import { SAMPLE_DECK } from '../data/sampleDecks'
import type { GameState, Quest } from '../types'
import { todayKey, uid } from './dates'

const STORAGE_KEY = 'kith.game.v1'

export function createInitialState(): GameState {
  return {
    xp: 0,
    totalFocusMinutes: 0,
    totalSessions: 0,
    totalCardsReviewed: 0,
    totalGamesPlayed: 0,
    totalGamesWon: 0,
    bestMemoryMoves: null,
    bestMathScore: 0,
    bestGlowScore: 0,
    streak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    decks: [SAMPLE_DECK],
    quests: generateDailyQuests(),
    questDate: todayKey(),
    achievements: DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a })),
    companionName: 'Ember',
    xpHistory: [],
  }
}

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw) as GameState
    return {
      ...createInitialState(),
      ...parsed,
      achievements: mergeAchievements(parsed.achievements),
      quests: ensureGameQuest(parsed.quests),
    }
  } catch {
    return createInitialState()
  }
}

export function saveState(state: GameState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
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

function ensureGameQuest(quests: Quest[] | undefined): Quest[] {
  const list = quests ?? generateDailyQuests()
  if (list.some((q) => q.type === 'games_played')) return list
  return [
    ...list,
    {
      id: uid('quest'),
      title: 'Play Break',
      description: 'Play 2 mini-games.',
      target: 2,
      progress: 0,
      xpReward: 25,
      completed: false,
      type: 'games_played',
    },
  ]
}
