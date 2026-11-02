import type { Settings } from './types'

// Client für den Lichess Opening Explorer (https://explorer.lichess.org).
// Lichess-Regeln: immer nur eine Anfrage gleichzeitig, bei HTTP 429 mindestens eine Minute warten.

export type ExplorerMove = { uci: string; san: string; white: number; draws: number; black: number }
export type ExplorerResult = { total: number; moves: ExplorerMove[]; opening: { eco: string; name: string } | null }

export class ExplorerError extends Error {
  readonly kind: 'auth' | 'rate-limit' | 'network'
  constructor(kind: ExplorerError['kind'], message: string) {
    super(message)
    this.kind = kind
  }
}

type Query = Pick<Settings, 'source' | 'ratings' | 'speeds'> & { fen: string }

const CACHE_KEY = 'chesstrainer:explorer-cache:v1'
const CACHE_LIMIT = 1500
const RATE_LIMIT_PAUSE_MS = 60_000

let cache: Map<string, ExplorerResult> | null = null
let queue: Promise<unknown> = Promise.resolve()
let blockedUntil = 0
const inflight = new Map<string, Promise<ExplorerResult>>()

function getCache(): Map<string, ExplorerResult> {
  if (!cache) {
    try {
      cache = new Map(JSON.parse(localStorage.getItem(CACHE_KEY) ?? '[]'))
    } catch {
      cache = new Map()
    }
  }
  return cache
}

function storeInCache(key: string, result: ExplorerResult) {
  const c = getCache()
  c.delete(key)
  c.set(key, result)
  // Älteste Einträge zuerst verwerfen (Map behält die Einfügereihenfolge).
  while (c.size > CACHE_LIMIT) c.delete(c.keys().next().value!)
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify([...c]))
  } catch {
    // Speicher voll: Cache bleibt nur im Arbeitsspeicher
  }
}

function cacheKey(q: Query): string {
  return q.source === 'masters'
    ? `masters|${q.fen}`
    : `lichess|${[...q.ratings].sort().join(',')}|${[...q.speeds].sort().join(',')}|${q.fen}`
}

export function cachedExplorer(q: Query): ExplorerResult | undefined {
  return getCache().get(cacheKey(q))
}

export function fetchExplorer(q: Query, token: string): Promise<ExplorerResult> {
  const key = cacheKey(q)
  const hit = getCache().get(key)
  if (hit) return Promise.resolve(hit)
  const pending = inflight.get(key)
  if (pending) return pending

  const request = queue.then(() => requestExplorer(q, token))
  queue = request.catch(() => {})
  const tracked = request
    .then((result) => {
      storeInCache(key, result)
      return result
    })
    .finally(() => inflight.delete(key))
  inflight.set(key, tracked)
  return tracked
}

async function requestExplorer(q: Query, token: string): Promise<ExplorerResult> {
  if (Date.now() < blockedUntil) {
    throw new ExplorerError('rate-limit', 'Lichess-Limit erreicht – kurze Pause, gleich geht es weiter.')
  }
  const params = new URLSearchParams({ fen: q.fen, moves: '12', topGames: '0' })
  if (q.source === 'lichess') {
    params.set('variant', 'standard')
    params.set('recentGames', '0')
    params.set('ratings', q.ratings.join(','))
    params.set('speeds', q.speeds.join(','))
  }

  let res: Response
  try {
    res = await fetch(`https://explorer.lichess.org/${q.source}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    throw new ExplorerError('network', 'Keine Verbindung zur Lichess-Datenbank.')
  }
  if (res.status === 429) {
    blockedUntil = Date.now() + RATE_LIMIT_PAUSE_MS
    throw new ExplorerError('rate-limit', 'Lichess-Limit erreicht – eine Minute Pause.')
  }
  if (res.status === 401) throw new ExplorerError('auth', 'Lichess-Anmeldung abgelaufen.')
  if (!res.ok) throw new ExplorerError('network', `Lichess-Datenbank nicht erreichbar (${res.status}).`)

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
