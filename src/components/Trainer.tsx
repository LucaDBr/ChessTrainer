import { Chess, type Square } from 'chess.js'
import { useEffect, useMemo, useState } from 'react'
import { Chessboard, type Arrow } from 'react-chessboard'
import { chooseOpponentMove } from '../lib/opponent'
import { positionAfter, positionKey } from '../lib/repertoire'
import type { Store } from '../lib/storage'
import type { LineProgress, Repertoire, Settings } from '../lib/types'
import { CandidatePanel } from './CandidatePanel'
import { ExplorerPanel } from './ExplorerPanel'

const OPPONENT_DELAY_MS = 450

type Props = {
  repertoire: Repertoire
  progress: Record<string, LineProgress>
  settings: Settings
  token: string | null
  store: Pick<Store, 'setUserMove' | 'addOpponentMove' | 'recordCard'>
  onAuthError: () => void
  onNext: () => void
  onExit: () => void
}

type Feedback = { kind: 'info' | 'good' | 'bad'; text: string }
type Stats = { correct: number; mistakes: number; learned: number }

export function Trainer({ repertoire: rep, progress, settings, token, store, onAuthError, onNext, onExit }: Props) {
  const [history, setHistory] = useState<string[]>([])
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'info', text: 'Los geht’s!' })
  const [hint, setHint] = useState<Arrow | null>(null)
  const [selected, setSelected] = useState<Square | null>(null)
  const [failedKeys, setFailedKeys] = useState<Set<string>>(new Set())
  const [wrongMove, setWrongMove] = useState<string | null>(null)
  /** In neuen Stellungen: gewählter Zug, der erst nach Bestätigung gespeichert wird. */
  const [pending, setPending] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>({ correct: 0, mistakes: 0, learned: 0 })
  const [stopReason, setStopReason] = useState<string | null>(null)

  const game = useMemo(() => positionAfter(history), [history])
  const key = positionKey(game)
  const userMovesPlayed = history.filter((_, i) => (i % 2 === 0) === (rep.color === 'white')).length
  const userToMove = (game.turn() === 'w') === (rep.color === 'white')
  const endReason =
    stopReason ??
    (game.isGameOver()
      ? 'Partie beendet.'
      : userToMove && userMovesPlayed >= settings.maxDepth
        ? `Maximale Tiefe (${settings.maxDepth} Züge) erreicht.`
        : null)
  const done = endReason !== null
  const userTurn = !done && userToMove
  const expected = userTurn ? rep.userMoves[key] : undefined
  const learning = userTurn && !expected
  const lastMove = game.history({ verbose: true }).at(-1)

  // Gegnerzug wählen und ausführen.
  useEffect(() => {
    if (done || userTurn) return
    let cancelled = false
    const started = Date.now()
    chooseOpponentMove(game, rep, progress, settings, token).then(async ({ choice, warning }) => {
      if (cancelled) return
      if (warning?.kind === 'auth') onAuthError()
      if (!choice) {
        setStopReason(
          warning
            ? `${warning.message} Keine bekannten Gegnerzüge mehr.`
            : token
              ? 'Ende der Variante – keine weiteren Partien in der Datenbank.'
              : 'Ende deines Repertoires. Melde dich bei Lichess an, um Nebenvarianten zu trainieren.',
        )
        return
      }
      await new Promise((r) => setTimeout(r, Math.max(0, OPPONENT_DELAY_MS - (Date.now() - started))))
      if (cancelled) return
      store.addOpponentMove(rep.id, key, choice.san)
      setHistory((h) => [...h, choice.san])
      const share = choice.share !== null ? ` (${Math.round(choice.share * 100)} % der Partien)` : ''
      setFeedback({ kind: 'info', text: `Gegner spielt ${choice.san}${share}.${warning ? ` ${warning.message}` : ''}` })
    })
    return () => {
      cancelled = true
    }
    // Nur bei neuer Stellung neu auslösen: rep/progress ändern sich durch die eigenen Züge mit
    // und würden den gerade gewählten Gegnerzug sonst abbrechen.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [key, done, userTurn])

  function markFailed() {
    if (failedKeys.has(key)) return
    store.recordCard(rep.id, key, false)
    setFailedKeys(new Set(failedKeys).add(key))
    setStats((s) => ({ ...s, mistakes: s.mistakes + 1 }))
  }

  function arrowFor(san: string, color: string): Arrow {
    const move = new Chess(game.fen()).move(san)
    return { startSquare: move.from, endSquare: move.to, color }
  }

  function expectedArrow(): Arrow | null {
    return expected ? arrowFor(expected, 'rgba(40, 160, 90, 0.85)') : null
  }

  function play(san: string) {
    setHint(null)
    setWrongMove(null)
    setPending(null)
    setHistory((h) => [...h, san])
  }

  function selectCandidate(san: string) {
    setPending(san)
    setHint(arrowFor(san, 'rgba(80, 140, 255, 0.85)'))
  }

  function confirmPending() {
    if (!pending) return
    store.setUserMove(rep.id, key, pending)
    store.recordCard(rep.id, key, true)
    setStats((s) => ({ ...s, learned: s.learned + 1 }))
    setFeedback({ kind: 'good', text: `Neu im Repertoire: ${pending}` })
    play(pending)
  }

  function skipVariation() {
    setHint(null)
    setPending(null)
    setStopReason('Variante übersprungen – nichts gespeichert.')
  }

  function tryMove(from: Square, to: Square): boolean {
    setSelected(null)
    if (!userTurn) return false
    const candidates = game.moves({ square: from, verbose: true }).filter((m) => m.to === to)
    if (candidates.length === 0) return false // illegaler Zug, zählt nicht als Fehler
    const move = candidates.find((m) => m.san === expected) ?? candidates.find((m) => !m.promotion || m.promotion === 'q')!

    if (!expected) {
      // Neue Stellung: nur vormerken, gespeichert wird erst nach Bestätigung.
      selectCandidate(move.san)
      return false
    }

    if (move.san === expected) {
      if (!failedKeys.has(key)) {
        store.recordCard(rep.id, key, true)
        setStats((s) => ({ ...s, correct: s.correct + 1 }))
      }
      setFeedback({ kind: 'good', text: `Richtig: ${expected}` })
      play(move.san)
      return true
    }

    markFailed()
    setHint(expectedArrow())
    setWrongMove(move.san)
    setFeedback({ kind: 'bad', text: `${move.san} ist nicht dein Repertoirezug. Richtig: ${expected}` })
    return false
  }

  function adoptWrongMove() {
    if (!wrongMove) return
    store.setUserMove(rep.id, key, wrongMove)
    setFeedback({ kind: 'info', text: `Repertoire geändert: Hier spielst du jetzt ${wrongMove}.` })
    play(wrongMove)
  }

  function showHint() {
    if (!expected) return
    markFailed()
    setHint(expectedArrow())
    setFeedback({ kind: 'info', text: `Tipp: ${expected} (zählt als Fehler)` })
  }

  function onSquareClick(square: Square) {
    if (!userTurn) return
    const piece = game.get(square)
    const ownPiece = piece && piece.color === game.turn()
    if (selected && !ownPiece) tryMove(selected, square)
    else setSelected(ownPiece && square !== selected ? square : null)
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

  const status: Feedback = done
    ? {
        kind: stats.mistakes === 0 ? 'good' : 'bad',
        text: `${endReason} ${stats.correct} richtig, ${stats.mistakes} Fehler, ${stats.learned} neu gelernt.`,
      }
    : learning
      ? {
          kind: 'info',
          text: pending
            ? `${pending} ins Repertoire aufnehmen? Prüfe die Bewertung unten.`
            : 'Neue Stellung – noch nicht in deinem Repertoire. Wähle einen Zug; gespeichert wird erst nach Bestätigung.',
        }
      : feedback

  return (
    <div className="trainer">
      <header className="trainer-header">
        <button className="link" onClick={onExit}>← Übersicht</button>
        <div>
          <div className="muted small">Training · {rep.color === 'white' ? 'Weiß' : 'Schwarz'}</div>
          <h2>{rep.name}</h2>
        </div>
      </header>

      <div className="board-wrap">
        <Chessboard
          options={{
            id: 'trainer',
            position: game.fen(),
            boardOrientation: rep.color,
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

      <div className={`feedback ${status.kind}`}>{status.text}</div>

      <div className="actions">
        {done ? (
          <>
            <button onClick={onExit}>Übersicht</button>
            <button className="primary" onClick={onNext}>Nächste Runde</button>
          </>
        ) : learning ? (
          <>
            <button onClick={skipVariation}>Überspringen</button>
            <button className="primary" onClick={confirmPending} disabled={!pending}>
              {pending ? `${pending} ins Repertoire` : 'Zug wählen …'}
            </button>
          </>
        ) : (
          <>
            {wrongMove ? (
              <button onClick={adoptWrongMove}>{wrongMove} übernehmen</button>
            ) : (
              <button onClick={showHint} disabled={!expected}>Tipp</button>
            )}
            <button onClick={() => setStopReason('Runde beendet.')}>Beenden</button>
          </>
        )}
      </div>

      <MoveList moves={history} />

      {learning && (
        <CandidatePanel
          fen={game.fen()}
          color={rep.color}
          settings={settings}
          token={token}
          onAuthError={onAuthError}
          selected={pending}
          onSelect={selectCandidate}
        />
      )}

      {/* Statistik nur zeigen, wenn sie die Antwort nicht verrät. */}
      {(done || !userTurn) && (
        <ExplorerPanel
          fen={game.fen()}
          settings={settings}
          token={token}
          onAuthError={onAuthError}
          repertoireMove={rep.userMoves[key]}
        />
      )}
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
