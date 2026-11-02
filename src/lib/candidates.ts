import { Chess } from 'chess.js'
import { formatEval, type CloudEval } from './cloudEval'
import { moveTotal, type ExplorerResult } from './explorer'
import type { Color } from './types'

export type Candidate = {
  san: string
  /** Anteil der Partien mit diesem Zug (0–1). */
  share: number | null
  games: number | null
  /** Punkteausbeute aus Sicht des Spielers (0–1, Remis = ½). */
  score: number | null
  /** Engine-Bewertung in Centipawns aus Sicht des Spielers. */
  evalCp: number | null
  recommended: boolean
}

const MAX_EXPLORER_MOVES = 8
/** Züge innerhalb dieser Spanne zum besten Engine-Zug gelten als gleichwertig. */
const EQUAL_MARGIN_CP = 30
const DUBIOUS_CP = 50
const BAD_CP = 100

function uciToSan(fen: string, uci: string): string | null {
  try {
    return new Chess(fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san
  } catch {
    return null
  }
}

/** Führt Datenbank-Statistik und Engine-Bewertung zu einer Kandidatenliste zusammen. */
export function buildCandidates(
  fen: string,
  color: Color,
  explorer: ExplorerResult | null,
  cloud: CloudEval | null,
): Candidate[] {
  const sign = color === 'white' ? 1 : -1
  const evalBySan = new Map<string, number>()
  for (const line of cloud?.lines ?? []) {
    const san = uciToSan(fen, line.uci)
    if (san && !evalBySan.has(san)) evalBySan.set(san, line.cp * sign)
  }

  const candidates: Candidate[] = []
  if (explorer && explorer.total > 0) {
    for (const m of explorer.moves.slice(0, MAX_EXPLORER_MOVES)) {
      const games = moveTotal(m)
      const wins = color === 'white' ? m.white : m.black
      candidates.push({
        san: m.san,
        share: games / explorer.total,
        games,
        score: (wins + m.draws / 2) / games,
        evalCp: evalBySan.get(m.san) ?? null,
        recommended: false,
      })
    }
  }
  // Starke Engine-Züge, die in der Datenbank (noch) selten sind, trotzdem anbieten.
  const engineOnly = [...evalBySan]
    .filter(([san]) => !candidates.some((c) => c.san === san))
    .sort((a, b) => b[1] - a[1])
  for (const [san, evalCp] of engineOnly) {
    candidates.push({ san, share: null, games: null, score: null, evalCp, recommended: false })
  }

  // Empfehlung: bester Engine-Zug; bei nahezu gleicher Bewertung der in der Praxis häufigere.
  const rated = candidates.filter((c) => c.evalCp !== null)
  if (rated.length > 0) {
    const best = Math.max(...rated.map((c) => c.evalCp!))
    const pick = rated
      .filter((c) => c.evalCp! >= best - EQUAL_MARGIN_CP)
      .sort((a, b) => (b.games ?? -1) - (a.games ?? -1) || b.evalCp! - a.evalCp!)[0]
    pick.recommended = true
  } else if (candidates.length > 0) {
    // Ohne Engine-Daten: die Datenbank-Statistik (Häufigkeit) entscheiden lassen.
    candidates[0].recommended = true
  }
  return candidates
}

export type Verdict = { kind: 'good' | 'dubious' | 'bad' | 'unknown'; text: string }

/** Beurteilt einen gewählten Zug im Vergleich zu den Kandidaten. */
export function judgeMove(san: string, candidates: Candidate[]): Verdict {
  const rated = candidates.filter((c) => c.evalCp !== null)
  const chosen = candidates.find((c) => c.san === san)
  if (rated.length === 0) {
    return chosen
      ? { kind: 'unknown', text: 'Keine Engine-Bewertung für diese Stellung vorhanden.' }
      : { kind: 'unknown', text: 'Weder in der Datenbank noch in der Engine-Bewertung – sehr ungewöhnlicher Zug.' }
  }
  const best = rated.reduce((a, b) => (b.evalCp! > a.evalCp! ? b : a))
  if (!chosen || chosen.evalCp === null) {
    return { kind: 'dubious', text: `Kein Top-5-Zug der Engine (bester: ${best.san} ${formatEval(best.evalCp!)}).` }
  }
  const loss = best.evalCp! - chosen.evalCp
  if (loss >= BAD_CP) {
    return { kind: 'bad', text: `Laut Engine ${(loss / 100).toFixed(1)} Bauern schlechter als ${best.san}.` }
  }
  if (loss >= DUBIOUS_CP) {
    return { kind: 'dubious', text: `Etwas schwächer als ${best.san} (${formatEval(chosen.evalCp)} statt ${formatEval(best.evalCp!)}).` }
  }
  return { kind: 'good', text: `Solide: ${formatEval(chosen.evalCp)} laut Engine.` }
}
