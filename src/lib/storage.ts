import { useCallback, useEffect, useState } from 'react'
import { builtinLines } from '../data/repertoires'
import { addLine, cardId } from './repertoire'
import { nextProgress } from './srs'
import type { Color, LineProgress, Repertoire, Settings } from './types'

const STORAGE_KEY = 'chesstrainer:v2'

type StoredState = {
  repertoires: Repertoire[]
  progress: Record<string, LineProgress>
  settings: Settings
}

export const defaultSettings: Settings = {
  source: 'lichess',
  ratings: [1400, 1600, 1800, 2000],
  speeds: ['blitz', 'rapid', 'classical'],
  maxDepth: 10,
  minShare: 0.03,
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** Baut die eingebauten Linien zu Repertoires zusammen (einmalig beim ersten Start). */
function seedRepertoires(): Repertoire[] {
  const byName = new Map<string, Repertoire>()
  for (const line of builtinLines) {
    const rep = byName.get(line.repertoire) ?? {
      id: slug(line.repertoire),
      name: line.repertoire,
      color: line.color,
      userMoves: {},
      opponentMoves: {},
    }
    byName.set(line.repertoire, addLine(rep, line.moves))
  }
  return [...byName.values()]
}

function load(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoredState
      return { ...parsed, settings: { ...defaultSettings, ...parsed.settings } }
    }
  } catch {
    // kaputte Daten: neu anfangen
  }
  return { repertoires: seedRepertoires(), progress: {}, settings: defaultSettings }
}

export function useStoredState() {
  const [state, setState] = useState<StoredState>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const updateRepertoire = useCallback((id: string, update: (rep: Repertoire) => Repertoire) => {
    setState((s) => ({ ...s, repertoires: s.repertoires.map((r) => (r.id === id ? update(r) : r)) }))
  }, [])

  const setUserMove = useCallback(
    (repId: string, key: string, san: string) =>
      updateRepertoire(repId, (r) => ({ ...r, userMoves: { ...r.userMoves, [key]: san } })),
    [updateRepertoire],
  )

  const addOpponentMove = useCallback(
    (repId: string, key: string, san: string) =>
      updateRepertoire(repId, (r) =>
        r.opponentMoves[key]?.includes(san)
          ? r
          : { ...r, opponentMoves: { ...r.opponentMoves, [key]: [...(r.opponentMoves[key] ?? []), san] } },
      ),
    [updateRepertoire],
  )

  const recordCard = useCallback((repId: string, key: string, correct: boolean) => {
    setState((s) => {
      const id = cardId(repId, key)
      return { ...s, progress: { ...s.progress, [id]: nextProgress(s.progress[id], correct) } }
    })
  }, [])

  const createRepertoire = useCallback((name: string, color: Color): string => {
    const id = `${slug(name) || 'repertoire'}-${Date.now()}`
    setState((s) => ({
      ...s,
      repertoires: [...s.repertoires, { id, name, color, userMoves: {}, opponentMoves: {} }],
    }))
    return id
  }, [])

  const importLine = useCallback(
    (repId: string, moves: string[]) => updateRepertoire(repId, (r) => addLine(r, moves)),
    [updateRepertoire],
  )

  const deleteRepertoire = useCallback((repId: string) => {
    setState((s) => ({
      ...s,
      repertoires: s.repertoires.filter((r) => r.id !== repId),
      progress: Object.fromEntries(Object.entries(s.progress).filter(([id]) => !id.startsWith(`${repId}|`))),
    }))
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  }, [])

  const resetProgress = useCallback(() => {
    setState((s) => ({ ...s, progress: {} }))
  }, [])

  return {
    ...state,
    setUserMove,
    addOpponentMove,
    recordCard,
    createRepertoire,
    importLine,
    deleteRepertoire,
    updateSettings,
    resetProgress,
  }
}

export type Store = ReturnType<typeof useStoredState>
