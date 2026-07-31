import type { Tab } from '../types'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '◎' },
  { id: 'focus', label: 'Focus', icon: '◷' },
  { id: 'cards', label: 'Cards', icon: '▤' },
  { id: 'play', label: 'Play', icon: '◈' },
  { id: 'quests', label: 'Quests', icon: '✧' },
]

interface Props {
  tab: Tab
  onChange: (tab: Tab) => void
}

export function Nav({ tab, onChange }: Props) {
  return (
    <nav className="nav-dock" aria-label="Main">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={tab === t.id ? 'active' : ''}
          onClick={() => onChange(t.id)}
          aria-current={tab === t.id ? 'page' : undefined}
        >
          <span aria-hidden="true">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  )
}
