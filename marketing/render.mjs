// Rendert die Instagram-Beiträge aus posts.mjs als PNG (1080×1350) nach out/.
// Aufruf: npm run render [-- <post-id>]
import { Resvg } from '@resvg/resvg-js'
import { Chess } from 'chess.js'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { posts } from './posts.mjs'

const ROOT = dirname(fileURLToPath(import.meta.url))
const W = 1080
const H = 1350

const C = {
  bg: '#16181d',
  bg2: '#1d2027',
  card: '#20232a',
  border: '#2f333c',
  text: '#e8e8ea',
  muted: '#9a9ea8',
  accent: '#6aa84f',
  bad: '#d9534f',
  info: '#5b8def',
  light: '#eeeed2',
  dark: '#769656',
}
const ARROW = { green: 'rgba(40,160,90,0.85)', red: 'rgba(217,83,79,0.9)', blue: 'rgba(80,140,255,0.85)' }

const FONT = "'Segoe UI', sans-serif"
const FONT_FILES = ['segoeui.ttf', 'segoeuib.ttf', 'seguisb.ttf', 'seguisym.ttf'].map((f) => join('C:/Windows/Fonts', f))

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// ---------- Figuren (cburnett, BSD) ----------
const pieceSvg = {}
for (const color of ['w', 'b']) {
  for (const type of ['K', 'Q', 'R', 'B', 'N', 'P']) {
    const raw = readFileSync(join(ROOT, 'assets/pieces', `${color}${type}.svg`), 'utf8')
    pieceSvg[color + type.toLowerCase()] = raw.slice(raw.indexOf('>') + 1, raw.lastIndexOf('</svg>'))
  }
}

function positionAfter(moves) {
  const game = new Chess()
  for (const san of moves) game.move(san)
  return game
}

/** Zeichnet ein Brett. board: { moves, orientation, arrows: [[from, to, color]], marks: [[square, color]] } */
function boardSvg(spec, x, y, size) {
  const game = positionAfter(spec.moves)
  const sq = size / 8
  const flip = spec.orientation === 'black'
  const files = 'abcdefgh'
  const pos = (square) => {
    const f = files.indexOf(square[0])
    const r = Number(square[1]) - 1
    const col = flip ? 7 - f : f
    const row = flip ? r : 7 - r
    return { x: x + col * sq, y: y + row * sq }
  }
  const last = game.history({ verbose: true }).at(-1)
  let out = `<rect x="${x - 6}" y="${y - 6}" width="${size + 12}" height="${size + 12}" rx="10" fill="${C.border}"/>`
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isLight = (row + col) % 2 === 0
      out += `<rect x="${x + col * sq}" y="${y + row * sq}" width="${sq}" height="${sq}" fill="${isLight ? C.light : C.dark}"/>`
    }
  }
  if (last && spec.showLast !== false) {
    for (const s of [last.from, last.to]) {
      const p = pos(s)
      out += `<rect x="${p.x}" y="${p.y}" width="${sq}" height="${sq}" fill="rgba(255,210,60,0.45)"/>`
    }
  }
  for (const [s, color] of spec.marks ?? []) {
    const p = pos(s)
    out += `<rect x="${p.x}" y="${p.y}" width="${sq}" height="${sq}" fill="${color}"/>`
  }
  // Koordinaten am Rand
  for (let i = 0; i < 8; i++) {
    const fileLabel = flip ? files[7 - i] : files[i]
    const rankLabel = flip ? i + 1 : 8 - i
    const fileColor = (7 + i) % 2 === 0 ? C.dark : C.light
    const rankColor = i % 2 === 0 ? C.dark : C.light
    out += `<text x="${x + (i + 1) * sq - 6}" y="${y + size - 7}" font-family="${FONT}" font-weight="700" font-size="${sq * 0.2}" text-anchor="end" fill="${fileColor}">${fileLabel}</text>`
    out += `<text x="${x + 5}" y="${y + i * sq + sq * 0.24}" font-family="${FONT}" font-weight="700" font-size="${sq * 0.2}" fill="${rankColor}">${rankLabel}</text>`
  }
  for (const row of game.board()) {
    for (const piece of row) {
      if (!piece) continue
      const p = pos(piece.square)
      out += `<svg x="${p.x}" y="${p.y}" width="${sq}" height="${sq}" viewBox="0 0 45 45">${pieceSvg[piece.color + piece.type]}</svg>`
    }
  }
  for (const [from, to, color = 'green'] of spec.arrows ?? []) out += arrowSvg(pos(from), pos(to), sq, ARROW[color] ?? color)
  return out
}

