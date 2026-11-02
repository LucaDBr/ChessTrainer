import { useState } from 'react'
import { parsePgnMoves } from '../lib/pgn'
import type { Color, Line } from '../lib/types'

export function ImportForm({ onAdd }: { onAdd: (line: Line) => void }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState<Color>('white')
  const [pgn, setPgn] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const moves = parsePgnMoves(pgn)
      onAdd({
        id: `custom-${Date.now()}`,
        repertoire: 'Eigene Linien',
        name: name.trim() || moves.slice(0, 6).join(' '),
        color,
        moves,
      })
      setName('')
      setPgn('')
      setError(null)
    } catch {
      setError('Die Züge konnten nicht gelesen werden. Beispiel: 1. e4 e5 2. Nf3 Nc6')
    }
  }

  return (
    <details className="card">
      <summary>
        <h2>Eigene Linie hinzufügen</h2>
      </summary>
      <form className="import-form" onSubmit={submit}>
        <input placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="segmented">
          <label>
            <input type="radio" checked={color === 'white'} onChange={() => setColor('white')} /> Ich spiele Weiß
          </label>
          <label>
            <input type="radio" checked={color === 'black'} onChange={() => setColor('black')} /> Ich spiele Schwarz
          </label>
        </div>
        <textarea
          rows={4}
          placeholder="PGN, z. B. 1. e4 e5 2. Nf3 Nc6 3. Bb5 a6"
          value={pgn}
          onChange={(e) => setPgn(e.target.value)}
        />
        {error && <div className="feedback bad">{error}</div>}
        <button className="primary" type="submit" disabled={!pgn.trim()}>
          Hinzufügen
        </button>
      </form>
    </details>
  )
}
