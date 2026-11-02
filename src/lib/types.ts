export type Color = 'white' | 'black'

/** Eine Zugfolge ab der Grundstellung, z. B. aus den eingebauten Daten oder einem PGN-Import. */
export type Line = {
  repertoire: string
  name: string
  /** Die Farbe, die der Nutzer in dieser Linie spielt. */
  color: Color
  /** Züge in SAN, beginnend in der Grundstellung. */
  moves: string[]
}

/**
 * Ein Repertoire als Stellungsbaum: Für jede Stellung (Schlüssel = FEN ohne Zugzähler)
 * ist hinterlegt, welchen Zug der Nutzer spielt bzw. welche Gegnerzüge bekannt sind.
 * Dadurch werden Zugumstellungen automatisch erkannt.
 */
export type Repertoire = {
  id: string
  name: string
  color: Color
  userMoves: Record<string, string>
  opponentMoves: Record<string, string[]>
}

export type LineProgress = {
  /** Leitner-Box: 0 = neu, höher = besser gelernt. */
  box: number
  /** Zeitpunkt (ms), ab dem die Stellung wieder fällig ist. */
  due: number
  reps: number
  lapses: number
}

export type ExplorerSource = 'lichess' | 'masters'

export type Settings = {
  source: ExplorerSource
  /** Lichess-Elo-Gruppen (0, 1000, 1200, …, 2500). */
  ratings: number[]
  speeds: string[]
  /** Maximale Anzahl eigener Züge pro Trainingsdurchlauf. */
  maxDepth: number
  /** Gegnerzüge unter diesem Anteil (0–1) werden ignoriert. */
  minShare: number
}
