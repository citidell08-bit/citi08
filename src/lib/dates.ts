/** Local calendar date key (avoids UTC midnight streak bugs). */
export function todayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function yesterdayKey(date = new Date()): string {
  const d = new Date(date)
  d.setDate(d.getDate() - 1)
  return todayKey(d)
}

/** ISO-like week key: YYYY-Www (Monday-start local week). */
export function weekKey(date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = (d.getDay() + 6) % 7 // Mon=0 … Sun=6
  d.setDate(d.getDate() - day + 3) // Thursday of this week
  const week1 = new Date(d.getFullYear(), 0, 4)
  const week1Day = (week1.getDay() + 6) % 7
  week1.setDate(week1.getDate() - week1Day + 3)
  const weekNo = 1 + Math.round((d.getTime() - week1.getTime()) / 604800000)
  const y = d.getFullYear()
  return `${y}-W${String(weekNo).padStart(2, '0')}`
}

/** Local month key: YYYY-MM */
export function monthKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}
