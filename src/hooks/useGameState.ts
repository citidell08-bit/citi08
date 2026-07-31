import { startTransition, useEffect, useState } from 'react'
import {
  createCustomQuest,
  generateQuestsForPeriod,
  MAX_CUSTOM_QUESTS,
  PERIOD_LABEL,
  replaceSystemQuests,
  type CustomQuestInput,
} from '../data/quests'
import { FREE_THEME, themeById, THEMES } from '../data/themes'
import { COINS_PER_ACHIEVEMENT, coinsForLevelsGained, GAME_COSTS } from '../lib/coins'
import { todayKey, uid, yesterdayKey } from '../lib/dates'
import {
  currentKeyForPeriod,
  freshQuestPeriodKeys,
  shouldResetQuestBoard,
} from '../lib/questReset'
import { levelFromXp } from '../lib/xp'
import { clearState, loadState, saveState } from '../lib/storage'
import type {
  Deck,
  Flashcard,
  GameState,
  LevelUpInfo,
  MiniGameId,
  MiniGameResult,
  Quest,
  QuestPeriod,
  ThemeId,
  Toast,
} from '../types'

const PERIODS: QuestPeriod[] = ['daily', 'weekly', 'monthly']

export function useGameState() {
  const [state, setState] = useState<GameState>(() => loadState())
  const [toasts, setToasts] = useState<Toast[]>([])
  const [levelUp, setLevelUp] = useState<LevelUpInfo | null>(null)

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    const theme = themeById(state.activeTheme)
    const root = document.documentElement
    for (const t of THEMES) root.classList.remove(t.className)
    root.classList.add(theme.className)
  }, [state.activeTheme])

  /** Flush immediately so level clears / best scores persist even if the tab closes. */
  function persist(next: GameState): GameState {
    saveState(next)
    return next
  }

  useEffect(() => {
    const refresh = () => {
      startTransition(() => {
        setState((prev) => refreshQuests(syncBrokenStreak(prev)))
      })
    }
    refresh()
    const onVis = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    // Poll so day / week / month board rollovers apply while the app is open
    const interval = window.setInterval(refresh, 30_000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVis)
    }
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

  function awardXp(
    prev: GameState,
    amount: number,
    reason: string,
    opts?: { notify?: boolean },
  ): GameState {
    const notify = opts?.notify !== false
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
      if (notify) {
        queueMicrotask(() => pushToast(reason, { xp: amount, coins: levelCoins }))
      }
    } else if (notify) {
      queueMicrotask(() => pushToast(reason, { xp: amount }))
    }

    return next
  }

  /**
   * Count a study day. Play today → streak 1; come back tomorrow → streak 2.
   * Miss a day and the streak restarts at 1 on the next activity.
   */
  function markActive(prev: GameState): GameState {
    const synced = syncBrokenStreak(prev)
    const today = todayKey()
    if (synced.lastActiveDate === today) return synced

    let streak = 1
    if (synced.lastActiveDate === yesterdayKey()) {
      streak = synced.streak + 1
    }

    queueMicrotask(() =>
      pushToast(streak === 1 ? 'Day streak: 1 — come back tomorrow!' : `Day streak: ${streak}!`),
    )

    return {
      ...synced,
      streak,
      longestStreak: Math.max(synced.longestStreak, streak),
      lastActiveDate: today,
    }
  }

  function withQuests(
    prev: GameState,
    updater: (quests: Quest[]) => Quest[],
  ): GameState {
    let quests = updater(prev.quests).map((q) => ({ ...q }))
    let next: GameState = { ...prev, quests }
    let bonusXp = 0
    let bonusCoins = 0

    for (const q of quests) {
      if (!q.completed && q.progress >= q.target) {
        q.completed = true
        bonusXp += q.xpReward
        bonusCoins += q.coinReward ?? 15
      }
    }

    if (bonusCoins > 0) {
      next = awardCoins(next, bonusCoins)
    }

    if (bonusXp > 0) {
      next = awardXp(next, bonusXp, 'Quest complete', { notify: false })
    }

    if (bonusXp > 0 || bonusCoins > 0) {
      queueMicrotask(() =>
        pushToast('Quest complete!', { xp: bonusXp || undefined, coins: bonusCoins || undefined }),
      )
    }

    const keys = { ...(next.questIssuedAt ?? freshQuestPeriodKeys()) }

    // Full system-board clear → achievements. Custom quests don't block / get wiped.
    for (const period of PERIODS) {
      const systemBoard = quests.filter((q) => q.period === period && !q.custom)
      if (systemBoard.length === 0) continue
      if (!systemBoard.every((q) => q.completed)) continue

      if (period === 'daily') {
        next = unlock(next, 'quest_clear')
        quests = replaceSystemQuests(quests, 'daily', generateQuestsForPeriod('daily'))
        keys.daily = currentKeyForPeriod('daily')
        queueMicrotask(() => pushToast('Daily board complete — fresh quests ready!'))
      } else {
        if (period === 'weekly') next = unlock(next, 'quest_week')
        if (period === 'monthly') next = unlock(next, 'quest_month')
        queueMicrotask(() =>
          pushToast(
            `${PERIOD_LABEL[period]} board complete — new set ${
              period === 'weekly' ? 'next week' : 'next month'
            }.`,
          ),
        )
      }
    }

    return { ...next, quests, questIssuedAt: keys }
  }

  function bumpQuest(
    prev: GameState,
    type: Quest['type'],
    amount: number,
  ): GameState {
    // Always apply period rollover before progress so midnight/week turns are live
    const rolled = refreshQuests(prev)
    return withQuests(rolled, (quests) =>
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

  function checkAchievements(stateSnap: GameState): GameState {
    let next = stateSnap
    const level = levelFromXp(next.xp)
    const ownedThemes = stateSnap.ownedThemes?.length ?? 1
    const paidThemes = ownedThemes - 1

    if (stateSnap.totalSessions >= 1) next = unlock(next, 'first_focus')
    if (stateSnap.totalFocusMinutes >= 60) next = unlock(next, 'hour_club')
    if (stateSnap.totalFocusMinutes >= 180) next = unlock(next, 'focus_marathon')
    if (stateSnap.totalSessions >= 10) next = unlock(next, 'deep_den')
    if (stateSnap.totalCardsReviewed >= 25) next = unlock(next, 'card_curious')
    if (stateSnap.totalCardsReviewed >= 100) next = unlock(next, 'card_scholar')
    if (stateSnap.streak >= 3) next = unlock(next, 'streak_3')
    if (stateSnap.streak >= 7) next = unlock(next, 'streak_7')
    if (stateSnap.streak >= 14) next = unlock(next, 'streak_14')
    if (level >= 5) next = unlock(next, 'level_5')
    if (level >= 10) next = unlock(next, 'level_10')
    if (stateSnap.decks.some((d) => !d.id.startsWith('deck_sample'))) {
      next = unlock(next, 'deck_maker')
    }
    if (stateSnap.totalCoinsEarned >= 250) next = unlock(next, 'coin_pocket')
    if (stateSnap.totalCoinsEarned >= 500) next = unlock(next, 'coin_hoard')
    if (paidThemes >= 1) next = unlock(next, 'theme_shopper')
    if (ownedThemes >= 4) next = unlock(next, 'theme_collector')
    if (stateSnap.totalGamesPlayed >= 1) next = unlock(next, 'first_game')
    if (stateSnap.totalGamesWon >= 5) next = unlock(next, 'arcade_five')
    if (stateSnap.totalGamesWon >= 20) next = unlock(next, 'arcade_twenty')
    if (stateSnap.ownedGames.length >= 4) next = unlock(next, 'full_cabinet')
    if (stateSnap.bestMemoryMoves != null && stateSnap.bestMemoryMoves <= 16) {
      next = unlock(next, 'memory_sharp')
    }
    if (stateSnap.bestDashScore >= 120) next = unlock(next, 'dash_runner')
    if (stateSnap.bestDashScore >= 200) next = unlock(next, 'dash_ace')
    if (stateSnap.bestMathScore >= 12) next = unlock(next, 'math_ace')
    if (stateSnap.bestGlowScore >= 10) next = unlock(next, 'glow_sharp')

    const hasDaily = next.achievements.some((a) => a.id === 'quest_clear' && a.unlockedAt)
    const hasWeekly = next.achievements.some((a) => a.id === 'quest_week' && a.unlockedAt)
    const hasMonthly = next.achievements.some((a) => a.id === 'quest_month' && a.unlockedAt)
    if (hasDaily && hasWeekly && hasMonthly) next = unlock(next, 'quest_trinity')

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
      return persist(next)
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
      return persist(next)
    })
  }

  /** Buy a game once; if already owned, play is free. */
  function spendCoinsForGame(gameId: MiniGameId): boolean {
    let allowed = false
    setState((prev) => {
      if (prev.ownedGames.includes(gameId)) {
        allowed = true
        return prev
      }
      const cost = GAME_COSTS[gameId]
      if (prev.coins < cost) {
        allowed = false
        return prev
      }
      allowed = true
      queueMicrotask(() => pushToast('Game unlocked', { coins: -cost }))
      const next = {
        ...prev,
        coins: prev.coins - cost,
        ownedGames: [...prev.ownedGames, gameId],
      }
      return persist(checkAchievements(next))
    })
    return allowed
  }

  function buyTheme(themeId: ThemeId): boolean {
    let allowed = false
    setState((prev) => {
      if (prev.ownedThemes.includes(themeId) || themeId === FREE_THEME) {
        allowed = true
        return persist({ ...prev, activeTheme: themeId })
      }
      const theme = themeById(themeId)
      if (prev.coins < theme.cost) {
        allowed = false
        return prev
      }
      allowed = true
      queueMicrotask(() => pushToast(`${theme.title} unlocked`, { coins: -theme.cost }))
      const next = {
        ...prev,
        coins: prev.coins - theme.cost,
        ownedThemes: [...prev.ownedThemes, themeId],
        activeTheme: themeId,
      }
      return persist(checkAchievements(next))
    })
    return allowed
  }

  function equipTheme(themeId: ThemeId) {
    setState((prev) => {
      if (!prev.ownedThemes.includes(themeId) && themeId !== FREE_THEME) return prev
      const theme = themeById(themeId)
      queueMicrotask(() => pushToast(`${theme.title} equipped`))
      return persist({ ...prev, activeTheme: themeId })
    })
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
        bestDashScore:
          result.gameId === 'dash'
            ? Math.max(next.bestDashScore, result.score)
            : next.bestDashScore,
      }
      const pickup = Math.max(0, result.coinsEarned ?? 0)
      const winBonus = result.won ? 5 : 0
      const coinGain = pickup + winBonus
      if (coinGain > 0) {
        next = awardCoins(next, coinGain)
      }
      next = awardXp(next, result.xp, result.label, { notify: false })
      queueMicrotask(() =>
        pushToast(
          pickup > 0 ? `${result.label} · +${pickup} ◉ grabbed` : result.label,
          {
            xp: result.xp,
            coins: coinGain > 0 ? coinGain : undefined,
          },
        ),
      )
      next = bumpQuest(next, 'games_played', 1)
      next = checkAchievements(next)
      return persist(next)
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
      next = checkAchievements(next)
      return persist(next)
    })
  }

  function renameCompanion(name: string) {
    setState((prev) =>
      persist({
        ...prev,
        companionName: name.trim() || prev.companionName,
      }),
    )
  }

  function addCustomQuest(input: CustomQuestInput): boolean {
    let ok = false
    setState((prev) => {
      const customCount = prev.quests.filter((q) => q.custom).length
      if (customCount >= MAX_CUSTOM_QUESTS) {
        queueMicrotask(() =>
          pushToast(`Custom quest limit reached (${MAX_CUSTOM_QUESTS}).`),
        )
        return prev
      }
      if (!input.title.trim()) {
        queueMicrotask(() => pushToast('Give your quest a title.'))
        return prev
      }
      ok = true
      const quest = createCustomQuest(input)
      queueMicrotask(() => pushToast(`Quest added: ${quest.title}`))
      return persist({ ...prev, quests: [...prev.quests, quest] })
    })
    return ok
  }

  function removeCustomQuest(id: string) {
    setState((prev) => {
      const target = prev.quests.find((q) => q.id === id)
      if (!target?.custom) return prev
      queueMicrotask(() => pushToast('Custom quest removed'))
      return persist({
        ...prev,
        quests: prev.quests.filter((q) => q.id !== id),
      })
    })
  }

  /** Mark a manual custom quest complete (or bump progress to target). */
  function completeManualQuest(id: string) {
    setState((prev) => {
      const rolled = refreshQuests(prev)
      const quest = rolled.quests.find((q) => q.id === id)
      if (!quest || !quest.custom || quest.completed || quest.type !== 'manual') {
        return rolled === prev ? prev : persist(rolled)
      }
      return persist(
        withQuests(rolled, (quests) =>
          quests.map((q) =>
            q.id === id ? { ...q, progress: q.target } : q,
          ),
        ),
      )
    })
  }

  function dismissLevelUp() {
    setLevelUp(null)
  }

  /** Wipe coins, XP, games, quests — full new-player save on this device. */
  function resetProgress() {
    const fresh = clearState()
    setToasts([])
    setLevelUp(null)
    setState(fresh)
  }

  return {
    state,
    toasts,
    levelUp,
    completeFocusSession,
    reviewCard,
    spendCoinsForGame,
    buyTheme,
    equipTheme,
    completeMiniGame,
    createDeck,
    renameCompanion,
    addCustomQuest,
    removeCustomQuest,
    completeManualQuest,
    dismissLevelUp,
    resetProgress,
  }
}

