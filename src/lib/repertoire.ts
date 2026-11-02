import { Chess } from 'chess.js'
import { isDue } from './srs'
import type { LineProgress, Repertoire } from './types'

/** Stellungsschlüssel: FEN ohne Halbzug- und Zugzähler, damit Zugumstellungen zusammenfallen. */
export function positionKey(game: Chess): string {
  return game.fen().split(' ').slice(0, 4).join(' ')
}

export function positionAfter(moves: string[]): Chess {
  const game = new Chess()
  for (const san of moves) game.move(san)
  return game
}

export function cardId(repertoireId: string, key: string): string {
  return `${repertoireId}|${key}`
}

/** Fügt eine Zugfolge in das Repertoire ein und gibt ein neues Repertoire zurück. */
export function addLine(rep: Repertoire, moves: string[]): Repertoire {
  const userMoves = { ...rep.userMoves }
  const opponentMoves = { ...rep.opponentMoves }
  const game = new Chess()
  for (const san of moves) {
    const key = positionKey(game)
    const userTurn = (game.turn() === 'w') === (rep.color === 'white')
    const move = game.move(san)
    if (userTurn) {
      userMoves[key] = move.san
    } else if (!opponentMoves[key]?.includes(move.san)) {
      opponentMoves[key] = [...(opponentMoves[key] ?? []), move.san]
    }
  }
  return { ...rep, userMoves, opponentMoves }
}

export function repertoireStats(rep: Repertoire, progress: Record<string, LineProgress>, now = Date.now()) {
  let fresh = 0
  let due = 0
  const keys = Object.keys(rep.userMoves)
  for (const key of keys) {
    const p = progress[cardId(rep.id, key)]
    if (!p) fresh++
    else if (isDue(p, now)) due++
  }
  return { positions: keys.length, fresh, due }
}
