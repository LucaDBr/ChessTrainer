import { describe, expect, it } from 'vitest'
import { buildCandidates, judgeMove } from '../candidates'
import type { CloudEval } from '../cloudEval'
import type { ExplorerResult } from '../explorer'

// Stellung nach 1.e4 c5, Weiß am Zug (Engine-Werte aus der Lichess-Cloud).
const FEN = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2'
const cloud: CloudEval = {
  depth: 56,
  lines: [
    { uci: 'g1f3', cp: 25 },
    { uci: 'b1c3', cp: 16 },
    { uci: 'd2d4', cp: 6 },
    { uci: 'c2c3', cp: 3 },
    { uci: 'h2h3', cp: 0 },
  ],
}
const move = (san: string, uci: string, white: number, draws: number, black: number) => ({ san, uci, white, draws, black })
const explorer: ExplorerResult = {
  total: 1000,
  opening: { eco: 'B20', name: 'Sicilian Defense' },
  moves: [
    move('Nf3', 'g1f3', 250, 50, 200),
    move('Nc3', 'b1c3', 100, 20, 80),
    move('Bc4', 'f1c4', 90, 10, 100),
    move('d4', 'd2d4', 50, 10, 40),
  ],
}

describe('buildCandidates', () => {
  it('kombiniert Datenbank und Engine und empfiehlt den besten Zug', () => {
    const list = buildCandidates(FEN, 'white', explorer, cloud)
    expect(list.map((c) => c.san)).toEqual(['Nf3', 'Nc3', 'Bc4', 'd4', 'c3', 'h3'])
    expect(list.filter((c) => c.recommended).map((c) => c.san)).toEqual(['Nf3'])
    expect(list[0].evalCp).toBe(25)
    expect(list[0].score).toBeCloseTo(0.55)
    expect(list.find((c) => c.san === 'Bc4')!.evalCp).toBeNull()
  })

  it('bewertet aus Sicht von Schwarz mit umgekehrtem Vorzeichen', () => {
    const list = buildCandidates(FEN, 'black', null, cloud)
    expect(list.find((c) => c.san === 'Nf3')!.evalCp).toBe(-25)
    expect(list[0].san).toBe('h3') // aus schwarzer Sicht der für Schwarz angenehmste Zug
  })

  it('empfiehlt ohne Engine-Daten den häufigsten Zug', () => {
    const list = buildCandidates(FEN, 'white', explorer, null)
    expect(list.find((c) => c.recommended)?.san).toBe('Nf3')
  })
})

describe('judgeMove', () => {
  const list = buildCandidates(FEN, 'white', explorer, cloud)

  it('lobt den besten Zug', () => {
    expect(judgeMove('Nf3', list).kind).toBe('good')
  })

  it('warnt bei Zügen außerhalb der Engine-Top-5', () => {
    expect(judgeMove('Bc4', list).kind).toBe('dubious')
    expect(judgeMove('a3', list).kind).toBe('dubious')
  })

  it('warnt deutlich bei klaren Fehlern', () => {
    const bad = buildCandidates(FEN, 'white', null, { depth: 30, lines: [{ uci: 'g1f3', cp: 30 }, { uci: 'd1h5', cp: -150 }] })
    expect(judgeMove('Qh5', bad)).toMatchObject({ kind: 'bad' })
  })
})
