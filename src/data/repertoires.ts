import type { Line } from '../lib/types'

// Eingebaute Beispiel-Linien. Züge in SAN, von der Grundstellung aus.
export const builtinLines: Line[] = [
  {
    id: 'italian-giuoco-piano',
    repertoire: 'Italienisch (Weiß)',
    name: 'Giuoco Piano – Hauptlinie mit c3/d4',
    color: 'white',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd4', 'exd4', 'cxd4', 'Bb4+', 'Bd2', 'Bxd2+', 'Nbxd2', 'd5', 'exd5', 'Nxd5'],
  },
  {
    id: 'italian-two-knights-d3',
    repertoire: 'Italienisch (Weiß)',
    name: 'Zweispringerspiel – ruhig mit d3',
    color: 'white',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'd3', 'Be7', 'O-O', 'O-O', 'Re1', 'd6', 'c3'],
  },
  {
    id: 'london-classical',
    repertoire: 'Londoner System (Weiß)',
    name: 'Gegen …d5 und …c5',
    color: 'white',
    moves: ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3', 'c5', 'c3', 'Nc6', 'Nbd2', 'Bd6', 'Bg3', 'O-O', 'Bd3'],
  },
  {
    id: 'london-kid',
    repertoire: 'Londoner System (Weiß)',
    name: 'Gegen Königsindisch-Aufbau',
    color: 'white',
    moves: ['d4', 'Nf6', 'Bf4', 'g6', 'e3', 'Bg7', 'Nf3', 'O-O', 'Be2', 'd6', 'h3'],
  },
  {
    id: 'najdorf-english-attack',
    repertoire: 'Sizilianisch Najdorf (Schwarz)',
    name: 'Englischer Angriff 6.Be3',
    color: 'black',
    moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Be3', 'e5', 'Nb3', 'Be6', 'f3', 'Be7', 'Qd2', 'O-O'],
  },
  {
    id: 'najdorf-bg5',
    repertoire: 'Sizilianisch Najdorf (Schwarz)',
    name: 'Hauptlinie 6.Bg5',
    color: 'black',
    moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Bg5', 'e6', 'f4', 'Be7', 'Qf3', 'Qc7', 'O-O-O', 'Nbd7'],
  },
  {
    id: 'qgd-tartakower',
    repertoire: 'Damengambit abgelehnt (Schwarz)',
    name: 'Tartakower-Variante',
    color: 'black',
    moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O', 'Nf3', 'h6', 'Bh4', 'b6'],
  },
  {
    id: 'qgd-exchange',
    repertoire: 'Damengambit abgelehnt (Schwarz)',
    name: 'Abtauschvariante',
    color: 'black',
    moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'cxd5', 'exd5', 'Bg5', 'c6', 'e3', 'Be7', 'Bd3', 'Nbd7', 'Qc2', 'O-O'],
  },
]
