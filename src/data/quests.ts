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

export const QUEST_TYPE_LABEL: Record<QuestType, string> = {
  focus_minutes: 'Focus minutes',
  cards_reviewed: 'Cards reviewed',
  sessions: 'Study sessions',
  games_played: 'Games played',
  manual: 'Manual check-off',
}

export const MAX_CUSTOM_QUESTS = 8

export interface CustomQuestInput {
  title: string
  description?: string
  type: QuestType
  target: number
  period: QuestPeriod
}

function clampTarget(type: QuestType, target: number, period: QuestPeriod): number {
  const n = Math.max(1, Math.round(target) || 1)
  if (type === 'manual') return 1
  if (type === 'focus_minutes') {
    if (period === 'monthly') return Math.min(600, Math.max(10, n))
    if (period === 'weekly') return Math.min(240, Math.max(10, n))
    return Math.min(120, Math.max(5, n))
  }
  if (type === 'cards_reviewed') {
    if (period === 'monthly') return Math.min(300, Math.max(5, n))
    if (period === 'weekly') return Math.min(100, Math.max(5, n))
    return Math.min(40, Math.max(3, n))
  }
  if (type === 'sessions') {
    if (period === 'monthly') return Math.min(40, Math.max(1, n))
    if (period === 'weekly') return Math.min(14, Math.max(1, n))
    return Math.min(5, Math.max(1, n))
  }
  // games_played
  if (period === 'monthly') return Math.min(50, Math.max(1, n))
  if (period === 'weekly') return Math.min(20, Math.max(1, n))
  return Math.min(10, Math.max(1, n))
}

function rewardsFor(type: QuestType, target: number, period: QuestPeriod): {
  xpReward: number
  coinReward: number
} {
  const periodBoost = period === 'monthly' ? 1.4 : period === 'weekly' ? 1.15 : 1
  let xp = 20
  let coins = 12
  if (type === 'focus_minutes') {
    xp = Math.round(target * 1.6)
    coins = Math.round(target * 0.85)
  } else if (type === 'cards_reviewed') {
    xp = Math.round(target * 3)
    coins = Math.round(target * 1.5)
  } else if (type === 'sessions') {
    xp = target * 22
    coins = target * 12
  } else if (type === 'games_played') {
    xp = target * 14
    coins = target * 9
  } else {
    xp = period === 'monthly' ? 40 : period === 'weekly' ? 30 : 22
    coins = period === 'monthly' ? 22 : period === 'weekly' ? 16 : 12
  }
  return {
    xpReward: Math.min(400, Math.max(12, Math.round(xp * periodBoost))),
    coinReward: Math.min(200, Math.max(8, Math.round(coins * periodBoost))),
  }
}

function defaultDescription(type: QuestType, target: number, period: QuestPeriod): string {
  const when =
    period === 'weekly' ? 'this week' : period === 'monthly' ? 'this month' : 'today'
  if (type === 'manual') return `Your personal goal — mark it done when you finish (${when}).`
  if (type === 'focus_minutes') return `Log ${target} focus minutes ${when}.`
  if (type === 'cards_reviewed') return `Review ${target} flashcards ${when}.`
  if (type === 'sessions') return `Finish ${target} study session${target === 1 ? '' : 's'} ${when}.`
  return `Play ${target} mini-game${target === 1 ? '' : 's'} ${when}.`
}

export function createCustomQuest(input: CustomQuestInput): Quest {
  const title = input.title.trim().slice(0, 48) || 'My quest'
  const type = input.type
  const period = input.period
  const target = clampTarget(type, input.target, period)
  const { xpReward, coinReward } = rewardsFor(type, target, period)
  const description =
    input.description?.trim().slice(0, 140) || defaultDescription(type, target, period)

  return {
    id: uid('quest'),
    title,
    description,
    target,
    progress: 0,
    xpReward,
    coinReward,
    completed: false,
    type,
    period,
    custom: true,
  }
}

/** Replace system quests for a period while keeping player-made ones. */
export function replaceSystemQuests(
  quests: Quest[],
  period: QuestPeriod,
  freshSystem: Quest[],
  opts?: { resetCustomProgress?: boolean },
): Quest[] {
  const custom = quests
    .filter((q) => q.period === period && q.custom)
    .map((q) =>
      opts?.resetCustomProgress
        ? { ...q, progress: 0, completed: false }
        : q,
    )
  const others = quests.filter((q) => q.period !== period)
  return [...others, ...freshSystem, ...custom]
}
