export type Tab = 'home' | 'focus' | 'cards' | 'play' | 'quests'

export type MiniGameId = 'memory' | 'math' | 'glow'

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

export interface Quest {
  id: string
  title: string
  description: string
  target: number
  progress: number
  xpReward: number
  completed: boolean
  type: 'focus_minutes' | 'cards_reviewed' | 'sessions' | 'games_played'
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
  totalFocusMinutes: number
  totalSessions: number
  totalCardsReviewed: number
  totalGamesPlayed: number
  totalGamesWon: number
  bestMemoryMoves: number | null
  bestMathScore: number
  bestGlowScore: number
  streak: number
  longestStreak: number
  lastActiveDate: string | null
  decks: Deck[]
  quests: Quest[]
  questDate: string | null
  achievements: Achievement[]
  companionName: string
  xpHistory: XpEvent[]
}

export interface Toast {
  id: string
  message: string
  xp?: number
}

export interface MiniGameResult {
  gameId: MiniGameId
  won: boolean
  score: number
  xp: number
  label: string
}
