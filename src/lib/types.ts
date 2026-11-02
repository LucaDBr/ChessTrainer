export type Color = 'white' | 'black'

export type Line = {
  id: string
  repertoire: string
  name: string
  /** Die Farbe, die der Nutzer in dieser Linie spielt. */
  color: Color
  /** Züge in SAN, beginnend in der Grundstellung. */
  moves: string[]
}

export type LineProgress = {
  /** Leitner-Box: 0 = neu, höher = besser gelernt. */
  box: number
  /** Zeitpunkt (ms), ab dem die Linie wieder fällig ist. */
  due: number
  reps: number
  lapses: number
}
