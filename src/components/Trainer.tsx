import { Chess, type Square } from 'chess.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Chessboard, type Arrow } from 'react-chessboard'
import type { Line } from '../lib/types'

const OPPONENT_DELAY_MS = 450

type Props = {
  line: Line
  onComplete: (mistakes: number) => void
  onNext: () => void
  onExit: () => void
}

type Feedback = { kind: 'info' | 'good' | 'bad'; text: string }

function positionAfter(moves: string[], ply: number): Chess {
  const game = new Chess()
  for (const san of moves.slice(0, ply)) game.move(san)
  return game
}

export function Trainer({ line, onComplete, onNext, onExit }: Props) {
  const [ply, setPly] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'info', text: 'Spiele den nächsten Zug deines Repertoires.' })
  const [hint, setHint] = useState<Arrow | null>(null)
  const [selected, setSelected] = useState<Square | null>(null)
  const completedRef = useRef(false)

  const game = useMemo(() => positionAfter(line.moves, ply), [line.moves, ply])
  const done = ply >= line.moves.length
  const userTurn = !done && (game.turn() === 'w') === (line.color === 'white')
  const expected = done ? null : line.moves[ply]
  const lastMove = game.history({ verbose: true }).at(-1)

  // Gegnerzug automatisch ausführen.
  useEffect(() => {
    if (done || userTurn) return
    const timer = setTimeout(() => setPly((p) => p + 1), OPPONENT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [done, userTurn])

  // Ergebnis einmal pro Durchlauf melden.
  useEffect(() => {
    if (!done || completedRef.current) return
    completedRef.current = true
    onComplete(mistakes)
    setFeedback(
      mistakes === 0
        ? { kind: 'good', text: 'Perfekt! Linie fehlerfrei gespielt.' }
        : { kind: 'bad', text: `Linie beendet – ${mistakes} Fehler. Sie kommt morgen wieder.` },
    )
  }, [done, mistakes, onComplete])

  function restart() {
    completedRef.current = false
    setPly(0)
    setMistakes(0)
    setHint(null)
    setSelected(null)
    setFeedback({ kind: 'info', text: 'Spiele den nächsten Zug deines Repertoires.' })
  }

  function expectedArrow(): Arrow | null {
    if (!expected) return null
    const move = new Chess(game.fen()).move(expected)
    return { startSquare: move.from, endSquare: move.to, color: 'rgba(40, 160, 90, 0.85)' }
  }

  function tryMove(from: Square, to: Square): boolean {
    setSelected(null)
    if (!userTurn || !expected) return false
    const candidates = game.moves({ square: from, verbose: true }).filter((m) => m.to === to)
    if (candidates.length === 0) return false // illegaler Zug, zählt nicht als Fehler

    if (candidates.some((m) => m.san === expected)) {
      setHint(null)
      setFeedback({ kind: 'good', text: `Richtig: ${expected}` })
      setPly((p) => p + 1)
      return true
    }

    setMistakes((m) => m + 1)
    setHint(expectedArrow())
    setFeedback({ kind: 'bad', text: `${candidates[0].san} ist nicht dein Repertoirezug. Richtig: ${expected}` })
    return false
  }

  function showHint() {
    if (!userTurn) return
    setMistakes((m) => m + 1)
    setHint(expectedArrow())
    setFeedback({ kind: 'info', text: `Tipp: ${expected} (zählt als Fehler)` })
  }

  function onSquareClick(square: Square) {
    if (!userTurn) return
    const piece = game.get(square)
    const ownPiece = piece && piece.color === game.turn()
    if (selected && !ownPiece) {
      tryMove(selected, square)
    } else {
      setSelected(ownPiece && square !== selected ? square : null)
    }
  }

  const squareStyles: Record<string, React.CSSProperties> = {}
  if (lastMove) {
    squareStyles[lastMove.from] = { background: 'rgba(255, 210, 60, 0.45)' }
    squareStyles[lastMove.to] = { background: 'rgba(255, 210, 60, 0.45)' }
  }
  if (selected) {
    squareStyles[selected] = { background: 'rgba(80, 140, 255, 0.5)' }
    for (const m of game.moves({ square: selected, verbose: true })) {
      squareStyles[m.to] = {
        ...squareStyles[m.to],
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.25) 22%, transparent 24%)',
      }
    }
  }

  return (
    <div className="trainer">
      <header className="trainer-header">
        <button className="link" onClick={onExit}>← Übersicht</button>
        <div>
          <div className="muted small">{line.repertoire}</div>
          <h2>{line.name}</h2>
        </div>
      </header>

      <div className="board-wrap">
        <Chessboard
          options={{
            id: 'trainer',
            position: game.fen(),
            boardOrientation: line.color,
            allowDragging: userTurn,
            arrows: hint ? [hint] : [],
            squareStyles,
            animationDurationInMs: 200,
            onPieceDrop: ({ sourceSquare, targetSquare }) =>
              targetSquare ? tryMove(sourceSquare as Square, targetSquare as Square) : false,
            onSquareClick: ({ square }) => onSquareClick(square as Square),
          }}
        />
      </div>

      <div className={`feedback ${feedback.kind}`}>{feedback.text}</div>

      <div className="progress-bar" aria-label="Fortschritt">
        <div style={{ width: `${(ply / line.moves.length) * 100}%` }} />
      </div>

      <div className="actions">
        {done ? (
          <>
            <button onClick={restart}>Nochmal</button>
            <button className="primary" onClick={onNext}>Nächste Linie</button>
          </>
        ) : (
          <>
            <button onClick={showHint} disabled={!userTurn}>Tipp</button>
            <button onClick={restart}>Neu starten</button>
          </>
        )}
      </div>

      <MoveList moves={line.moves.slice(0, ply)} />
    </div>
  )
}

function MoveList({ moves }: { moves: string[] }) {
  if (moves.length === 0) return null
  const rows = []
  for (let i = 0; i < moves.length; i += 2) {
    rows.push(
      <span key={i} className="move-pair">
        <span className="muted">{i / 2 + 1}.</span> {moves[i]} {moves[i + 1] ?? ''}
      </span>,
    )
  }
  return <div className="move-list">{rows}</div>
}
