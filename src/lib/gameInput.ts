/** Shared arcade input helpers — keep jumps/taps feeling instant. */

export const JUMP_KEYS = new Set([
  'Space',
  'ArrowUp',
  'KeyW',
  'Enter',
  'KeyZ',
])

export const RESTART_KEYS = new Set(['Space', 'Enter', 'KeyR', 'KeyW', 'ArrowUp'])

export function isJumpKey(code: string): boolean {
  return JUMP_KEYS.has(code)
}

export function isRestartKey(code: string): boolean {
  return RESTART_KEYS.has(code)
}

/** Map Digit1–9 / Numpad1–9 to a 0-based cell index, or null. */
export function cellFromKey(code: string): number | null {
  if (code.startsWith('Digit')) {
    const n = Number(code.slice(5))
    if (n >= 1 && n <= 9) return n - 1
  }
  if (code.startsWith('Numpad')) {
    const n = Number(code.slice(6))
    if (n >= 1 && n <= 9) return n - 1
  }
  return null
}
