import { checkResponse, enqueue, lichessFetch, persistentCache } from './lichessQueue'

// Lichess Cloud Eval: vorberechnete Engine-Bewertungen (~320 Mio. Stellungen), kein Login nötig.

export type EvalLine = {
  /** Erster Zug der Variante in UCI-Notation. */
  uci: string
  /** Bewertung in Centipawns aus Sicht von Weiß; Matt wird als ±(10000 − Züge) abgebildet. */
  cp: number
}
export type CloudEval = { depth: number; lines: EvalLine[] }

const MULTI_PV = 5

// `null` = Stellung nicht in der Cloud-Datenbank (wird ebenfalls gecacht).
const cache = persistentCache<CloudEval | null>('chesstrainer:cloud-eval-cache:v1', 1500)
const inflight = new Map<string, Promise<CloudEval | null>>()

export function hasCachedEval(fen: string): boolean {
  return cache.has(fen)
}

export function cachedEval(fen: string): CloudEval | null | undefined {
  return cache.get(fen)
}

export function fetchCloudEval(fen: string): Promise<CloudEval | null> {
  if (cache.has(fen)) return Promise.resolve(cache.get(fen)!)
  const pending = inflight.get(fen)
  if (pending) return pending

  const request = enqueue(async () => {
    const params = new URLSearchParams({ fen, multiPv: String(MULTI_PV) })
    const res = await lichessFetch(`https://lichess.org/api/cloud-eval?${params}`, {}, 'der Lichess-Engine')
    if (res.status === 404) return null
    checkResponse(res, 'Lichess-Engine')
    const data = (await res.json()) as { depth: number; pvs: { moves: string; cp?: number; mate?: number }[] }
    return {
      depth: data.depth,
      lines: data.pvs.map((pv) => ({
        uci: pv.moves.split(' ')[0],
        cp: pv.mate !== undefined ? Math.sign(pv.mate) * (10000 - Math.abs(pv.mate)) : (pv.cp ?? 0),
      })),
    }
  })
    .then((result) => {
      cache.set(fen, result)
      return result
    })
    .finally(() => inflight.delete(fen))
  inflight.set(fen, request)
  return request
}

/** Bewertung als Text aus Sicht des Spielers, z. B. "+0.4" oder "#3". */
export function formatEval(cpForPlayer: number): string {
  if (Math.abs(cpForPlayer) > 9000) {
    const moves = 10000 - Math.abs(cpForPlayer)
    return `${cpForPlayer > 0 ? '' : '-'}#${moves}`
  }
  const pawns = cpForPlayer / 100
  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(1)}`
}
