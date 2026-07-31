import { GAME_COSTS } from './coins'
import { levelFromXp, progressToNextLevel } from './xp'
import type { GameState, Tab } from '../types'

export interface AssistantReply {
  text: string
  /** Optional navigation suggestion. */
  goTo?: Tab
  goLabel?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  goTo?: Tab
  goLabel?: string
  /** Optional internal source tag — not shown to the player. */
  source?: string
  /** In-flight status while Ember thinks */
  status?: string
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s+#◉]/g, ' ').replace(/\s+/g, ' ').trim()
}

function hasAny(hay: string, needles: string[]): boolean {
  return needles.some((n) => hay.includes(n))
}

function nextStep(state: GameState): AssistantReply {
  const name = state.companionName
  const dailyOpen = state.quests.filter((q) => q.period === 'daily' && !q.custom && !q.completed)
  const customOpen = state.quests.filter((q) => q.custom && !q.completed)
  const level = levelFromXp(state.xp)
  const { needed } = progressToNextLevel(state.xp)
  const cheapestGame = Math.min(...Object.values(GAME_COSTS))

  if (state.totalSessions === 0 && state.totalCardsReviewed === 0) {
    return {
      text: `Hey — I'm ${name}. You start at zero coins and XP, so the fastest path is a short Focus session or a few flashcards. That unlocks quests progress and starts minting coins.`,
      goTo: 'focus',
      goLabel: 'Open Focus',
    }
  }

  if (dailyOpen.length > 0) {
    const tip = dailyOpen[0]
    return {
      text: `You've got ${dailyOpen.length} daily quest${dailyOpen.length === 1 ? '' : 's'} open. Try “${tip.title}” next (${tip.progress}/${tip.target}). Clearing the whole daily board deals a fresh set.`,
      goTo: 'quests',
      goLabel: 'View quests',
    }
  }

  if (customOpen.length > 0) {
    return {
      text: `Your custom quest “${customOpen[0].title}” is still open. Finish it for +${customOpen[0].xpReward} XP and +${customOpen[0].coinReward} ◉ — or add another goal on Quests.`,
      goTo: 'quests',
      goLabel: 'Open Quests',
    }
  }

  if (state.coins < cheapestGame && state.ownedGames.length < 4) {
    return {
      text: `You're sitting on ${state.coins} ◉. Cheapest arcade unlock is ${cheapestGame} coins. Grind a Focus block or clear quests, then swing by Play.`,
      goTo: 'focus',
      goLabel: 'Earn XP in Focus',
    }
  }

  if (state.streak === 0) {
    return {
      text: `No day streak yet. Study or play once today — come back tomorrow and it'll climb to 2. I'm level-tracking with you at Lv ${level} (${needed} XP to next).`,
      goTo: 'cards',
      goLabel: 'Review cards',
    }
  }

  return {
    text: `You're rolling, ${name}'s proud — Lv ${level}, ${state.coins} ◉, streak ${state.streak}. Keep a Focus session, knock cards, or climb Glow Catch for fun coin pickups.`,
    goTo: 'play',
    goLabel: 'Open Arcade',
  }
}

