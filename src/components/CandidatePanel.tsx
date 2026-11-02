import { buildCandidates, judgeMove } from '../lib/candidates'
import { formatEval } from '../lib/cloudEval'
import type { Color, Settings } from '../lib/types'
import { useCloudEval, useExplorer } from '../lib/useLichessData'

type Props = {
  fen: string
  color: Color
  settings: Settings
  token: string | null
  onAuthError: () => void
  selected: string | null
  onSelect: (san: string) => void
}

/** Zugauswahl für Stellungen, die noch nicht im Repertoire sind. */
export function CandidatePanel({ fen, color, settings, token, onAuthError, selected, onSelect }: Props) {
  const explorer = useExplorer(fen, settings, token, onAuthError)
  const cloud = useCloudEval(fen)
  const candidates = buildCandidates(fen, color, explorer.data, cloud.data)
  const verdict = selected ? judgeMove(selected, candidates) : null
  const loading = explorer.loading || cloud.loading

  return (
    <section className="card explorer">
      <div className="card-title">
        <h2>Kandidaten</h2>
        <span className="muted small">
          {cloud.data ? `Engine Tiefe ${cloud.data.depth}` : !cloud.loading && 'keine Engine-Daten'}
        </span>
      </div>
      {explorer.data?.opening && (
        <div className="opening-name">
          <span className="muted">{explorer.data.opening.eco}</span> {explorer.data.opening.name}
        </div>
      )}

      {candidates.length > 0 && (
        <table className="explorer-table candidates">
          <thead>
            <tr className="muted small">
              <th>Zug</th>
              <th>Engine</th>
              <th>Häufigkeit</th>
              <th>Erfolg</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.san} className={c.san === selected ? 'selected' : undefined} onClick={() => onSelect(c.san)}>
                <td className="san">
                  {c.san} {c.recommended && <span className="badge due" title="Empfehlung">★</span>}
                </td>
                <td className={c.evalCp === null ? 'muted' : undefined}>{c.evalCp === null ? '–' : formatEval(c.evalCp)}</td>
                <td className="muted">{c.share === null ? '–' : `${Math.round(c.share * 100)} %`}</td>
                <td className="muted">{c.score === null ? '–' : `${Math.round(c.score * 100)} %`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {loading && <p className="muted small">Lade …</p>}
      {!loading && candidates.length === 0 && (
        <p className="muted small">
          Keine Daten zu dieser Stellung.{!token && ' Mit Lichess-Login siehst du zusätzlich die Datenbank-Statistik.'}
        </p>
      )}
      {(explorer.error || cloud.error) && <p className="muted small">{explorer.error ?? cloud.error}</p>}

      {verdict && <div className={`feedback verdict-${verdict.kind}`}>{selected}: {verdict.text}</div>}

      <p className="muted small hint-text">
        Tippe auf einen Zug oder spiele ihn auf dem Brett. ★ = Empfehlung (beste Engine-Bewertung, bei Gleichstand
        der häufigere Zug). Erfolg = Punkteausbeute aus deiner Sicht.
      </p>
    </section>
  )
}
