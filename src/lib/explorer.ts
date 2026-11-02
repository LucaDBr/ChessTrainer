import { checkResponse, enqueue, lichessFetch, persistentCache } from './lichessQueue'
import type { Settings } from './types'

// Client für den Lichess Opening Explorer (https://explorer.lichess.org, Login erforderlich).

export type ExplorerMove = { uci: string; san: string; white: number; draws: number; black: number }
export type ExplorerResult = { total: number; moves: ExplorerMove[]; opening: { eco: string; name: string } | null }

export type ExplorerQuery = Pick<Settings, 'source' | 'ratings' | 'speeds'> & { fen: string }

const cache = persistentCache<ExplorerResult>('chesstrainer:explorer-cache:v1', 1500)
const inflight = new Map<string, Promise<ExplorerResult>>()

function cacheKey(q: ExplorerQuery): string {
  return q.source === 'masters'
    ? `masters|${q.fen}`
    : `lichess|${[...q.ratings].sort().join(',')}|${[...q.speeds].sort().join(',')}|${q.fen}`
}

export function cachedExplorer(q: ExplorerQuery): ExplorerResult | undefined {
  return cache.get(cacheKey(q))
}

export function fetchExplorer(q: ExplorerQuery, token: string): Promise<ExplorerResult> {
  const key = cacheKey(q)
  const hit = cache.get(key)
  if (hit) return Promise.resolve(hit)
  const pending = inflight.get(key)
  if (pending) return pending

  const request = enqueue(() => requestExplorer(q, token))
    .then((result) => {
      cache.set(key, result)
      return result
    })
    .finally(() => inflight.delete(key))
  inflight.set(key, request)
  return request
}

async function requestExplorer(q: ExplorerQuery, token: string): Promise<ExplorerResult> {
  const params = new URLSearchParams({ fen: q.fen, moves: '12', topGames: '0' })
  if (q.source === 'lichess') {
    params.set('variant', 'standard')
    params.set('recentGames', '0')
    params.set('ratings', q.ratings.join(','))
    params.set('speeds', q.speeds.join(','))
  }
  const res = await lichessFetch(
    `https://explorer.lichess.org/${q.source}?${params}`,
    { headers: { Authorization: `Bearer ${token}` } },
    'der Lichess-Datenbank',
  )
  checkResponse(res, 'Lichess-Datenbank')

  const data = (await res.json()) as {
    white: number
    draws: number
    black: number
    moves: ExplorerMove[]
    opening: { eco: string; name: string } | null
  }
  return {
    total: data.white + data.draws + data.black,
    // Nur benötigte Felder behalten, damit der Cache klein bleibt.
    moves: data.moves.map(({ uci, san, white, draws, black }) => ({ uci, san, white, draws, black })),
    opening: data.opening ? { eco: data.opening.eco, name: data.opening.name } : null,
  }
}

export function moveTotal(m: ExplorerMove): number {
  return m.white + m.draws + m.black
}
