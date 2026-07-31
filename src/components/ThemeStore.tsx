import type { CSSProperties } from 'react'
import { FREE_THEME, THEMES } from '../data/themes'
import type { GameState, ThemeId } from '../types'
import './ThemeStore.css'

interface Props {
  state: GameState
  onBuy: (themeId: ThemeId) => boolean
  onEquip: (themeId: ThemeId) => void
}

export function ThemeStore({ state, onBuy, onEquip }: Props) {
  const owned = new Set(state.ownedThemes)

  return (
    <div className="theme-store">
      <header>
        <h2 className="section-title">Theme store</h2>
        <p className="section-sub">
          Spend coins to unlock neon backgrounds. Neon Blue is free — equip any owned theme
          anytime.
        </p>
      </header>

      <div className="panel coin-banner">
        <div>
          <strong className="coin-balance">
            <span aria-hidden="true">◉</span> {state.coins} coins
          </strong>
          <p>Buy once, keep forever. Active theme paints the whole app backdrop.</p>
        </div>
      </div>

      <ul className="theme-grid">
        {THEMES.map((theme) => {
          const isOwned = owned.has(theme.id) || theme.id === FREE_THEME
          const isActive = state.activeTheme === theme.id
          const canAfford = state.coins >= theme.cost
          return (
            <li
              key={theme.id}
              className={`panel theme-card ${isActive ? 'active' : ''} ${isOwned ? 'owned' : ''} ${theme.legendary ? 'legendary' : ''}`}
            >
              <div
                className={`theme-preview ${theme.legendary ? 'legendary-preview' : ''}`}
                style={
                  {
                    background: theme.preview,
                    ['--preview-glow']: theme.glow,
                  } as CSSProperties
                }
                aria-hidden="true"
              />
              <div className="theme-copy">
                <em>
                  {theme.legendary ? 'Legendary · ' : ''}
                  {theme.cost === 0 ? 'Free' : `${theme.cost} coins`}
                </em>
                <strong>{theme.title}</strong>
                <p>{theme.blurb}</p>
              </div>
              {isActive ? (
                <button type="button" className="btn btn-ghost" disabled>
                  Equipped
                </button>
              ) : isOwned ? (
                <button type="button" className="btn btn-ember" onClick={() => onEquip(theme.id)}>
                  Equip
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!canAfford}
                  onClick={() => onBuy(theme.id)}
                >
                  {canAfford ? `Buy · ${theme.cost}` : `Need ${theme.cost}`}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
