import { startTransition, useEffect, useState } from 'react'
import { generateDailyQuests } from '../data/quests'
import { todayKey, uid, yesterdayKey } from '../lib/dates'
import { levelFromXp } from '../lib/xp'
import { createInitialState, loadState, saveState } from '../lib/storage'
import type { Deck, Flashcard, GameState, Quest, Toast } from '../types'

export function useGameState() {
  const [state, setState] = useState<GameState>(() => loadState())
  const [toasts, setToasts] = useState<Toast[]>([])
  const [levelUp, setLevelUp] = useState<number | null>(null)

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    startTransition(() => {
      setState((prev) => refreshDaily(prev))
    })
  }, [])

  function pushToast(message: string, xp?: number) {
    const toast: Toast = { id: uid('toast'), message, xp }
    setToasts((t) => [...t, toast])
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== toast.id))
    }, 2800)
  }

  function awardXp(prev: GameState, amount: number, reason: string): GameState {
    const before = levelFromXp(prev.xp)
    const nextXp = prev.xp + amount
    const after = levelFromXp(nextXp)
    if (after > before) {
      queueMicrotask(() => setLevelUp(after))
    }
    queueMicrotask(() => pushToast(reason, amount))
    return {
      ...prev,
      xp: nextXp,
      xpHistory: [
        { id: uid('xp'), amount, reason, at: new Date().toISOString() },
        ...prev.xpHistory,
      ].slice(0, 40),
    }
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

    for (const q of quests) {
      if (!q.completed && q.progress >= q.target) {
        q.completed = true
        bonusXp += q.xpReward
      }
    }

    if (bonusXp > 0) {
      next = awardXp(next, bonusXp, 'Quest reward')
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
    if (wasLocked) {
      const newly = achievements.find((a) => a.id === id)
      if (newly) {
        queueMicrotask(() => pushToast(`Achievement: ${newly.title}`))
      }
    }
    return { ...prev, achievements }
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