function arrowSvg(a, b, sq, color) {
  const ax = a.x + sq / 2
  const ay = a.y + sq / 2
  const bx = b.x + sq / 2
  const by = b.y + sq / 2
  const len = Math.hypot(bx - ax, by - ay)
  const ux = (bx - ax) / len
  const uy = (by - ay) / len
  const head = sq * 0.42
  const width = sq * 0.17
  const tipX = bx - ux * sq * 0.18
  const tipY = by - uy * sq * 0.18
  const baseX = tipX - ux * head
  const baseY = tipY - uy * head
  const startX = ax + ux * sq * 0.25
  const startY = ay + uy * sq * 0.25
  const nx = -uy
  const ny = ux
  return (
    `<line x1="${startX}" y1="${startY}" x2="${baseX}" y2="${baseY}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>` +
    `<polygon points="${tipX},${tipY} ${baseX + nx * head * 0.55},${baseY + ny * head * 0.55} ${baseX - nx * head * 0.55},${baseY - ny * head * 0.55}" fill="${color}"/>`
  )
}

// ---------- Bausteine ----------
function textLines(lines, x, y, { size, weight = 400, color = C.text, lineHeight = 1.25, anchor = 'start' }) {
  return lines
    .map(
      (line, i) =>
        `<text x="${x}" y="${y + i * size * lineHeight}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${esc(line)}</text>`,
    )
    .join('')
}

function logo(x, y, s) {
  const c = s / 4
  let out = `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.12}" fill="${C.light}"/>`
  for (let r = 0; r < 4; r++)
    for (let f = 0; f < 4; f++)
      if ((r + f) % 2 === 1) out += `<rect x="${x + f * c}" y="${y + r * c}" width="${c}" height="${c}" fill="${C.accent}"/>`
  return `<g>${out}</g>`
}

function chrome(slideIndex, slideCount, { credit } = {}) {
  let out = logo(70, 62, 44)
  out += `<text x="130" y="94" font-family="${FONT}" font-size="30" font-weight="700" fill="${C.text}">ChessTrainer</text>`
  if (slideCount > 1) {
    out += `<text x="${W - 70}" y="94" font-family="${FONT}" font-size="26" fill="${C.muted}" text-anchor="end">${slideIndex + 1}/${slideCount}</text>`
  }
  out += `<text x="70" y="${H - 52}" font-family="${FONT}" font-size="26" font-weight="600" fill="${C.muted}">@chesstrainerapp</text>`
  if (credit) {
    out += `<text x="${credit.x}" y="${credit.y}" font-family="${FONT}" font-size="18" fill="${C.muted}" text-anchor="end">${esc(credit.text)}</text>`
  }
  if (slideIndex < slideCount - 1) {
    out += `<text x="${W - 70}" y="${H - 52}" font-family="${FONT}" font-size="26" font-weight="600" fill="${C.accent}" text-anchor="end">Swipe →</text>`
  }
  return out
}

function kicker(text, y = 190) {
  return `<text x="70" y="${y}" font-family="${FONT}" font-size="26" font-weight="700" fill="${C.accent}" letter-spacing="3">${esc(text.toUpperCase())}</text>`
}

function pill(text, x, y, { anchor = 'start', height = 84, fontSize = 34 } = {}) {
  const w = text.length * fontSize * 0.56 + height
  const left = anchor === 'middle' ? x - w / 2 : x
  return (
    `<rect x="${left}" y="${y}" width="${w}" height="${height}" rx="${height / 2}" fill="${C.accent}"/>` +
    `<text x="${left + w / 2}" y="${y + height / 2 + fontSize * 0.36}" font-family="${FONT}" font-size="${fontSize}" font-weight="700" fill="#fff" text-anchor="middle">${esc(text)}</text>`
  )
}