/** Offline companion assistant — intent + game-state help (no network). */
export function replyAsAssistant(raw: string, state: GameState): AssistantReply {
  const q = normalize(raw)
  const name = state.companionName
  const level = levelFromXp(state.xp)

  if (!q || hasAny(q, ['hi', 'hello', 'hey', 'yo', 'sup', 'hola'])) {
    return {
      text: `Hey! I'm ${name}. Ask me anything — I know Cyber Kith inside out, and I've got study wisdom when you need it.`,
    }
  }

  if (hasAny(q, ['help', 'stuck', 'what do', 'what should', 'next', 'start', 'begin', 'lost', 'guide'])) {
    return nextStep(state)
  }

  if (hasAny(q, ['coin', 'money', 'cash', 'earn', 'grind', 'broke', 'afford', '◉'])) {
    return {
      text: `Coins come from quests, level-ups (+25 ◉ each), achievements (+10), and small arcade bonuses / in-run pickups. You have ${state.coins} ◉ now. Games cost ${GAME_COSTS.math}–${GAME_COSTS.dash} once, then replay free. Themes are in the store.`,
      goTo: 'quests',
      goLabel: 'Earn via quests',
    }
  }

  if (hasAny(q, ['xp', 'level', 'level up', 'experience'])) {
    const { current, needed } = progressToNextLevel(state.xp)
    return {
      text: `You're level ${level} with ${current}/${needed} XP toward the next one. Focus sessions, flashcards, quests, and mini-games all grant XP. Each level-up also mints coins.`,
      goTo: 'focus',
      goLabel: 'Focus for XP',
    }
  }

  if (hasAny(q, ['quest', 'daily', 'weekly', 'monthly', 'custom quest', 'add quest', 'my quest'])) {
    return {
      text: `Quests: daily refreshes when you clear the board (and at midnight). Weekly = Mondays, monthly = 1st. Tap “Add my quest” to create your own (tracked or manual check-off) — customs stay across board refreshes (max 8).`,
      goTo: 'quests',
      goLabel: 'Open Quests',
    }
  }

  if (hasAny(q, ['streak', 'day streak', 'daily streak'])) {
    return {
      text: `Day streak: study or play today → streak 1. Come back tomorrow → 2. Miss a full day and it resets. You're at ${state.streak} (best ${state.longestStreak}).`,
      goTo: 'home',
      goLabel: 'See streak on Home',
    }
  }

  if (hasAny(q, ['focus', 'timer', 'pomodoro', 'study session', 'deep work'])) {
    return {
      text: `Focus: pick a preset, hit begin, and stay with it. Finish (or finish early) to bank minutes, XP, quest progress, and your day streak. Take a break mid-session if you need to reset your brain.`,
      goTo: 'focus',
      goLabel: 'Start Focus',
    }
  }

  if (hasAny(q, ['card', 'flash', 'deck', 'memor'])) {
    if (q.includes('memory nest') || q.includes('memory game')) {
      /* fall through to games */
    } else {
      return {
        text: `Flashcards: flip, recall, mark if you knew it. Each review earns XP and quest credit. Build your own decks for any subject — starter Cell Biology is there if you want a warm-up.`,
        goTo: 'cards',
        goLabel: 'Open Cards',
      }
    }
  }

  if (hasAny(q, ['glow', 'glow catch'])) {
    return {
      text: `Glow Catch: tap every lit cell before the window ends. Clear a level → 5s pause → harder/faster with more targets. Miss or timeout ends the run; Play again restarts at level 1. Grab ◉ only from lit coin cells.`,
      goTo: 'play',
      goLabel: 'Play Glow',
    }
  }

  if (hasAny(q, ['dash', 'spike', 'runner', 'geometry'])) {
    return {
      text: `Spike Dash: jump the spikes, land on blocks, snag coin pickups. Survive for distance — personal bests save on this device. Buy once, replay free.`,
      goTo: 'play',
      goLabel: 'Play Dash',
    }
  }

  if (hasAny(q, ['quick sum', 'math', 'arithmetic', 'sum'])) {
    return {
      text: `Quick Sum: solve as many as you can. Each correct answer adds +3 seconds. Build a solve streak for XP. Goal is 8+ correct in a run.`,
      goTo: 'play',
      goLabel: 'Play Quick Sum',
    }
  }

  if (hasAny(q, ['game', 'arcade', 'mini', 'play', 'nest'])) {
    const owned = state.ownedGames.length
    return {
      text: `Arcade has Spike Dash, Memory Nest, Quick Sum, and Glow Catch. Clear a quest or earn once to unlock the cabinet, then buy games with coins (you own ${owned}/4). Win rounds for a small ◉ bonus.`,
      goTo: 'play',
      goLabel: 'Open Arcade',
    }
  }

  if (hasAny(q, ['theme', 'store', 'neon', 'background', 'color', 'void'])) {
    return {
      text: `Theme store: spend coins on neon looks (Neon Void is the space legendary). One free theme to start — equip any you own anytime.`,
      goTo: 'store',
      goLabel: 'Open Themes',
    }
  }

  if (hasAny(q, ['reset', 'wipe', 'new player', 'delete', 'erase', 'start over'])) {
    return {
      text: `Want a clean slate? Home → Reset progress → confirm. That wipes coins, XP, streak, games, themes, and quests on this device. Can't undo it.`,
      goTo: 'home',
      goLabel: 'Go to Home',
    }
  }

  if (hasAny(q, ['music', 'sound', 'mute', 'bgm', 'audio'])) {
    return {
      text: `Use the Music toggle (near the coin chip) to mute or unmute the vibe. UI clicks and game SFX still work either way once audio is unlocked by a tap.`,
    }
  }

  if (hasAny(q, ['tip', 'advice', 'study tip', 'how to study', 'concentrate', 'motivation', 'tired'])) {
    const tips = [
      `Try a 15–25m Focus block, then 5 cards — small loops beat marathon cram sessions.`,
      `Active recall > re-reading. Flip the card, say the answer out loud, then check.`,
      `If you're fried, clear one easy daily quest or a Quick Sum round — momentum counts.`,
      `Protect the streak: even 1 session today keeps ${name} glowing for tomorrow.`,
    ]
    return {
      text: tips[Math.floor(Math.random() * tips.length)],
      goTo: 'focus',
      goLabel: 'Do a Focus block',
    }
  }

  if (hasAny(q, ['who are you', 'what are you', 'companion', 'kith', 'ember', 'your name'])) {
    return {
      text: `I'm ${name}, your Cyber Kith — a study companion that levels up with you (you're Lv ${level}). Rename me on Home anytime. I help with the app and study nudges offline; no account needed.`,
      goTo: 'home',
      goLabel: 'Visit Home',
    }
  }

  if (hasAny(q, ['thank', 'thanks', 'ty', 'appreciate'])) {
    return { text: `Anytime. I've got your back — go earn something shiny.` }
  }

  // Fallback: acknowledge + point to next useful action
  const fallback = nextStep(state)
  return {
    text: `Not sure I caught that, but here's what I'd do: ${fallback.text}`,
    goTo: fallback.goTo,
    goLabel: fallback.goLabel,
  }
}

export const QUICK_PROMPTS = [
  'What should I do next?',
  'How do I earn coins fast?',
  'Quiz me with a study tip',
  'Explain spaced repetition',
  'How do custom quests work?',
] as const
