import type { ThemeId } from '../types'

export interface ThemeDef {
  id: ThemeId
  title: string
  blurb: string
  cost: number
  /** CSS class applied to <html> */
  className: string
  preview: string
  /** Hex used for store preview bloom */
  glow: string
  /** Ultra-premium store treatment */
  legendary?: boolean
}

export const FREE_THEME: ThemeId = 'neon-blue'

export const THEMES: ThemeDef[] = [
  {
    id: 'neon-blue',
    title: 'Neon Blue',
    blurb: 'Classic Cyber Kith glow — electric blue night sky that really lights up.',
    cost: 0,
    className: 'theme-neon-blue',
    preview: 'linear-gradient(135deg, #020617, #0ea5e9 45%, #22d3ee 78%, #e0f2fe)',
    glow: '#38bdf8',
  },
  {
    id: 'neon-cyan',
    title: 'Neon Cyan',
    blurb: 'Brighter cyan pulse — deep focus with a hard neon shine.',
    cost: 25,
    className: 'theme-neon-cyan',
    preview: 'linear-gradient(135deg, #042f2e, #06b6d4 42%, #67e8f9 75%, #ecfeff)',
    glow: '#67e8f9',
  },
  {
    id: 'neon-pink',
    title: 'Neon Magenta',
    blurb: 'Hot magenta neon tubes with cool violet shadows.',
    cost: 35,
    className: 'theme-neon-pink',
    preview: 'linear-gradient(135deg, #1a0420, #db2777 42%, #f0abfc 75%, #fdf4ff)',
    glow: '#f472b6',
  },
  {
    id: 'neon-lime',
    title: 'Neon Lime',
    blurb: 'Acid-green neon energy that pops off the dark.',
    cost: 40,
    className: 'theme-neon-lime',
    preview: 'linear-gradient(135deg, #052e16, #22c55e 40%, #a3e635 72%, #f7fee7)',
    glow: '#a3e635',
  },
  {
    id: 'neon-violet',
    title: 'Neon Violet',
    blurb: 'Violet-blue aurora with a bright neon bloom.',
    cost: 45,
    className: 'theme-neon-violet',
    preview: 'linear-gradient(135deg, #0f0720, #7c3aed 42%, #38bdf8 75%, #f5f3ff)',
    glow: '#a78bfa',
  },
  {
    id: 'neon-amber',
    title: 'Neon Amber',
    blurb: 'Warm amber neon against midnight — like shop-sign glow.',
    cost: 50,
    className: 'theme-neon-amber',
    preview: 'linear-gradient(135deg, #120a02, #f59e0b 42%, #fde68a 70%, #38bdf8)',
    glow: '#fbbf24',
  },
  {
    id: 'cyber-grid',
    title: 'Cyber Grid',
    blurb: 'Blueprint grid with sweeping neon scan light.',
    cost: 60,
    className: 'theme-cyber-grid',
    preview: 'linear-gradient(135deg, #020617, #1d4ed8 38%, #22d3ee 70%, #e0f2fe)',
    glow: '#22d3ee',
  },
  {
    id: 'neon-void',
    title: 'Neon Void',
    blurb:
      'Outer-space neon nebula — drifting stars, magenta/cyan gas clouds, deep-void bloom. The ultimate skin.',
    cost: 320,
    className: 'theme-neon-void',
    preview:
      'radial-gradient(circle at 20% 30%, #f0abfc 0%, transparent 28%), radial-gradient(circle at 80% 20%, #22d3ee 0%, transparent 32%), radial-gradient(circle at 60% 75%, #7c3aed 0%, transparent 40%), linear-gradient(160deg, #02010a, #0b0520 45%, #020617)',
    glow: '#e879f9',
    legendary: true,
  },
]

export function themeById(id: ThemeId): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

export const VALID_THEMES: ThemeId[] = THEMES.map((t) => t.id)