/** Zero a broken streak if the player skipped a full calendar day. */
export function syncBrokenStreak(state: GameState): GameState {
  if (!state.lastActiveDate) {
    return state.streak === 0 ? state : { ...state, streak: 0 }
  }
  const today = todayKey()
  const yesterday = yesterdayKey()
  if (state.lastActiveDate === today || state.lastActiveDate === yesterday) {
    return state
  }
  if (state.streak === 0) return state
  return { ...state, streak: 0 }
}

/** Roll boards when the calendar day / week / month changes (or if a board is missing). */
export function refreshQuests(state: GameState): GameState {
  const date = new Date()
  let quests = [...state.quests]
  const keys = { ...(state.questIssuedAt ?? freshQuestPeriodKeys(date)) }
  let changed = false

  for (const period of PERIODS) {
    const hasSystem = quests.some((q) => q.period === period && !q.custom)
    const stored = typeof keys[period] === 'string' ? keys[period] : undefined
    if (!hasSystem || shouldResetQuestBoard(stored, period, date)) {
      quests = replaceSystemQuests(
        quests,
        period,
        generateQuestsForPeriod(period),
        { resetCustomProgress: shouldResetQuestBoard(stored, period, date) },
      )
      keys[period] = currentKeyForPeriod(period, date)
      changed = true
    }
  }

  if (!changed) return state
  return { ...state, quests, questIssuedAt: keys }
}
