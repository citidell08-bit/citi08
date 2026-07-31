import type { Quest } from '../types'
import { uid } from '../lib/dates'

export function generateDailyQuests(): Quest[] {
  return [
    {
      id: uid('quest'),
      title: 'Deep Focus',
      description: 'Complete 25 minutes of focused study.',
      target: 25,
      progress: 0,
      xpReward: 40,
      coinReward: 20,
      completed: false,
      type: 'focus_minutes',
    },
    {
      id: uid('quest'),
      title: 'Memory Sparks',
      description: 'Review 10 flashcards.',
      target: 10,
      progress: 0,
      xpReward: 30,
      coinReward: 15,
      completed: false,
      type: 'cards_reviewed',
    },
    {
      id: uid('quest'),
      title: 'Show Up',
      description: 'Finish 1 study session today.',
      target: 1,
      progress: 0,
      xpReward: 20,
      coinReward: 12,
      completed: false,
      type: 'sessions',
    },
    {
      id: uid('quest'),
      title: 'Play Break',
      description: 'Play 2 mini-games with your coins.',
      target: 2,
      progress: 0,
      xpReward: 25,
      coinReward: 18,
      completed: false,
      type: 'games_played',
    },
  ]
}