// ---------- Folienvorlagen ----------
const PIECE_CREDIT = 'Pieces: Colin M.L. Burnett (BSD)'

const templates = {
  board(s) {
    const size = 680
    const titleY = 262
    const boardY = titleY + s.title.length * 73 - 20
    const boardX = (W - size) / 2
    let out = kicker(s.kicker)
    out += textLines(s.title, 70, titleY, { size: 60, weight: 700, lineHeight: 1.22 })
    out += boardSvg(s.board, boardX, boardY, size)
    out += textLines(s.caption ?? [], W / 2, boardY + size + 80, { size: 34, color: C.muted, anchor: 'middle', lineHeight: 1.35 })
    return { body: out, credit: { text: PIECE_CREDIT, x: boardX + size, y: boardY + size + 30 } }
  },

  text(s) {
    let out = kicker(s.kicker, 330)
    out += textLines(s.title, 70, 450, { size: 96, weight: 700, lineHeight: 1.12 })
    const bodyY = 450 + s.title.length * 108 + 60
    out += textLines(s.body ?? [], 70, bodyY, { size: 42, color: C.muted, lineHeight: 1.45 })
    if (s.pill) out += pill(s.pill, 70, bodyY + (s.body?.length ?? 0) * 61 + 50)
    return { body: out }
  },

  steps(s) {
    let out = kicker(s.kicker)
    out += textLines(s.title, 70, 270, { size: 68, weight: 700, lineHeight: 1.15 })
    let y = 270 + s.title.length * 78 + 70
    s.steps.forEach(([title, lines], i) => {
      out += `<rect x="70" y="${y}" width="${W - 140}" height="${110 + lines.length * 44}" rx="22" fill="${C.card}" stroke="${C.border}" stroke-width="2"/>`
      out += `<circle cx="140" cy="${y + 70}" r="36" fill="${C.accent}"/>`
      out += `<text x="140" y="${y + 84}" font-family="${FONT}" font-size="38" font-weight="700" fill="#fff" text-anchor="middle">${i + 1}</text>`
      out += textLines([title], 205, y + 82, { size: 42, weight: 700 })
      out += textLines(lines, 205, y + 132, { size: 32, color: C.muted, lineHeight: 1.35 })
      y += 110 + lines.length * 44 + 30
    })
    if (s.note) out += textLines(s.note, 70, y + 40, { size: 30, color: C.muted, lineHeight: 1.35 })
    return { body: out }
  },

  timeline(s) {
    let out = kicker(s.kicker)
    out += textLines(s.title, 70, 270, { size: 68, weight: 700, lineHeight: 1.15 })
    let y = 270 + s.title.length * 78 + 60
    out += textLines(s.intro, 70, y, { size: 36, color: C.muted, lineHeight: 1.4 })
    y += s.intro.length * 50 + 70
    const chipW = 150
    const gap = (W - 140 - chipW * 5) / 4
    s.days.forEach((d, i) => {
      const x = 70 + i * (chipW + gap)
      out += `<rect x="${x}" y="${y}" width="${chipW}" height="150" rx="22" fill="${C.card}" stroke="${C.accent}" stroke-width="3"/>`
      out += `<text x="${x + chipW / 2}" y="${y + 80}" font-family="${FONT}" font-size="56" font-weight="700" fill="${C.text}" text-anchor="middle">${d}</text>`
      out += `<text x="${x + chipW / 2}" y="${y + 120}" font-family="${FONT}" font-size="26" fill="${C.muted}" text-anchor="middle">${d === 1 ? 'day' : 'days'}</text>`
      if (i < s.days.length - 1) {
        out += `<text x="${x + chipW + gap / 2}" y="${y + 88}" font-family="${FONT}" font-size="40" fill="${C.accent}" text-anchor="middle">→</text>`
      }
    })
    y += 150 + 90
    out += `<rect x="70" y="${y}" width="${W - 140}" height="${80 + s.miss.length * 48}" rx="22" fill="${C.card}" stroke="${C.bad}" stroke-width="3"/>`
    out += textLines(s.miss, 110, y + 72, { size: 36, lineHeight: 1.35 })
    return { body: out }
  },

  table(s) {
    let out = kicker(s.kicker)
    out += textLines(s.title, 70, 270, { size: 68, weight: 700, lineHeight: 1.15 })
    let y = 270 + s.title.length * 78 + 50
    out += textLines(s.intro, 70, y, { size: 34, color: C.muted, lineHeight: 1.4 })
    y += s.intro.length * 48 + 20
    const rowH = 72
    out += `<rect x="70" y="${y}" width="${W - 140}" height="${100 + s.rows.length * rowH}" rx="22" fill="${C.card}" stroke="${C.border}" stroke-width="2"/>`
    out += textLines([s.position], 110, y + 62, { size: 30, weight: 600, color: C.muted })
    out += textLines(['Engine'], W - 110, y + 62, { size: 30, weight: 600, color: C.muted, anchor: 'end' })
    s.rows.forEach(([move, evalText, recommended], i) => {
      const ry = y + 100 + i * rowH
      if (recommended) out += `<rect x="86" y="${ry}" width="${W - 172}" height="${rowH - 10}" rx="14" fill="rgba(106,168,79,0.18)"/>`
      out += `<text x="110" y="${ry + 47}" font-family="Consolas, monospace" font-size="40" font-weight="700" fill="${C.text}">${esc(move)}</text>`
      if (recommended) out += pill('★ Best', 250, ry + 6, { height: 52, fontSize: 26 })
      out += `<text x="${W - 110}" y="${ry + 47}" font-family="${FONT}" font-size="40" font-weight="700" fill="${recommended ? C.accent : C.text}" text-anchor="end">${esc(evalText)}</text>`
    })
    y += 100 + s.rows.length * rowH
    const credit = { text: 'Evaluations: Lichess cloud analysis', x: W - 70, y: y + 32 }
    out += textLines(s.outro, 70, y + 90, { size: 34, color: C.muted, lineHeight: 1.4 })
    return { body: out, credit }
  },

  cta(s) {
    let out = logo(W / 2 - 90, 280, 180)
    out += textLines(s.title, W / 2, 620, { size: 92, weight: 700, anchor: 'middle', lineHeight: 1.12 })
    const bodyY = 620 + s.title.length * 103 + 50
    out += textLines(s.body, W / 2, bodyY, { size: 40, color: C.muted, anchor: 'middle', lineHeight: 1.45 })
    out += pill(s.pill ?? 'Link in bio', W / 2, bodyY + s.body.length * 58 + 40, { anchor: 'middle' })
    return { body: out }
  },
}

