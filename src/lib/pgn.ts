import { Chess } from 'chess.js'

/** Liest eine PGN-Zugfolge ein und gibt die Hauptvariante in SAN zurück. */
export function parsePgnMoves(pgn: string): string[] {
  const game = new Chess()
  game.loadPgn(pgn.trim())
  const moves = game.history()
  if (moves.length === 0) throw new Error('Keine Züge gefunden.')
  return moves
}
