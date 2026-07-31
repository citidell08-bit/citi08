import type { MiniGameId, Tab } from '../types'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '◎' },
  { id: 'focus', label: 'Focus', icon: '◷' },
  { id: 'cards', label: 'Cards', icon: '▤' },
  { id: 'play', label: 'Play', icon: '◈' },
  { id: 'quests', label: 'Quests', icon: '✧' },
]

const GAME_ICONS: Record<MiniGameId, { icon: string; label: string }> = {
  dash: { icon: '▶', label: 'Dash' },
  memory: { icon: '◆', label: 'Nest' },
  math: { icon: '∑', label: 'Sum' },
  glow: { icon: '◉', label: 'Glow' },
}

interface Props {
  tab: Tab
  playingGame?: MiniGameId | null
  onChange: (tab: Tab) => void
}

export function Nav({ tab, playingGame = null, onChange }: Props) {
  return (
    <nav className="nav-dock" aria-label="Main">
      {TABS.map((t) => {
        const isActive = tab === t.id
        const inGame = t.id === 'play' && playingGame != null
        const game = inGame ? GAME_ICONS[playingGame] : null
        const icon = game?.icon ?? t.icon
        const label = game?.label ?? t.label
        return (
          <button
            key={t.id}
            type="button"
            className={[
              isActive ? 'active' : '',
              inGame ? 'playing' : '',
              isActive && inGame ? 'playing-active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onChange(t.id)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={inGame ? `${label} — in game` : t.label}
          >
            <span className="nav-icon" aria-hidden="true">
              {icon}
            </span>
            <span className="nav-label">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
