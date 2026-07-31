import type { Achievement } from '../types'

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_focus',
    title: 'First Flame',
    description: 'Complete your first focus session.',
    icon: 'flame',
    unlockedAt: null,
  },
  {
    id: 'hour_club',
    title: 'Hour Club',
    description: 'Log 60 total focus minutes.',
    icon: 'clock',
    unlockedAt: null,
  },
  {
    id: 'card_curious',
    title: 'Card Curious',
    description: 'Review 25 flashcards.',
    icon: 'cards',
    unlockedAt: null,
  },
  {
    id: 'streak_3',
    title: 'Warm Streak',
    description: 'Keep a 3-day study streak.',
    icon: 'streak',
    unlockedAt: null,
  },
  {
    id: 'streak_7',
    title: 'Week Weaver',
    description: 'Keep a 7-day study streak.',
    icon: 'crown',
    unlockedAt: null,
  },
  {
    id: 'level_5',
    title: 'Rising Kith',
    description: 'Reach companion level 5.',
    icon: 'star',
    unlockedAt: null,
  },
  {
    id: 'quest_clear',
    title: 'Quest Cleared',
    description: 'Complete all daily quests in a day.',
    icon: 'scroll',
    unlockedAt: null,
  },
  {
    id: 'deck_maker',
    title: 'Deck Maker',
    description: 'Create your first flashcard deck.',
    icon: 'book',
    unlockedAt: null,
  },
]
