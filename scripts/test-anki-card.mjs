import assert from 'node:assert/strict'
import test from 'node:test'
import { XMLValidator } from 'fast-xml-parser'
import { buildAnkiCardSvg } from '../api/_anki-card.js'

function sampleStats(endIso = '2026-11-28') {
  const end = Date.parse(`${endIso}T00:00:00Z`)
  const days = []
  for (let i = 0; i < 371; i++) {
    const day = new Date(end - i * 86_400_000)
    days.push([day.toISOString().slice(0, 10), i % 7 === 0 ? 0 : (i % 40)])
  }
  return {
    days,
    today: 12,
    totalReviews: 3121,
    totalCards: 1501,
    currentStreak: 43,
    updatedAt: '2026-11-28T18:58:36.000Z',
    presence: { status: 'online' },
  }
}

function has(svg, pattern, label) {
  assert.ok(pattern.test(svg), label)
}

test('renders a self-contained, well-formed SVG with a full year of cells', () => {
  const svg = buildAnkiCardSvg(sampleStats())
  assert.equal(XMLValidator.validate(svg), true)
  has(svg, /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="748" height="228"/, 'dimensions')
  assert.equal((svg.match(/data-cell="1"/g) || []).length, 53 * 7)
  has(svg, /3,121 reviews · 1,501 cards · 43 day streak/, 'summary')
  has(svg, /Today: 12 · Synced 28 Nov 2026/, 'footer')
  assert.doesNotMatch(svg, /<script|href=|@import/)
})

test('anchors the grid on the newest pushed day and marks future cells', () => {
  const svg = buildAnkiCardSvg(sampleStats('2026-11-25'), { weeks: 4 })
  assert.equal((svg.match(/data-cell="1"/g) || []).length, 4 * 7)
  has(svg, /data-level="future"/, 'future cells')
  has(svg, /data-level="4"/, 'top level')
  has(svg, /<text x="24" y="\d+"[^>]*>Mon<\/text>/, 'day label')
  has(svg, /on 2026-11-25<\/title>/, 'newest day in grid')
})

test('renders a waiting card before the first push instead of an error', () => {
  const svg = buildAnkiCardSvg(null)
  assert.equal(XMLValidator.validate(svg), true)
  has(svg, /Waiting for Anki sync/, 'waiting label')
  assert.equal((svg.match(/data-cell="1"/g) || []).length, 0)
  has(svg, /Synced unknown/, 'unknown sync date')
})

test('escapes a custom title and clamps options', () => {
  const svg = buildAnkiCardSvg(sampleStats(), {
    title: '<script>alert("x")</script>',
    theme: 'unknown',
    weeks: 999,
  })
  assert.equal(XMLValidator.validate(svg), true)
  assert.doesNotMatch(svg, /<script>/)
  has(svg, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/, 'escaped title')
  assert.equal((svg.match(/data-cell="1"/g) || []).length, 53 * 7)
  has(svg, /fill="#1a1b26"/, 'default theme')
})

test('honours the dark and light palettes', () => {
  has(buildAnkiCardSvg(sampleStats(), { theme: 'dark' }), /fill="#0d1117"/, 'dark')
  has(buildAnkiCardSvg(sampleStats(), { theme: 'light' }), /fill="#ffffff"/, 'light')
})
