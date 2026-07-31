import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  MAX_CUSTOM_QUESTS,
  PERIOD_LABEL,
  QUEST_TYPE_LABEL,
  type CustomQuestInput,
} from '../data/quests'
import {
  formatResetCountdown,
  msUntilPeriodReset,
  PERIOD_RESET_HINT,
} from '../lib/questReset'
import type { GameState, Quest, QuestPeriod, QuestType } from '../types'
import './Quests.css'

interface Props {
  state: GameState
  onAddCustom: (input: CustomQuestInput) => boolean
  onRemoveCustom: (id: string) => void
  onCompleteManual: (id: string) => void
}

const PERIOD_ORDER: QuestPeriod[] = ['daily', 'weekly', 'monthly']

const PERIOD_BLURB: Record<QuestPeriod, string> = {
  daily: 'Quick goals for today. Clear them all for a fresh board — also resets at midnight.',
  weekly: 'Bigger mid-tier goals. Fresh board every Monday.',
  monthly: 'Long-haul challenges. Fresh board on the 1st of each month.',
}

const TYPE_OPTIONS: QuestType[] = [
  'focus_minutes',
  'cards_reviewed',
  'sessions',
  'games_played',
  'manual',
]

const DEFAULT_TARGETS: Record<QuestType, number> = {
  focus_minutes: 20,
  cards_reviewed: 8,
  sessions: 1,
  games_played: 2,
  manual: 1,
}

