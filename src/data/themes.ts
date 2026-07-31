import type { ThemeId } from '../types'

export interface ThemeDef {
  id: ThemeId
  title: string
  blurb: string
  cost: number
  /** CSS class applied to <html> */
  className: string
  preview: string
}

export const FREE_THEME: ThemeId = 'neon-blue'

export const THEMES: ThemeDef[] = [
  {
    id: 'neon-blue',
    title: 'Neon Blue',
    blurb: 'Classic Cyber Kith glow — electric blue night sky.',
    cost: 0,
    className: 'theme-neon-blue',
    preview: 'linear-gradient(135deg, #020617, #0ea5e9 55%, #22d3ee)',
  },
  {
    id: 'neon-cyan',
    title: 'Neon Cyan',
    blurb: 'Brighter cyan pulse for deep focus sessions.',
    cost: 25,
    className: 'theme-neon-cyan',
    preview: 'linear-gradient(135deg, #042f2e, #06b6d4 50%, #67e8f9)',
  },
  {
    id: 'neon-pink',
    title: 'Neon Magenta',
    blurb: 'Hot magenta neon wash with cool shadows.',
    cost: 35,
    className: 'theme-neon-pink',
    preview: 'linear-gradient(135deg, #1a0420, #db2777 50%, #f0abfc)',
  },
  {
    id: 'neon-lime',
    title: 'Neon Lime',
    blurb: 'Acid-green neon grid energy.',
    cost: 40,
    className: 'theme-neon-lime',
    preview: 'linear-gradient(135deg, #052e16, #22c55e 45%, #a3e635)',
  },
  {
    id: 'neon-violet',
    title: 'Neon Violet',
    blurb: 'Violet-blue neon aurora backdrop.',
    cost: 45,
    className: 'theme-neon-violet',
    preview: 'linear-gradient(135deg, #0f0720, #7c3aed 50%, #38bdf8)',
  },
  {
    id: 'neon-amber',
    title: 'Neon Amber',
    blurb: 'Warm amber neon against midnight blue.',
    cost: 50,
    className: 'theme-neon-amber',
    preview: 'linear-gradient(135deg, #120a02, #f59e0b 48%, #38bdf8)',
  },
  {
    id: 'cyber-grid',
    title: 'Cyber Grid',
    blurb: 'Neon blueprint grid over deep space.',
    cost: 60,
    className: 'theme-cyber-grid',
    preview: 'linear-gradient(135deg, #020617, #1d4ed8 40%, #22d3ee)',
  },
]

export function themeById(id: ThemeId): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

export const VALID_THEMES: ThemeId[] = THEMES.map((t) => t.id)
