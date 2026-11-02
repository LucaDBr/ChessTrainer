import { useEffect, useState } from 'react'
import { cachedEval, fetchCloudEval, hasCachedEval, type CloudEval } from './cloudEval'
import { cachedExplorer, fetchExplorer, type ExplorerResult } from './explorer'
import { LichessError } from './lichessQueue'
import type { Settings } from './types'

type Loaded<T> = { key: string; data: T | null; error: string | null }

export type DataState<T> = { data: T | null; loading: boolean; error: string | null }

/** Explorer-Daten für eine Stellung (nur mit Lichess-Login). */
export function useExplorer(
  fen: string,
  settings: Settings,
  token: string | null,
  onAuthError: () => void,
): DataState<ExplorerResult> {
  const { source, ratings, speeds } = settings
  const key = `${source}|${ratings}|${speeds}|${fen}`
  const cached = cachedExplorer({ source, ratings, speeds, fen })
  const [loaded, setLoaded] = useState<Loaded<ExplorerResult> | null>(null)

  useEffect(() => {
    if (cached || !token) return
    let cancelled = false
    fetchExplorer({ source, ratings, speeds, fen }, token)
      .then((data) => !cancelled && setLoaded({ key, data, error: null }))
      .catch((e: unknown) => {
        if (cancelled) return
        if (e instanceof LichessError && e.kind === 'auth') onAuthError()
        setLoaded({ key, data: null, error: e instanceof Error ? e.message : 'Fehler beim Laden.' })
      })
    return () => {
      cancelled = true
    }
  }, [key, cached, source, ratings, speeds, fen, token, onAuthError])

  const current = loaded?.key === key ? loaded : null
  return {
    data: cached ?? current?.data ?? null,
    loading: !cached && !!token && !current,
    error: current?.error ?? null,
  }
}

/** Engine-Bewertung aus der Lichess-Cloud (ohne Login). */
export function useCloudEval(fen: string): DataState<CloudEval> {
  const known = hasCachedEval(fen)
  const [loaded, setLoaded] = useState<Loaded<CloudEval> | null>(null)

  useEffect(() => {
    if (known) return
    let cancelled = false
    fetchCloudEval(fen)
      .then((data) => !cancelled && setLoaded({ key: fen, data, error: null }))
      .catch((e: unknown) => {
        if (!cancelled) setLoaded({ key: fen, data: null, error: e instanceof Error ? e.message : 'Fehler beim Laden.' })
      })
    return () => {
      cancelled = true
    }
  }, [fen, known])

  const current = loaded?.key === fen ? loaded : null
  return {
    data: known ? (cachedEval(fen) ?? null) : (current?.data ?? null),
    loading: !known && !current,
    error: current?.error ?? null,
  }
}
