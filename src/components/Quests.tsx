import type { GameState } from '../types'
import './Quests.css'

interface Props {
  state: GameState
}

export function Quests({ state }: Props) {
  const done = state.quests.filter((q) => q.completed).length

  return (
    <div className="quests">
      <header>
        <h2 className="section-title">Daily quests</h2>
        <p className="section-sub">
          Fresh goals each day. Earn XP and coins — then spend coins in the arcade.
        </p>
      </header>

      <div className="panel quest-summary">
        <strong>
          {done}/{state.quests.length} cleared
        </strong>
        <span>
          {state.coins} coins · Streak {state.streak}
        </span>
      </div>

      <ul className="quest-list">
        {state.quests.map((q) => {
          const ratio = Math.min(1, q.progress / q.target)
          return (
            <li key={q.id} className={`panel quest-item ${q.completed ? 'done' : ''}`}>
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
        })}
      </ul>

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
