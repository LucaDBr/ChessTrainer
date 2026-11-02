import type { LineProgress } from './types'

// Abstände in Tagen pro Leitner-Box (Index = Box nach erfolgreicher Wiederholung).
const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30, 60, 120]
const DAY_MS = 24 * 60 * 60 * 1000

export function nextProgress(prev: LineProgress | undefined, correct: boolean, now = Date.now()): LineProgress {
  const base = prev ?? { box: 0, due: now, reps: 0, lapses: 0 }
  if (!correct) {
    // Fehler: zurück in Box 1, morgen wieder fällig.
    return { box: 1, due: now + DAY_MS, reps: base.reps + 1, lapses: base.lapses + 1 }
  }
  const box = Math.min(base.box + 1, INTERVAL_DAYS.length - 1)
  return { box, due: now + INTERVAL_DAYS[box] * DAY_MS, reps: base.reps + 1, lapses: base.lapses }
}

export function isDue(progress: LineProgress | undefined, now = Date.now()): boolean {
  return !progress || progress.due <= now
}
