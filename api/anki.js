// Anki tracker API: supports both Database Mode (Upstash Redis) and In-Memory Direct Mode (Database-Optional).

import { buildAnkiCardSvg } from './_anki-card.js'

const KEY = 'anki:stats'

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

// Fallback in-memory store when database is not configured
let inMemoryStats = null

// Short memo cache + circuit breaker: viral viewer spikes and Redis quota
// exhaustion must not multiply into one Redis command per request.
let memo = { data: null, at: 0 }
const breaker = { failures: 0, openUntil: 0 }

async function kvGet() {
  const now = Date.now()
  if (memo.data && now - memo.at < 2000) return memo.data
  if (redisUrl && redisToken && now >= breaker.openUntil) {
    try {
      const res = await fetch(redisUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['GET', KEY]),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      breaker.failures = 0
      if (json.result) {
        const data = JSON.parse(json.result)
        memo = { data, at: now }
        return data
      }
    } catch (err) {
      breaker.failures++
      if (breaker.failures >= 3) breaker.openUntil = Date.now() + 15_000
      console.warn('[anki-api] Redis read failed, falling back to memory:', err.message)
    }
  }
  return inMemoryStats
}

async function kvSet(data) {
  inMemoryStats = data
  memo = { data, at: Date.now() }
  if (redisUrl && redisToken) {
    try {
      await fetch(redisUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', KEY, JSON.stringify(data)]),
      })
    } catch (err) {
      console.warn('[anki-api] Redis write failed, kept in memory:', err.message)
    }
  }
}

function validDays(days) {
  return (
    Array.isArray(days) &&
    days.length <= 400 &&
    days.every(
      (d) =>
        Array.isArray(d) &&
        d.length === 2 &&
        typeof d[0] === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(d[0]) &&
        Number.isInteger(d[1]) &&
        d[1] >= 0 &&
        d[1] <= 100000,
    )
  )
}

function calculateStreak(days) {
  if (!days || !days.length) return 0
  const start = days[0][1] > 0 ? 0 : 1
  let streak = 0
  for (let i = start; i < days.length; i++) {
    if (days[i][1] <= 0) break
    streak++
  }
  return streak
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    const data = await kvGet()
    const params = new URL(req.url || '/', 'http://localhost').searchParams

    // Check presence freshness (TTL expiry check if offline or older than 45s)
    if (data?.presence) {
      const lastSeen = data.presence.updatedAt ? new Date(data.presence.updatedAt).getTime() : 0
      const now = Date.now()
      if (data.presence.status === 'offline' || (now - lastSeen > 45_000)) {
        data.presence.status = 'offline'
      }
    }

    // Embeddable SVG card: same data as the JSON endpoint, but hotlinkable in
    // a README. Render an empty card before the first push so it never 404s.
    if (params.get('format') === 'svg') {
      const weeks = Number.parseInt(params.get('weeks') || '', 10)
      const svg = buildAnkiCardSvg(data, {
        theme: params.get('theme') || 'tokyonight',
        weeks: Number.isNaN(weeks) ? 53 : weeks,
        title: params.get('title') || 'Anki reviews',
      })
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8')
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300')
      return res.status(200).end(svg)
    }

    if (!data) return res.status(404).json({ error: 'no stats yet, waiting for anki to push' })

    // Global (non-personalized) response: edge-cacheable so viral traffic
    // spikes don't multiply Redis/function load per viewer.
    res.setHeader('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=30')
    return res.status(200).json(data)
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'method not allowed' })
  }

  const expected = process.env.ANKI_TRACKER_TOKEN
  const given = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (expected && given !== expected) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  if (!body || body.v !== 1) {
    return res.status(400).json({ error: 'bad payload' })
  }
  if (body.days !== undefined && !validDays(body.days)) {
    return res.status(400).json({ error: 'bad payload' })
  }

  const existing = (await kvGet()) || {}

  // If this is an offline signal or partial update, preserve existing historical review days in Redis
  let days = existing.days || []
  if (Array.isArray(body.days) && body.days.length > 0) {
    if (body.days.length >= days.length || days.length === 0) {
      days = body.days
    }
  }

  const isOfflinePing = body.presence?.status === 'offline' && (!body.days || body.days.length === 0)
  const today = isOfflinePing
    ? (existing.today ?? (days[0]?.[1] ?? 0))
    : (Number.isInteger(body.today) ? body.today : (days[0]?.[1] ?? 0))
  const totalReviews = isOfflinePing
    ? (existing.totalReviews ?? days.reduce((sum, d) => sum + d[1], 0))
    : days.reduce((sum, d) => sum + d[1], 0)

  const currentStreak = Number.isInteger(body.currentStreak) && body.currentStreak > 0
    ? body.currentStreak
    : (existing.currentStreak || calculateStreak(days) || 0)

  let presence = body.presence || existing.presence || null
  if (presence) {
    presence = {
      ...presence,
      updatedAt: new Date().toISOString(),
    }
  }

  const totalCards = Number.isInteger(body.totalCards) ? body.totalCards : (existing.totalCards || null)

  const stats = {
    days,
    today,
    totalReviews,
    totalCards,
    currentStreak,
    updatedAt: new Date().toISOString(),
    presence,
    storage: redisUrl ? 'redis' : 'memory',
  }

  await kvSet(stats)
  return res.status(200).json({ ok: true, presence: stats.presence?.status, today, currentStreak, storage: stats.storage })
}