function renderSlide(slide, index, count) {
  const { body, credit } = templates[slide.type](slide)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.bg2}"/><stop offset="1" stop-color="${C.bg}"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    ${chrome(index, count, { credit })}
    ${body}
  </svg>`
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: { loadSystemFonts: false, fontFiles: FONT_FILES, defaultFontFamily: 'Segoe UI' },
  })
  return resvg.render().asPng()
}

// ---------- Ausgabe ----------
const only = process.argv[2]
const outDir = join(ROOT, 'out')
if (!only) rmSync(outDir, { recursive: true, force: true })

let captions = '# Instagram-Beiträge für @chesstrainerapp\n\nReihenfolge = Veröffentlichungsreihenfolge (der letzte Beitrag steht im Profil oben links).\n'
for (const [n, post] of posts.entries()) {
  const dir = join(outDir, `${String(n + 1).padStart(2, '0')}-${post.id}`)
  if (!only || only === post.id) {
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
    post.slides.forEach((slide, i) => writeFileSync(join(dir, `slide-${i + 1}.png`), renderSlide(slide, i, post.slides.length)))
    console.log(`✓ ${post.id} (${post.slides.length} Folien)`)
  }
  captions += `\n## ${n + 1}. ${post.id}\n\n${post.caption.trim()}\n\n${post.hashtags.join(' ')}\n`
}
if (!only) writeFileSync(join(outDir, 'captions.md'), captions)
