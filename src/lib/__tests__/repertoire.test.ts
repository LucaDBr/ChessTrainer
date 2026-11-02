import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { builtinLines } from '../../data/repertoires'
import { addLine, positionAfter, positionKey, repertoireStats } from '../repertoire'
import type { Repertoire } from '../types'

const empty = (color: Repertoire['color']): Repertoire => ({ id: 'r', name: 'Test', color, userMoves: {}, opponentMoves: {} })

describe('builtin lines', () => {
  it.each(builtinLines.map((l) => [l.name, l.moves] as const))('%s ist legal', (_, moves) => {
    expect(() => positionAfter(moves)).not.toThrow()
  })
})

describe('addLine', () => {
  it('trennt eigene Züge und Gegnerzüge nach Farbe', () => {
    const rep = addLine(empty('black'), ['e4', 'c5', 'Nf3', 'd6'])
    expect(Object.values(rep.userMoves)).toEqual(['c5', 'd6'])
    expect(rep.opponentMoves[positionKey(new Chess())]).toEqual(['e4'])
  })

  it('sammelt mehrere Gegnerzüge in derselben Stellung ohne Duplikate', () => {
    let rep = addLine(empty('white'), ['e4', 'e5', 'Nf3'])
    rep = addLine(rep, ['e4', 'c5', 'Nf3'])
    rep = addLine(rep, ['e4', 'e5', 'Nf3'])
    expect(rep.opponentMoves[positionKey(positionAfter(['e4']))]).toEqual(['e5', 'c5'])
    expect(repertoireStats(rep, {}).positions).toBe(3)
  })

  it('erkennt Zugumstellungen als dieselbe Stellung', () => {
    const a = positionKey(positionAfter(['d4', 'Nf6', 'c4', 'e6']))
    const b = positionKey(positionAfter(['c4', 'e6', 'd4', 'Nf6']))
    expect(a).toBe(b)
  })
})
