import { startTransition, useEffect, useState } from 'react'
import { generateDailyQuests } from '../data/quests'
import { COINS_PER_ACHIEVEMENT, coinsForLevelsGained, GAME_COSTS } from '../lib/coins'
import { todayKey, uid, yesterdayKey } from '../lib/dates'
import { levelFromXp } from '../lib/xp'
import { createInitialState, loadState, saveState } from '../lib/storage'
import type {
  Deck,
  Flashcard,
  GameState,
  LevelUpInfo,
  MiniGameId,
  MiniGameResult,
  Quest,
  Toast,
} from '../types'

export function useGameState() {
  const [state, setState] = useState<GameState>(() => loadState())
  const [toasts, setToasts] = useState<Toast[]>([])
  const [levelUp, setLevelUp] = useState<LevelUpInfo | null>(null)

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    startTransition(() => {
      setState((prev) => refreshDaily(prev))
    })
  }, [])

  function pushToast(message: string, extras?: { xp?: number; coins?: number }) {
    const toast: Toast = { id: uid('toast'), message, xp: extras?.xp, coins: extras?.coins }
    setToasts((t) => [...t, toast])
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== toast.id))
    }, 2800)
  }

  function awardCoins(prev: GameState, amount: number): GameState {
    if (amount <= 0) return prev
    return {
      ...prev,
      coins: prev.coins + amount,
      totalCoinsEarned: prev.totalCoinsEarned + amount,
    }
  }

  function awardXp(prev: GameState, amount: number, reason: string): GameState {
    const before = levelFromXp(prev.xp)
    const nextXp = prev.xp + amount
    const after = levelFromXp(nextXp)
    let next: GameState = {
      ...prev,
      xp: nextXp,
      xpHistory: [
        { id: uid('xp'), amount, reason, at: new Date().toISOString() },
        ...prev.xpHistory,
      ].slice(0, 40),
    }

    if (after > before) {
      const levelCoins = coinsForLevelsGained(before, after)
      next = awardCoins(next, levelCoins)
      queueMicrotask(() => setLevelUp({ level: after, coins: levelCoins }))
      queueMicrotask(() =>
        pushToast(reason, { xp: amount, coins: levelCoins }),
      )
    } else {
      queueMicrotask(() => pushToast(reason, { xp: amount }))
    }

    return next
  }

  function markActive(prev: GameState): GameState {
    const today = todayKey()
    if (prev.lastActiveDate === today) return prev

    let streak = 1
    if (prev.lastActiveDate === yesterdayKey()) {
      streak = prev.streak + 1
    }

    return {
      ...prev,
      streak,
      longestStreak: Math.max(prev.longestStreak, streak),
      lastActiveDate: today,
    }
  }

  function withQuests(
    prev: GameState,
    updater: (quests: Quest[]) => Quest[],
  ): GameState {
    const quests = updater(prev.quests).map((q) => ({ ...q }))
    let next: GameState = { ...prev, quests }
    let bonusXp = 0
    let bonusCoins = 0

    for (const q of quests) {
      if (!q.completed && q.progress >= q.target) {
        q.completed = true
        bonusXp += q.xpReward
        bonusCoins += q.coinReward
      }
    }

    if (bonusCoins > 0) {
      next = awardCoins(next, bonusCoins)
    }

    if (bonusXp > 0) {
      next = awardXp(next, bonusXp, 'Quest reward')
      if (bonusCoins > 0) {
        queueMicrotask(() => pushToast('Quest coins', { coins: bonusCoins }))
      }
    }

    if (quests.every((q) => q.completed)) {
      next = unlock(next, 'quest_clear')
    }

    return next
  }

  function bumpQuest(
    prev: GameState,
    type: Quest['type'],
    amount: number,
  ): GameState {
    return withQuests(prev, (quests) =>
      quests.map((q) =>
        q.type === type && !q.completed
          ? { ...q, progress: Math.min(q.target, q.progress + amount) }
          : q,
      ),
    )
  }

  function unlock(prev: GameState, id: string): GameState {
    const wasLocked = prev.achievements.find((a) => a.id === id && !a.unlockedAt)
    const achievements = prev.achievements.map((a) =>
      a.id === id && !a.unlockedAt
        ? { ...a, unlockedAt: new Date().toISOString() }
        : a,
    )
    let next: GameState = { ...prev, achievements }
    if (wasLocked) {
      next = awardCoins(next, COINS_PER_ACHIEVEMENT)
      const newly = achievements.find((a) => a.id === id)
      if (newly) {
        queueMicrotask(() =>
          pushToast(`Achievement: ${newly.title}`, { coins: COINS_PER_ACHIEVEMENT }),
        )
      }
    }
    return next
  }

  function checkAchievements(prev: GameState): GameState {
    let next = prev
    if (prev.totalSessions >= 1) next = unlock(next, 'first_focus')
    if (prev.totalFocusMinutes >= 60) next = unlock(next, 'hour_club')
    if (prev.totalCardsReviewed >= 25) next = unlock(next, 'card_curious')
    if (prev.streak >= 3) next = unlock(next, 'streak_3')
    if (prev.streak >= 7) next = unlock(next, 'streak_7')
    if (levelFromXp(prev.xp) >= 5) next = unlock(next, 'level_5')
    if (prev.decks.some((d) => !d.id.startsWith('deck_sample'))) {
      next = unlock(next, 'deck_maker')
    }
    if (prev.totalGamesPlayed >= 1) next = unlock(next, 'first_game')
    if (prev.totalGamesWon >= 5) next = unlock(next, 'arcade_five')
    if (prev.bestMemoryMoves != null && prev.bestMemoryMoves <= 16) {
      next = unlock(next, 'memory_sharp')
    }
    return next
  }

  function completeFocusSession(minutes: number) {
    setState((prev) => {
      const xpGain = Math.max(10, Math.round(minutes * 2.5))
      let next = markActive(prev)
      next = {
        ...next,
        totalFocusMinutes: next.totalFocusMinutes + minutes,
        totalSessions: next.totalSessions + 1,
      }
      next = awardXp(next, xpGain, `${minutes}m focus session`)
      next = bumpQuest(next, 'focus_minutes', minutes)
      next = bumpQuest(next, 'sessions', 1)
      next = checkAchievements(next)
      return next
    })
  }

  function reviewCard(knewIt: boolean) {
    setState((prev) => {
      const xpGain = knewIt ? 8 : 3
      let next = markActive(prev)
      next = {
        ...next,
        totalCardsReviewed: next.totalCardsReviewed + 1,
      }
      next = awardXp(next, xpGain, knewIt ? 'Card mastered' : 'Card practiced')
      next = bumpQuest(next, 'cards_reviewed', 1)
      next = checkAchievements(next)
      return next
    })
  }

  function spendCoinsForGame(gameId: MiniGameId): boolean {
    const cost = GAME_COSTS[gameId]
    if (state.coins < cost) return false
    setState((prev) => {
      if (prev.coins < cost) return prev
      queueMicrotask(() => pushToast('Arcade entry', { coins: -cost }))
      return { ...prev, coins: prev.coins - cost }
    })
    return true
  }

  function completeMiniGame(result: MiniGameResult) {
    setState((prev) => {
      let next = markActive(prev)
      next = {
        ...next,
        totalGamesPlayed: next.totalGamesPlayed + 1,
        totalGamesWon: next.totalGamesWon + (result.won ? 1 : 0),
        bestMathScore:
          result.gameId === 'math'
            ? Math.max(next.bestMathScore, result.score)
            : next.bestMathScore,
        bestGlowScore:
          result.gameId === 'glow'
            ? Math.max(next.bestGlowScore, result.score)
            : next.bestGlowScore,
        bestMemoryMoves:
          result.gameId === 'memory' && result.won
            ? next.bestMemoryMoves == null
              ? result.score
              : Math.min(next.bestMemoryMoves, result.score)
            : next.bestMemoryMoves,
      }
      // Small coin tip for a win so arcade isn't only a sink
      if (result.won) {
        next = awardCoins(next, 5)
      }
      next = awardXp(next, result.xp, result.label)
      if (result.won) {
        queueMicrotask(() => pushToast('Win bonus', { coins: 5 }))
      }
      next = bumpQuest(next, 'games_played', 1)
      next = checkAchievements(next)
      return next
    })
  }

  function createDeck(name: string, cards: Omit<Flashcard, 'id'>[]) {
    setState((prev) => {
      const deck: Deck = {
        id: uid('deck'),
        name: name.trim() || 'Untitled Deck',
        createdAt: new Date().toISOString(),
        cards: cards.map((c) => ({ ...c, id: uid('card') })),
      }
      let next = { ...prev, decks: [deck, ...prev.decks] }
      next = unlock(next, 'deck_maker')
      next = awardXp(next, 15, 'New deck forged')
      return next
    })
  }

  function renameCompanion(name: string) {
    setState((prev) => ({
      ...prev,
      companionName: name.trim() || prev.companionName,
    }))
  }

  function dismissLevelUp() {
    setLevelUp(null)
  }

  function resetProgress() {
    const name = state.companionName
    const decks = state.decks
    const initial = refreshDaily({
      ...createInitialState(),
      companionName: name,
      decks,
      achievements: createInitialState().achievements,
    })
    setState(initial)
    pushToast('Progress reset — fresh start!')
  }

  return {
    state,
    toasts,
    levelUp,
    completeFocusSession,
    reviewCard,
    spendCoinsForGame,
    completeMiniGame,
    createDeck,
    renameCompanion,
    dismissLevelUp,
    resetProgress,
  }
}

function refreshDaily(state: GameState): GameState {
  const today = todayKey()
  if (state.questDate === today) return state
  return {
    ...state,
    quests: generateDailyQuests(),
    questDate: today,
  }
}
