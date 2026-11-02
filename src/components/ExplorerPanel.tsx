import { moveTotal } from '../lib/explorer'
import type { Settings } from '../lib/types'
import { useExplorer } from '../lib/useLichessData'

type Props = {
  fen: string
  settings: Settings
  token: string | null
  onAuthError: () => void
  /** Zug, der im Repertoire hinterlegt ist (wird hervorgehoben). */
  repertoireMove?: string
}

export function ExplorerPanel({ fen, settings, token, onAuthError, repertoireMove }: Props) {
  const { data: result, loading, error } = useExplorer(fen, settings, token, onAuthError)
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
      {loading && <p className="muted small">Lade …</p>}
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
