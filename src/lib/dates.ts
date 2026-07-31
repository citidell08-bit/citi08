export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

export function yesterdayKey(date = new Date()): string {
  const d = new Date(date)
  d.setDate(d.getDate() - 1)
  return todayKey(d)
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}
