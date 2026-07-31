import type { Quest, QuestPeriod, QuestType } from '../types'
import { uid } from '../lib/dates'

interface QuestTemplate {
  title: string
  description: string
  target: number
  xpReward: number
  coinReward: number
  type: QuestType
}

const DAILY_POOL: QuestTemplate[] = [
  {
    title: 'Deep Focus',
    description: 'Complete 25 minutes of focused study today.',
    target: 25,
    xpReward: 40,
    coinReward: 20,
    type: 'focus_minutes',
  },
  {
    title: 'Memory Sparks',
    description: 'Review 10 flashcards today.',
    target: 10,
    xpReward: 30,
    coinReward: 15,
    type: 'cards_reviewed',
  },
  {
    title: 'Show Up',
    description: 'Finish 1 study session today.',
    target: 1,
    xpReward: 20,
    coinReward: 12,
    type: 'sessions',
  },
  {
    title: 'Play Break',
    description: 'Play 2 mini-games today.',
    target: 2,
    xpReward: 25,
    coinReward: 18,
    type: 'games_played',
  },
  {
    title: 'Quick Sprint',
    description: 'Log 15 focus minutes today.',
    target: 15,
    xpReward: 28,
    coinReward: 14,
    type: 'focus_minutes',
  },
  {
    title: 'Card Flick',
    description: 'Review 6 flashcards today.',
    target: 6,
    xpReward: 22,
    coinReward: 12,
    type: 'cards_reviewed',
  },
]

const WEEKLY_POOL: QuestTemplate[] = [
  {
    title: 'Week of Focus',
    description: 'Complete 90 focus minutes this week.',
    target: 90,
    xpReward: 120,
    coinReward: 60,
    type: 'focus_minutes',
  },
  {
    title: 'Card Marathon',
    description: 'Review 40 flashcards this week.',
    target: 40,
    xpReward: 90,
    coinReward: 45,
    type: 'cards_reviewed',
  },
  {
    title: 'Arcade Week',
    description: 'Play 8 mini-games this week.',
    target: 8,
    xpReward: 80,
    coinReward: 40,
    type: 'games_played',
  },
  {
    title: 'Steady Sessions',
    description: 'Finish 5 study sessions this week.',
    target: 5,
    xpReward: 70,
    coinReward: 35,
    type: 'sessions',
  },
]

const MONTHLY_POOL: QuestTemplate[] = [
  {
    title: 'Month of Flame',
    description: 'Complete 300 focus minutes this month.',
    target: 300,
    xpReward: 350,
    coinReward: 160,
    type: 'focus_minutes',
  },
  {
    title: 'Scholar Stack',
    description: 'Review 150 flashcards this month.',
    target: 150,
    xpReward: 280,
    coinReward: 130,
    type: 'cards_reviewed',
  },
  {
    title: 'Arcade Legend',
    description: 'Play 25 mini-games this month.',
    target: 25,
    xpReward: 240,
    coinReward: 110,
    type: 'games_played',
  },
  {
    title: 'Session Streaker',
    description: 'Finish 15 study sessions this month.',
    target: 15,
    xpReward: 220,
    coinReward: 100,
    type: 'sessions',
  },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function fromTemplate(template: QuestTemplate, period: QuestPeriod): Quest {
  return {
    id: uid('quest'),
    title: template.title,
    description: template.description,
    target: template.target,
    progress: 0,
    xpReward: template.xpReward,
    coinReward: template.coinReward,
    completed: false,
    type: template.type,
    period,
  }
}

/** Pick up to `count` templates with unique types when possible. */
function pickTemplates(pool: QuestTemplate[], count: number): QuestTemplate[] {
  const shuffled = shuffle(pool)
  const picked: QuestTemplate[] = []
  const used = new Set<QuestType>()
  for (const t of shuffled) {
    if (picked.length >= count) break
    if (used.has(t.type)) continue
    picked.push(t)
    used.add(t.type)
  }
  // Fill remaining if pool is small
  for (const t of shuffled) {
    if (picked.length >= count) break
    if (picked.includes(t)) continue
    picked.push(t)
  }
  return picked
}

export function generateDailyQuests(): Quest[] {
  return pickTemplates(DAILY_POOL, 4).map((t) => fromTemplate(t, 'daily'))
}

/** One fresh daily quest, preferring types not already on the board. */
export function generateDailyQuest(excludeTypes: Iterable<QuestType> = []): Quest {
  const blocked = new Set(excludeTypes)
  const shuffled = shuffle(DAILY_POOL)
  const preferred = shuffled.find((t) => !blocked.has(t.type)) ?? shuffled[0]
  return fromTemplate(preferred, 'daily')
}

export function generateWeeklyQuests(): Quest[] {
  return pickTemplates(WEEKLY_POOL, 3).map((t) => fromTemplate(t, 'weekly'))
}

export function generateMonthlyQuests(): Quest[] {
  return pickTemplates(MONTHLY_POOL, 3).map((t) => fromTemplate(t, 'monthly'))
}

export function generateQuestsForPeriod(period: QuestPeriod): Quest[] {
  if (period === 'weekly') return generateWeeklyQuests()
  if (period === 'monthly') return generateMonthlyQuests()
  return generateDailyQuests()
}

export function generateAllQuests(): Quest[] {
  return [...generateDailyQuests(), ...generateWeeklyQuests(), ...generateMonthlyQuests()]
}

export const PERIOD_LABEL: Record<QuestPeriod, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}
