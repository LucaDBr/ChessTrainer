import { useState } from 'react'
import { parsePgnMoves } from '../lib/pgn'
import type { Repertoire } from '../lib/types'

type Props = {
  repertoires: Repertoire[]
  onImport: (repertoireId: string, moves: string[]) => void
}

export function ImportForm({ repertoires, onImport }: Props) {
  const [target, setTarget] = useState(repertoires[0]?.id ?? '')
  const [pgn, setPgn] = useState('')
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  if (repertoires.length === 0) return null
  const targetId = repertoires.some((r) => r.id === target) ? target : repertoires[0].id

  function submit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const moves = parsePgnMoves(pgn)
      onImport(targetId, moves)
      setPgn('')
      setMessage({ ok: true, text: `${moves.length} Halbzüge übernommen.` })
    } catch {
      setMessage({ ok: false, text: 'Die Züge konnten nicht gelesen werden. Beispiel: 1. e4 e5 2. Nf3 Nc6' })
    }
  }

  return (
    <details className="card">
      <summary>
        <h2>Linie per PGN importieren</h2>
      </summary>
      <form className="import-form" onSubmit={submit}>
        <select value={targetId} onChange={(e) => setTarget(e.target.value)}>
          {repertoires.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.color === 'white' ? 'Weiß' : 'Schwarz'})
            </option>
          ))}
        </select>
        <textarea
          rows={4}
          placeholder="PGN, z. B. 1. e4 e5 2. Nf3 Nc6 3. Bb5 a6"
          value={pgn}
          onChange={(e) => setPgn(e.target.value)}
        />
        {message && <div className={`feedback ${message.ok ? 'good' : 'bad'}`}>{message.text}</div>}
        <button className="primary" type="submit" disabled={!pgn.trim()}>
          Importieren
        </button>
      </form>
    </details>
  )
}
