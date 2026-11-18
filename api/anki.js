// Anki tracker API: supports both Database Mode (Upstash Redis) and In-Memory Direct Mode (Database-Optional).

const KEY = 'anki:stats'

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

// Fallback in-memory store when database is not configured
let inMemoryStats = null

async function kvGet() {
  if (redisUrl && redisToken) {
    try {
      const res = await fetch(redisUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['GET', KEY]),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.result) return JSON.parse(json.result)
      }
    } catch (err) {
      console.warn('[anki-api] Redis read failed, falling back to memory:', err.message)
    }
  }
  return inMemoryStats
}

async function kvSet(data) {
  inMemoryStats = data
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
    if (!data) return res.status(404).json({ error: 'no stats yet, waiting for anki to push' })

    // Check presence freshness (TTL expiry check if offline or older than 45s)
    if (data.presence) {
      const lastSeen = data.presence.updatedAt ? new Date(data.presence.updatedAt).getTime() : 0
      const now = Date.now()
      if (data.presence.status === 'offline' || (now - lastSeen > 45_000)) {
        data.presence.status = 'offline'
      }
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
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
  if (!body || body.v !== 1 || !validDays(body.days)) {
    return res.status(400).json({ error: 'bad payload' })
  }

  const existing = (await kvGet()) || {}
  const days = body.days && body.days.length ? body.days : (existing.days || [])
  const today = days[0]?.[1] ?? 0
  const totalReviews = days.reduce((sum, d) => sum + d[1], 0)
  const currentStreak = Number.isInteger(body.currentStreak) && body.currentStreak > 0
    ? body.currentStreak
    : (calculateStreak(days) || existing.currentStreak || 0)

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
