// SVG renderer for the embeddable Anki review card. No runtime dependencies.

const THEMES = {
  tokyonight: {
    bg: '#1a1b26', border: '#2f334d', text: '#c0caf5', muted: '#7a82a3',
    levels: ['#23263a', '#2b436e', '#37579b', '#4a75d0', '#7aa2f7'],
    future: '#1c1f2e', accent: '#7aa2f7',
  },
  dark: {
    bg: '#0d1117', border: '#30363d', text: '#e6edf3', muted: '#8b949e',
    levels: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
    future: '#10151c', accent: '#39d353',
  },
  light: {
    bg: '#ffffff', border: '#d0d7de', text: '#1f2328', muted: '#59636e',
    levels: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    future: '#f6f8fa', accent: '#1a7f37',
  },
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_MS = 86_400_000
const SANS = 'Verdana, Geneva, DejaVu Sans, sans-serif'
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[ch])
}

function num(value) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function fmt(value) {
  return new Intl.NumberFormat('en-US').format(num(value))
}

function parseDay(iso) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!parts) return null
  const ms = Date.UTC(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]))
  return Number.isNaN(ms) ? null : ms
}

function isoDay(ms) {
  return new Date(ms).toISOString().slice(0, 10)
}

function formatDay(input) {
  if (!input) return 'unknown'
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return 'unknown'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(date)
}

function levelFor(count, max) {
  if (count <= 0) return 0
  const ratio = count / (max || 1)
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

export function buildAnkiCardSvg(stats, options = {}) {
  const weeks = Math.max(4, Math.min(53, Math.trunc(Number(options.weeks)) || 53))
  const theme = THEMES[options.theme] ? options.theme : 'tokyonight'
  const c = THEMES[theme]
  const title = String(options.title || 'Anki reviews').slice(0, 48) || 'Anki reviews'
  const data = stats && typeof stats === 'object' ? stats : {}

  const counts = new Map()
  for (const row of Array.isArray(data.days) ? data.days : []) {
    if (Array.isArray(row) && parseDay(row[0]) !== null) {
      counts.set(row[0], num(row[1]))
    }
  }

  const reviews = num(data.totalReviews ?? [...counts.values()].reduce((sum, n) => sum + n, 0))
  const cards = num(data.totalCards)
  const streak = num(data.currentStreak)
  const today = num(data.today)
  const online = data.presence?.status === 'online'
  const synced = formatDay(data.updatedAt)

  const statsLine = cards
    ? `${fmt(reviews)} reviews · ${fmt(cards)} cards · ${fmt(streak)} day streak`
    : `${fmt(reviews)} reviews · ${fmt(streak)} day streak`
  const footerLine = `Today: ${fmt(today)} · Synced ${synced}`

  const cell = 10
  const gap = 3
  const pitch = cell + gap
  const gutter = 30
  const pad = 16
  const headerHeight = 58
  const monthRow = 14
  const legendRow = 18
  const footerRow = 18
  const gridHeight = 7 * pitch - gap
  const gridWidth = gutter + weeks * pitch - gap
  const textWidth = Math.max(statsLine.length, footerLine.length) * 6.2
  const width = Math.ceil(Math.max(pad * 2 + gridWidth, pad * 2 + textWidth))
  const height = pad * 2 + headerHeight + monthRow + gridHeight + legendRow + footerRow
  const gridTop = pad + headerHeight + monthRow
  const gridX = pad + gutter

  const out = []
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">`)
  out.push(`<title>${esc(title)}</title>`)
  out.push(`<desc>${esc(fmt(reviews))} reviews, ${esc(fmt(streak))} day streak, synced ${esc(synced)}.</desc>`)
  out.push(`<rect width="${width}" height="${height}" rx="8" fill="${c.bg}" stroke="${c.border}"/>`)
  out.push(`<circle cx="${pad + 5}" cy="${pad + 16}" r="4" fill="${online ? c.accent : c.muted}"/>`)
  out.push(`<text x="${pad + 18}" y="${pad + 20}" fill="${c.text}" font-family="${SANS}" font-size="14" font-weight="600">${esc(title)}</text>`)

  out.push(`<text x="${pad}" y="${pad + 40}" fill="${c.muted}" font-family="${SANS}" font-size="11">${esc(statsLine)}</text>`)

  if (counts.size === 0) {
    out.push(`<text x="${gridX + 8}" y="${gridTop + 36}" fill="${c.muted}" font-family="${SANS}" font-size="12">Waiting for Anki sync</text>`)
  } else {
    // Anchor the last column to the newest pushed day. Using the ISO dates as
    // UTC avoids shifting a whole column when the server and Anki disagree on
    // timezone, and hides future cells without inventing data.
    const newest = Math.max(...[...counts.keys()].map(parseDay))
    const weekday = new Date(newest).getUTCDay()
    const end = newest + (6 - weekday) * DAY_MS
    const start = end - (weeks * 7 - 1) * DAY_MS

    const visible = new Map()
    for (let col = 0; col < weeks; col++) {
      for (let row = 0; row < 7; row++) {
        const day = start + (col * 7 + row) * DAY_MS
        if (day <= newest) visible.set(isoDay(day), counts.get(isoDay(day)) || 0)
      }
    }
    const max = Math.max(1, ...visible.values())

    for (const [row, label] of [[1, 'Mon'], [3, 'Wed'], [5, 'Fri']]) {
      out.push(`<text x="${pad + 8}" y="${gridTop + row * pitch + 8}" fill="${c.muted}" font-family="${SANS}" font-size="9">${label}</text>`)
    }

    let lastMonth = -1
    let lastLabelCol = -99
    for (let col = 0; col < weeks; col++) {
      const colStart = start + col * 7 * DAY_MS
      const month = new Date(colStart).getUTCMonth()
      if (month !== lastMonth && col - lastLabelCol >= 2) {
        out.push(`<text x="${gridX + col * pitch}" y="${gridTop - 4}" fill="${c.muted}" font-family="${SANS}" font-size="9">${MONTHS[month]}</text>`)
        lastLabelCol = col
      }
      lastMonth = month

      for (let row = 0; row < 7; row++) {
        const day = colStart + row * DAY_MS
        const iso = isoDay(day)
        const future = day > newest
        const count = future ? 0 : (visible.get(iso) || 0)
        const level = future ? 'future' : levelFor(count, max)
        const fill = future ? c.future : c.levels[level]
        const x = gridX + col * pitch
        const y = gridTop + row * pitch
        out.push(`<rect data-cell="1" data-level="${level}" x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" fill="${fill}"><title>${count} review${count === 1 ? '' : 's'} on ${iso}</title></rect>`)
      }
    }

    const legendY = gridTop + gridHeight + 12
    out.push(`<text x="${gridX}" y="${legendY + 8}" fill="${c.muted}" font-family="${SANS}" font-size="9">Less</text>`)
    c.levels.forEach((fill, i) => {
      out.push(`<rect x="${gridX + 28 + i * 12}" y="${legendY}" width="9" height="9" rx="2" fill="${fill}"/>`)
    })
    out.push(`<text x="${gridX + 28 + c.levels.length * 12 + 4}" y="${legendY + 8}" fill="${c.muted}" font-family="${SANS}" font-size="9">More</text>`)
  }

  const footerY = gridTop + gridHeight + legendRow + footerRow - 6
  out.push(`<text x="${pad}" y="${footerY}" fill="${c.muted}" font-family="${MONO}" font-size="10">${esc(footerLine)}</text>`)
  out.push('</svg>')
  return out.join('\n')
}
