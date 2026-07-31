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
      'A procedural deep-space nebula — hydrogen-pink & oxygen-cyan gas, dark dust lanes, and a starfield that feels photographed from orbit.',
    cost: 320,
    className: 'theme-neon-void',
    preview:
      'radial-gradient(ellipse 55% 45% at 28% 38%, rgba(236,72,153,0.9) 0%, transparent 55%), radial-gradient(ellipse 48% 40% at 76% 22%, rgba(34,211,238,0.85) 0%, transparent 52%), radial-gradient(ellipse 60% 48% at 62% 78%, rgba(124,58,237,0.75) 0%, transparent 58%), radial-gradient(ellipse 40% 35% at 45% 55%, rgba(251,113,133,0.35) 0%, transparent 50%), radial-gradient(1.6px 1.6px at 18% 24%, #fff, transparent), radial-gradient(1.2px 1.2px at 72% 36%, #e0f2fe, transparent), radial-gradient(1px 1px at 44% 68%, #f0abfc, transparent), radial-gradient(1.4px 1.4px at 88% 70%, #fff, transparent), radial-gradient(1px 1px at 30% 80%, #fde68a, transparent), linear-gradient(168deg, #000004 0%, #050218 42%, #000008 100%)',
    glow: '#e879f9',
    legendary: true,
  },
]

export function themeById(id: ThemeId): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

export const VALID_THEMES: ThemeId[] = THEMES.map((t) => t.id)
