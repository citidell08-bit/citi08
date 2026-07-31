import { PERIOD_LABEL } from '../data/quests'
import type { GameState, Quest, QuestPeriod } from '../types'
import './Quests.css'

interface Props {
  state: GameState
}

const PERIOD_ORDER: QuestPeriod[] = ['daily', 'weekly', 'monthly']

const PERIOD_BLURB: Record<QuestPeriod, string> = {
  daily: 'Resets each day — or instantly when you clear the whole board.',
  weekly: 'Bigger goals for the week. Clears and refreshes when you finish them all.',
  monthly: 'Long-haul challenges. Clear the set to roll a new month board early.',
}

function QuestCard({ q }: { q: Quest }) {
  const ratio = Math.min(1, q.progress / q.target)
  return (
    <li className={`panel quest-item ${q.completed ? 'done' : ''}`}>
      <div className="quest-top">
        <div>
          <strong>{q.title}</strong>
          <p>{q.description}</p>
        </div>
        <em>
          +{q.xpReward} XP · +{q.coinReward} ◉
        </em>
      </div>
      <div className="xp-track" aria-hidden="true">
        <div className="xp-fill" style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="quest-meta">
        <span>
          {Math.min(q.progress, q.target)}/{q.target}
        </span>
        <span>{q.completed ? 'Complete' : 'In progress'}</span>
      </div>
    </li>
  )
}

export function Quests({ state }: Props) {
  const byPeriod = (period: QuestPeriod) => state.quests.filter((q) => q.period === period)
  const totalDone = state.quests.filter((q) => q.completed).length

  return (
    <div className="quests">
      <header>
        <h2 className="section-title">Quest boards</h2>
        <p className="section-sub">
          Daily, weekly, and monthly goals. Finish a whole board and it resets with a fresh set —
          plus new boards arrive on each period boundary.
        </p>
      </header>

      <div className="panel quest-summary">
        <strong>
          {totalDone}/{state.quests.length} active clears
        </strong>
        <span>
          {state.coins} coins · Streak {state.streak}
        </span>
      </div>

      {PERIOD_ORDER.map((period) => {
        const list = byPeriod(period)
        if (list.length === 0) return null
        const done = list.filter((q) => q.completed).length
        return (
          <section key={period} className="quest-period">
            <div className="quest-period-head">
              <div>
                <h3 className="quest-period-title">{PERIOD_LABEL[period]} quests</h3>
                <p className="section-sub">{PERIOD_BLURB[period]}</p>
              </div>
              <span className="quest-period-count">
                {done}/{list.length}
              </span>
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
