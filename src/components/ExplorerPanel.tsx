import { useEffect, useState } from 'react'
import { cachedExplorer, ExplorerError, fetchExplorer, moveTotal, type ExplorerResult } from '../lib/explorer'
import type { Settings } from '../lib/types'

type Props = {
  fen: string
  settings: Settings
  token: string | null
  onAuthError: () => void
  /** Zug, der im Repertoire hinterlegt ist (wird hervorgehoben). */
  repertoireMove?: string
}

type Fetched = { key: string; result: ExplorerResult | null; error: string | null }

export function ExplorerPanel({ fen, settings, token, onAuthError, repertoireMove }: Props) {
  const { source, ratings, speeds } = settings
  const key = `${source}|${ratings}|${speeds}|${fen}`
  const cached = cachedExplorer({ source, ratings, speeds, fen })
  const [fetched, setFetched] = useState<Fetched | null>(null)

  useEffect(() => {
    if (cached || !token) return
    let cancelled = false
    fetchExplorer({ source, ratings, speeds, fen }, token)
      .then((result) => !cancelled && setFetched({ key, result, error: null }))
      .catch((e: unknown) => {
        if (cancelled) return
        if (e instanceof ExplorerError && e.kind === 'auth') onAuthError()
        setFetched({ key, result: null, error: e instanceof Error ? e.message : 'Fehler beim Laden.' })
      })
    return () => {
      cancelled = true
    }
  }, [key, cached, source, ratings, speeds, fen, token, onAuthError])

  const current = fetched?.key === key ? fetched : null
  const result = cached ?? current?.result ?? null
  const error = current?.error ?? null
  const sourceLabel = settings.source === 'masters' ? 'Meisterpartien' : 'Lichess-Partien'

  return (
    <section className="card explorer">
      <div className="card-title">
        <h2>Datenbank</h2>
        <span className="muted small">{sourceLabel}</span>
      </div>
      {result?.opening && (
        <div className="opening-name">
          <span className="muted">{result.opening.eco}</span> {result.opening.name}
        </div>
      )}
      {!token && !result && <p className="muted small">Melde dich bei Lichess an, um Statistiken zu sehen.</p>}
      {token && !result && !error && <p className="muted small">Lade …</p>}
      {error && <p className="muted small">{error}</p>}
      {result && result.total === 0 && <p className="muted small">Keine Partien in dieser Stellung.</p>}
      {result && result.total > 0 && (
        <table className="explorer-table">
          <tbody>
            {result.moves.slice(0, 8).map((m) => {
              const total = moveTotal(m)
              const pct = (n: number) => (n / total) * 100
              return (
                <tr key={m.uci} className={m.san === repertoireMove ? 'mine' : undefined}>
                  <td className="san">{m.san}</td>
                  <td className="share">{Math.round((total / result.total) * 100)} %</td>
                  <td className="count muted">{total.toLocaleString('de-DE')}</td>
                  <td className="wdl">
                    <div className="wdl-bar" title={`Weiß ${pct(m.white).toFixed(0)} % · Remis ${pct(m.draws).toFixed(0)} % · Schwarz ${pct(m.black).toFixed(0)} %`}>
                      <span className="w" style={{ width: `${pct(m.white)}%` }} />
                      <span className="d" style={{ width: `${pct(m.draws)}%` }} />
                      <span className="b" style={{ width: `${pct(m.black)}%` }} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}
