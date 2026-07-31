export type Tab = 'home' | 'focus' | 'cards' | 'play' | 'quests'

export type MiniGameId = 'memory' | 'math' | 'glow' | 'dash'

export interface Flashcard {
  id: string
  front: string
  back: string
}

export interface Deck {
  id: string
  name: string
  cards: Flashcard[]
  createdAt: string
}

export type QuestPeriod = 'daily' | 'weekly' | 'monthly'
export type QuestType = 'focus_minutes' | 'cards_reviewed' | 'sessions' | 'games_played'

export interface Quest {
  id: string
  title: string
  description: string
  target: number
  progress: number
  xpReward: number
  coinReward: number
  completed: boolean
  type: QuestType
  period: QuestPeriod
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt: string | null
}

export interface XpEvent {
  id: string
  amount: number
  reason: string
  at: string
}

export interface GameState {
  xp: number
  coins: number
  totalCoinsEarned: number
  /** One-time starter pack so players can open the arcade immediately. */
  starterGranted: boolean
  /** Games purchased once — replay is free forever. */
  ownedGames: MiniGameId[]
  totalFocusMinutes: number
  totalSessions: number
  totalCardsReviewed: number
  totalGamesPlayed: number
  totalGamesWon: number
  bestMemoryMoves: number | null
  bestMathScore: number
  bestGlowScore: number
  bestDashScore: number
  streak: number
  longestStreak: number
  lastActiveDate: string | null
  decks: Deck[]
  quests: Quest[]
  /** Local YYYY-MM-DD when daily quests were issued. */
  questDate: string | null
  /** Local YYYY-Www when weekly quests were issued. */
  questWeek: string | null
  /** Local YYYY-MM when monthly quests were issued. */
  questMonth: string | null
  achievements: Achievement[]
  companionName: string
  xpHistory: XpEvent[]
}

export interface Toast {
  id: string
  message: string
  xp?: number
  coins?: number
}

export interface MiniGameResult {
  gameId: MiniGameId
  won: boolean
  score: number
  xp: number
  label: string
}

export interface LevelUpInfo {
  level: number
  coins: number
}
