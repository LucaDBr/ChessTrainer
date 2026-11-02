import { Chess } from 'chess.js'
import { cachedExplorer, ExplorerError, fetchExplorer, moveTotal } from './explorer'
import { cardId, positionKey } from './repertoire'
import { isDue } from './srs'
import type { LineProgress, Repertoire, Settings } from './types'

export type OpponentChoice = {
  san: string
  /** Anteil in der Datenbank (0–1), falls bekannt. */
  share: number | null
}

export type OpponentResult = { choice: OpponentChoice | null; warning: ExplorerError | null }

type Candidate = OpponentChoice & { weight: number }

const MAX_CANDIDATES = 6
/** Gegnerzüge, nach denen eine fällige Stellung kommt, werden bevorzugt. */
const DUE_BOOST = 3

/**
 * Wählt einen Gegnerzug: gewichtet nach Häufigkeit in der Lichess-Datenbank,
 * ersatzweise (ohne Login/offline) aus den bekannten Zügen des Repertoires.
 */
export async function chooseOpponentMove(
  game: Chess,
  rep: Repertoire,
  progress: Record<string, LineProgress>,
  settings: Settings,
  token: string | null,
): Promise<OpponentResult> {
  const key = positionKey(game)
  const query = { ...settings, fen: game.fen() }
  let candidates: Candidate[] = []
  let warning: ExplorerError | null = null

  let result = cachedExplorer(query)
  if (!result && token) {
    try {
      result = await fetchExplorer(query, token)
    } catch (e) {
      warning = e instanceof ExplorerError ? e : new ExplorerError('network', 'Lichess-Datenbank nicht erreichbar.')
    }
  }
  if (result && result.total > 0) {
    candidates = result.moves
      .map((m) => ({ san: m.san, share: moveTotal(m) / result.total, weight: moveTotal(m) }))
      .filter((c) => c.share >= settings.minShare)
      .slice(0, MAX_CANDIDATES)
  }
  if (candidates.length === 0) {
    candidates = (rep.opponentMoves[key] ?? []).map((san) => ({ san, share: null, weight: 1 }))
  }
  if (candidates.length === 0) return { choice: null, warning }

  for (const c of candidates) {
    const next = new Chess(game.fen())
    next.move(c.san)
    const nextKey = positionKey(next)
    if (rep.userMoves[nextKey] && isDue(progress[cardId(rep.id, nextKey)])) c.weight *= DUE_BOOST
  }

  let r = Math.random() * candidates.reduce((sum, c) => sum + c.weight, 0)
  const picked = candidates.find((c) => (r -= c.weight) <= 0) ?? candidates[0]
  return { choice: { san: picked.san, share: picked.share }, warning }
}
