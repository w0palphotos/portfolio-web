import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const endpoint = process.env.ANKI_CONNECT_URL || 'http://localhost:8765'

async function call(action) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, version: 6 }),
  })
  if (!res.ok) throw new Error(`AnkiConnect HTTP ${res.status}`)
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.result
}

try {
  const [today, rawDays] = await Promise.all([
    call('getNumCardsReviewedToday'),
    call('getNumCardsReviewedByDay'),
  ])

  const days = [...rawDays].sort((a, b) => String(b[0]).localeCompare(String(a[0])))
  let currentStreak = 0
  for (const [, count] of days) {
    if (!count) break
    currentStreak++
  }

  const stats = {
    today,
    totalReviews: days.reduce((sum, [, count]) => sum + count, 0),
    currentStreak,
    days: days.slice(0, 30),
    updatedAt: new Date().toISOString(),
  }

  const out = resolve(process.cwd(), 'public/anki.json')
  writeFileSync(out, JSON.stringify(stats, null, 2) + '\n', 'utf-8')
  console.log(`Wrote ${out} — ${stats.today} today, ${stats.totalReviews} total`)
} catch (e) {
  console.error(`Anki export failed: ${e.message}. Is Anki running with AnkiConnect?`)
  process.exit(1)
}
