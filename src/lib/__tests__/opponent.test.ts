import { Chess } from 'chess.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addLine, positionAfter } from '../repertoire'
import type { Repertoire, Settings } from '../types'

const settings: Settings = { source: 'lichess', ratings: [1600], speeds: ['blitz'], maxDepth: 10, minShare: 0.05 }

function explorerResponse(moves: [string, number][]) {
  return {
    white: 0,
    draws: 0,
    black: moves.reduce((s, [, n]) => s + n, 0),
    opening: null,
    moves: moves.map(([san, n]) => ({ uci: san, san, white: 0, draws: 0, black: n })),
  }
}

beforeEach(() => {
  vi.resetModules()
  vi.unstubAllGlobals()
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
})

describe('chooseOpponentMove', () => {
  const rep: Repertoire = addLine(
    { id: 'r', name: 'Test', color: 'white', userMoves: {}, opponentMoves: {} },
    ['e4', 'e5', 'Nf3'],
  )

  it('nutzt ohne Token die bekannten Repertoirezüge', async () => {
    const { chooseOpponentMove } = await import('../opponent')
    const { choice } = await chooseOpponentMove(positionAfter(['e4']), rep, {}, settings, null)
    expect(choice).toEqual({ san: 'e5', share: null })
  })

  it('wählt aus der Datenbank und ignoriert seltene Züge', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(explorerResponse([['c5', 98], ['a5', 2]]))))
    vi.stubGlobal('fetch', fetchMock)
    const { chooseOpponentMove } = await import('../opponent')
    for (let i = 0; i < 20; i++) {
      const { choice } = await chooseOpponentMove(positionAfter(['e4']), rep, {}, settings, 'tok')
      expect(choice?.san).toBe('c5')
    }
    // Danach aus dem Cache: nur eine Anfrage
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('https://explorer.lichess.org/lichess?')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok')
  })

  it('fällt bei Rate-Limit auf das Repertoire zurück und pausiert weitere Anfragen', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 429 }))
    vi.stubGlobal('fetch', fetchMock)
    const { chooseOpponentMove } = await import('../opponent')
    const first = await chooseOpponentMove(positionAfter(['e4']), rep, {}, settings, 'tok')
    expect(first.choice?.san).toBe('e5')
    expect(first.warning?.kind).toBe('rate-limit')
    await chooseOpponentMove(new Chess(), { ...rep, color: 'black' }, {}, settings, 'tok')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('meldet abgelaufene Anmeldung', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 401 })))
    const { chooseOpponentMove } = await import('../opponent')
    const { warning } = await chooseOpponentMove(positionAfter(['e4']), rep, {}, settings, 'tok')
    expect(warning?.kind).toBe('auth')
  })
})
