// Gemeinsame Warteschlange für alle Lichess-Anfragen.
// Lichess-Regeln: immer nur eine Anfrage gleichzeitig, bei HTTP 429 mindestens eine Minute warten.

const RATE_LIMIT_PAUSE_MS = 60_000

export class LichessError extends Error {
  readonly kind: 'auth' | 'rate-limit' | 'network'
  constructor(kind: LichessError['kind'], message: string) {
    super(message)
    this.kind = kind
  }
}

let queue: Promise<unknown> = Promise.resolve()
let blockedUntil = 0

/** Führt Anfragen nacheinander aus und pausiert nach einem Rate-Limit. */
export function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(() => {
    if (Date.now() < blockedUntil) {
      throw new LichessError('rate-limit', 'Lichess-Limit erreicht – kurze Pause, gleich geht es weiter.')
    }
    return task()
  })
  queue = run.catch(() => {})
  return run
}

/** Wirft passende Fehler für typische HTTP-Statuscodes. */
export function checkResponse(res: Response, label: string) {
  if (res.status === 429) {
    blockedUntil = Date.now() + RATE_LIMIT_PAUSE_MS
    throw new LichessError('rate-limit', 'Lichess-Limit erreicht – eine Minute Pause.')
  }
  if (res.status === 401) throw new LichessError('auth', 'Lichess-Anmeldung abgelaufen.')
  if (!res.ok) throw new LichessError('network', `${label} nicht erreichbar (${res.status}).`)
}

export async function lichessFetch(url: string, init: RequestInit, label: string): Promise<Response> {
  try {
    return await fetch(url, init)
  } catch {
    throw new LichessError('network', `Keine Verbindung zu ${label}.`)
  }
}

/** Kleiner LRU-Cache, der in localStorage gespiegelt wird. */
export function persistentCache<T>(storageKey: string, limit: number) {
  let map: Map<string, T> | null = null
  const get = () => {
    if (!map) {
      try {
        map = new Map(JSON.parse(localStorage.getItem(storageKey) ?? '[]'))
      } catch {
        map = new Map()
      }
    }
    return map
  }
  return {
    has: (key: string) => get().has(key),
    get: (key: string) => get().get(key),
    set(key: string, value: T) {
      const m = get()
      m.delete(key)
      m.set(key, value)
      // Älteste Einträge zuerst verwerfen (Map behält die Einfügereihenfolge).
      while (m.size > limit) m.delete(m.keys().next().value!)
      try {
        localStorage.setItem(storageKey, JSON.stringify([...m]))
      } catch {
        // Speicher voll: Cache bleibt nur im Arbeitsspeicher
      }
    },
  }
}
