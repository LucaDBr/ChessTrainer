import { useCallback, useEffect, useState } from 'react'
import type { Line, LineProgress } from './types'

const STORAGE_KEY = 'chesstrainer:v1'

type StoredState = {
  progress: Record<string, LineProgress>
  customLines: Line[]
}

const emptyState: StoredState = { progress: {}, customLines: [] }

function load(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...emptyState, ...JSON.parse(raw) } : emptyState
  } catch {
    return emptyState
  }
}

// Abstände in Tagen pro Leitner-Box (Index = Box nach erfolgreicher Wiederholung).
const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30, 60, 120]
const DAY_MS = 24 * 60 * 60 * 1000

export function nextProgress(prev: LineProgress | undefined, mistakes: number, now = Date.now()): LineProgress {
  const base = prev ?? { box: 0, due: now, reps: 0, lapses: 0 }
  if (mistakes > 0) {
    // Fehler: zurück in Box 1, morgen wieder fällig.
    return { box: 1, due: now + DAY_MS, reps: base.reps + 1, lapses: base.lapses + 1 }
  }
  const box = Math.min(base.box + 1, INTERVAL_DAYS.length - 1)
  return { box, due: now + INTERVAL_DAYS[box] * DAY_MS, reps: base.reps + 1, lapses: base.lapses }
}

export function isDue(progress: LineProgress | undefined, now = Date.now()): boolean {
  return !progress || progress.due <= now
}

export function useStoredState() {
  const [state, setState] = useState<StoredState>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const recordResult = useCallback((lineId: string, mistakes: number) => {
    setState((s) => ({
      ...s,
      progress: { ...s.progress, [lineId]: nextProgress(s.progress[lineId], mistakes) },
    }))
  }, [])

  const addCustomLine = useCallback((line: Line) => {
    setState((s) => ({ ...s, customLines: [...s.customLines, line] }))
  }, [])

  const removeCustomLine = useCallback((lineId: string) => {
    setState((s) => {
      const { [lineId]: _removed, ...progress } = s.progress
      return { progress, customLines: s.customLines.filter((l) => l.id !== lineId) }
    })
  }, [])

  const resetProgress = useCallback(() => {
    setState((s) => ({ ...s, progress: {} }))
  }, [])

  return { ...state, recordResult, addCustomLine, removeCustomLine, resetProgress }
}