function QuestCard({
  q,
  onRemoveCustom,
  onCompleteManual,
}: {
  q: Quest
  onRemoveCustom: (id: string) => void
  onCompleteManual: (id: string) => void
}) {
  const ratio = Math.min(1, q.progress / q.target)
  return (
    <li className={`panel quest-item ${q.completed ? 'done' : ''} ${q.custom ? 'custom' : ''}`}>
      <div className="quest-top">
        <div className="quest-copy">
          <strong>
            {q.title}
            {q.custom ? <span className="quest-custom-tag">Yours</span> : null}
          </strong>
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
          {q.type !== 'manual' ? ` · ${QUEST_TYPE_LABEL[q.type]}` : ''}
        </span>
        <span className={q.completed ? 'quest-status-done' : ''}>
          {q.completed ? '✓ Complete' : 'In progress'}
        </span>
      </div>
      {q.custom && (
        <div className="quest-actions">
          {q.type === 'manual' && !q.completed && (
            <button
              type="button"
              className="btn btn-ember"
              onClick={() => onCompleteManual(q.id)}
            >
              Mark done
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost quest-remove-btn"
            onClick={() => {
              if (window.confirm(`Remove “${q.title}”?`)) onRemoveCustom(q.id)
            }}
          >
            Remove
          </button>
        </div>
      )}
    </li>
  )
}

export function Quests({ state, onAddCustom, onRemoveCustom, onCompleteManual }: Props) {
  const [now, setNow] = useState(() => Date.now())
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<QuestType>('focus_minutes')
  const [period, setPeriod] = useState<QuestPeriod>('daily')
  const [target, setTarget] = useState(String(DEFAULT_TARGETS.focus_minutes))

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const customCount = useMemo(
    () => state.quests.filter((q) => q.custom).length,
    [state.quests],
  )

  const byPeriod = (p: QuestPeriod) => state.quests.filter((q) => q.period === p)
  const systemQuests = state.quests.filter((q) => !q.custom)
  const totalDone = systemQuests.filter((q) => q.completed).length
  const soonestMs = Math.min(...PERIOD_ORDER.map((p) => msUntilPeriodReset(p, now)))
  const soonestPeriod =
    PERIOD_ORDER.find((p) => msUntilPeriodReset(p, now) === soonestMs) ?? 'daily'

  function resetForm() {
    setTitle('')
    setDescription('')
    setType('focus_minutes')
    setPeriod('daily')
    setTarget(String(DEFAULT_TARGETS.focus_minutes))
  }

  function submitCustom(e: FormEvent) {
    e.preventDefault()
    const ok = onAddCustom({
      title,
      description,
      type,
      period,
      target: Number(target) || DEFAULT_TARGETS[type],
    })
    if (ok) {
      resetForm()
      setShowForm(false)
    }
  }

  function toggleForm() {
    setShowForm((v) => {
      const next = !v
      if (next) {
        queueMicrotask(() => {
          document.getElementById('quest-create-form')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        })
      }
      return next
    })
  }

  const canAdd = customCount < MAX_CUSTOM_QUESTS

  return (
    <div className="quests">
      <header className="quests-header">
        <div>
          <h2 className="section-title">Quest boards</h2>
          <p className="section-sub">
            Finish every daily quest for a new set right away. Add your own goals anytime — they
            stick around through board refreshes.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ember quest-add-btn"
          onClick={toggleForm}
          disabled={!showForm && !canAdd}
        >
          {showForm ? 'Close form' : '+ Add my quest'}
        </button>
      </header>

      {showForm && (
        <form
          id="quest-create-form"
          className="panel quest-create"
          onSubmit={submitCustom}
        >
          <h3 className="quest-create-title">Create a quest</h3>
          <p className="section-sub">
            {customCount}/{MAX_CUSTOM_QUESTS} custom slots used. Track study/play, or mark it done
            yourself.
          </p>

          <label className="quest-field">
            <span>Title</span>
            <input
              className="field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={48}
              placeholder="e.g. Night review"
              required
              autoFocus
            />
          </label>

          <label className="quest-field">
            <span>Note (optional)</span>
            <input
              className="field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={140}
              placeholder="What does finishing look like?"
            />
          </label>

          <div className="quest-create-grid">
            <label className="quest-field">
              <span>Track</span>
              <select
                className="field"
                value={type}
                onChange={(e) => {
                  const next = e.target.value as QuestType
                  setType(next)
                  setTarget(String(DEFAULT_TARGETS[next]))
                }}
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {QUEST_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </label>

            <label className="quest-field">
              <span>Board</span>
              <select
                className="field"
                value={period}
                onChange={(e) => setPeriod(e.target.value as QuestPeriod)}
              >
                {PERIOD_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {PERIOD_LABEL[p]}
                  </option>
                ))}
              </select>
            </label>

            <label className="quest-field">
              <span>Target</span>
              <input
                className="field"
                type="number"
                min={1}
                value={type === 'manual' ? 1 : target}
                disabled={type === 'manual'}
                onChange={(e) => setTarget(e.target.value)}
              />
            </label>
          </div>

          <div className="quest-create-actions">
            <button type="submit" className="btn btn-ember" disabled={!title.trim()}>
              Add quest
            </button>
          </div>
        </form>
      )}

      <div className="panel quest-summary">
        <div>
          <strong>
            {totalDone}/{systemQuests.length} board cleared
          </strong>
          <p className="quest-timer-line">
            Next board reset ({PERIOD_LABEL[soonestPeriod].toLowerCase()}) in{' '}
            <strong>{formatResetCountdown(soonestMs)}</strong>
            {customCount > 0 ? ` · ${customCount} custom` : ''}
          </p>
        </div>
        <div className="quest-streak-block" aria-label={`Day streak ${state.streak}`}>
          <strong>{state.streak}</strong>
          <span>Day streak</span>
          {state.longestStreak > 0 ? (
            <em>Best {state.longestStreak}</em>
          ) : (
            <em>Play today to start</em>
          )}
        </div>
      </div>

      {!showForm && (
        <button
          type="button"
          className="btn btn-ember quest-add-banner"
          onClick={toggleForm}
          disabled={!canAdd}
        >
          {canAdd ? '+ Add my own quest' : `Custom limit reached (${MAX_CUSTOM_QUESTS})`}
        </button>
      )}

      {PERIOD_ORDER.map((p) => {
        const list = byPeriod(p)
        if (list.length === 0) return null
        const system = list.filter((q) => !q.custom)
        const done = system.filter((q) => q.completed).length
        const left = msUntilPeriodReset(p, now)
        return (
          <section key={p} className="quest-period">
            <div className="quest-period-head">
              <div>
                <h3 className="quest-period-title">{PERIOD_LABEL[p]} quests</h3>
                <p className="section-sub">{PERIOD_BLURB[p]}</p>
              </div>
              <div className="quest-period-badges">
                <span className="quest-period-count">
                  {done}/{system.length || list.length}
                </span>
                <span className="quest-period-timer" title={PERIOD_RESET_HINT[p]}>
                  ⟳ {formatResetCountdown(left)}
                </span>
              </div>
            </div>
            <ul className="quest-list">
              {list.map((q) => (
                <QuestCard
                  key={q.id}
                  q={q}
                  onRemoveCustom={onRemoveCustom}
                  onCompleteManual={onCompleteManual}
                />
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

      <div className="quest-add-dock" aria-hidden={showForm}>
        <button
          type="button"
          className="btn btn-ember quest-add-dock-btn"
          onClick={toggleForm}
          disabled={!showForm && !canAdd}
        >
          {showForm ? 'Close form' : '+ Add quest'}
        </button>
      </div>
    </div>
  )
}
