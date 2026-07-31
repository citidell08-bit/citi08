export type Tab = 'home' | 'focus' | 'cards' | 'play' | 'quests' | 'store'

export type MiniGameId = 'memory' | 'math' | 'glow' | 'dash'

export type ThemeId =
  | 'neon-blue'
  | 'neon-cyan'
  | 'neon-pink'
  | 'neon-lime'
  | 'neon-violet'
  | 'neon-amber'
  | 'cyber-grid'
  | 'neon-void'

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
export type QuestType =
  | 'focus_minutes'
  | 'cards_reviewed'
  | 'sessions'
  | 'games_played'
  /** Player marks complete themselves — not auto-tracked. */
  | 'manual'

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
  /** Player-created quest — kept across system board refreshes. */
  custom?: boolean
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
  /** Legacy field (starter packs removed — new players begin at 0 coins / XP). */
  starterGranted: boolean
  /** Games purchased once — replay is free forever. */
  ownedGames: MiniGameId[]
  /** Background themes purchased once. */
  ownedThemes: ThemeId[]
  /** Currently equipped background theme. */
  activeTheme: ThemeId
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
  /**
   * Calendar keys for each board (daily = YYYY-MM-DD, weekly = YYYY-Www, monthly = YYYY-MM).
   * Boards refresh when the key no longer matches today / this week / this month.
   */
  questIssuedAt: {
    daily: string
    weekly: string
    monthly: string
  }
  /** @deprecated Kept for older saves; migrated into questIssuedAt. */
  questDate?: string | null
  questWeek?: string | null
  questMonth?: string | null
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
  /** Bonus coins picked up during the run (added on finish). */
  coinsEarned?: number
}

export interface LevelUpInfo {
  level: number
  coins: number
}
