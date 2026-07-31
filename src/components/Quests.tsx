import { useEffect, useState } from 'react'
import { PERIOD_LABEL } from '../data/quests'
import {
  formatResetCountdown,
  msUntilQuestReset,
  QUEST_RESET_MS,
} from '../lib/questReset'
import type { GameState, Quest, QuestPeriod } from '../types'
import './Quests.css'

interface Props {
  state: GameState
}

const PERIOD_ORDER: QuestPeriod[] = ['daily', 'weekly', 'monthly']

const PERIOD_BLURB: Record<QuestPeriod, string> = {
  daily: 'Quick goals. Finish one and it resets into a fresh daily after a short beat.',
  weekly: 'Bigger mid-tier goals. Finish them all to refresh, or let the hour timer roll.',
  monthly: 'Long-haul challenges. Clear the set or wait ~1 hour for a new board.',
}

function QuestCard({ q }: { q: Quest }) {
  const ratio = Math.min(1, q.progress / q.target)
  return (
    <li className={`panel quest-item ${q.completed ? 'done' : ''}`}>
      <div className="quest-top">
        <div className="quest-copy">
          <strong>{q.title}</strong>
          <p>{q.description}</p>
        </div>
        <div className="quest-side">
          {q.completed ? (
            <span className="quest-complete-badge">Complete</span>
          ) : (
            <em>
              +{q.xpReward} XP · +{q.coinReward} ◉
            </em>
          )}
        </div>
      </div>
      <div className={`xp-track ${q.completed ? 'done' : ''}`} aria-hidden="true">
        <div className="xp-fill" style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="quest-meta">
        <span>
          {Math.min(q.progress, q.target)}/{q.target}
        </span>
        <span className={q.completed ? 'quest-status-done' : ''}>
          {q.completed
            ? q.period === 'daily'
              ? '✓ Complete — resetting…'
              : '✓ Complete — saved'
            : 'In progress'}
        </span>
      </div>
    </li>
  )
}

export function Quests({ state }: Props) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const byPeriod = (period: QuestPeriod) => state.quests.filter((q) => q.period === period)
  const totalDone = state.quests.filter((q) => q.completed).length
  const soonestMs = Math.min(
    ...PERIOD_ORDER.map((p) => msUntilQuestReset(state.questIssuedAt?.[p] ?? now, now)),
  )

  return (
    <div className="quests">
      <header>
        <h2 className="section-title">Quest boards</h2>
        <p className="section-sub">
          Daily quests reset into new ones when you complete them. Weekly and monthly boards
          refresh when you clear the whole set — or wait about an hour.
        </p>
      </header>

      <div className="panel quest-summary">
        <div>
          <strong>
            {totalDone}/{state.quests.length} active clears
          </strong>
          <p className="quest-timer-line">
            Next auto-reset in <strong>{formatResetCountdown(soonestMs)}</strong>
            <span> · {Math.round(QUEST_RESET_MS / 60000)} min cycle</span>
          </p>
        </div>
        <span>
          {state.coins} coins · Streak {state.streak}
        </span>
      </div>

      {PERIOD_ORDER.map((period) => {
        const list = byPeriod(period)
        if (list.length === 0) return null
        const done = list.filter((q) => q.completed).length
        const left = msUntilQuestReset(state.questIssuedAt?.[period] ?? now, now)
        return (
          <section key={period} className="quest-period">
            <div className="quest-period-head">
              <div>
                <h3 className="quest-period-title">{PERIOD_LABEL[period]} quests</h3>
                <p className="section-sub">{PERIOD_BLURB[period]}</p>
              </div>
              <div className="quest-period-badges">
                <span className="quest-period-count">
                  {done}/{list.length}
                </span>
                <span className="quest-period-timer" title="Time until this board auto-resets">
                  ⟳ {formatResetCountdown(left)}
                </span>
              </div>
            </div>
            <ul className="quest-list">
              {list.map((q) => (
                <QuestCard key={q.id} q={q} />
              ))}
            </ul>
          </section>
        )
      })}

      <section className="panel recent-xp">
        <h3 className="section-title" style={{ fontSize: '1.2rem' }}>
          Recent XP
        </h3>
        {state.xpHistory.length === 0 ? (
          <p className="section-sub">Complete a focus session or review cards to start earning.</p>
        ) : (
          <ul>
            {state.xpHistory.slice(0, 8).map((e) => (
              <li key={e.id}>
                <span className="amt">+{e.amount}</span>
                <span>{e.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
