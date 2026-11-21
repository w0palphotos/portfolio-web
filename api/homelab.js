// Homelab tracker API: the fetch collector (Docker container on the homelab)
// POSTs fastfetch stats here; the Now page polls GET. Same storage pattern as
// api/anki.js: Upstash Redis when configured, in-memory fallback otherwise.
//
// The lab is considered offline when no push arrived within OFFLINE_AFTER_MS
// (powered off, asleep, or network down) — the frontend then shows
// "the homelab is turned off".
// With HOMELAB_LOCAL_STORE=1 the dev API reads/writes a local JSON file so the
// collector never spends Upstash commands. Vercel proxies GET to that file.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const KEY = 'homelab:stats'
const OFFLINE_AFTER_MS = 90_000
const localStore = process.env.HOMELAB_LOCAL_STORE === '1'
  ? resolve(process.env.HOMELAB_STORE_PATH || '.data/homelab.json')
  : null

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

// Fallback in-memory store when database is not configured
let inMemoryStats = null

// Short memo cache + circuit breaker: viral viewer spikes and Redis quota
// exhaustion must not multiply into one Redis command per request.
let memo = { data: null, at: 0 }
const breaker = { failures: 0, openUntil: 0 }

async function kvGet() {
  if (localStore) {
    try {
      return JSON.parse(readFileSync(localStore, 'utf8'))
    } catch {
      return inMemoryStats
    }
  }
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
      console.warn('[homelab-api] Redis read failed, falling back to memory:', err.message)
    }
  }
  return inMemoryStats
}

async function kvSet(data) {
  inMemoryStats = data
  memo = { data, at: Date.now() }
  if (localStore) {
    mkdirSync(dirname(localStore), { recursive: true })
    writeFileSync(localStore, JSON.stringify(data))
    return
  }
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
      console.warn('[homelab-api] Redis write failed, kept in memory:', err.message)
    }
  }
}

function str(value, max) {
  return typeof value === 'string' ? value.slice(0, max) : null
}

function usage(value) {
  if (!value || !Number.isFinite(value.used) || !Number.isFinite(value.total) || value.total <= 0) return null
  return { used: Math.max(0, value.used), total: value.total }
}

function validPayload(body) {
  return (
    body &&
    body.v === 1 &&
    typeof body.hostname === 'string' &&
    body.hostname.length > 0 &&
    body.hostname.length <= 64 &&
    Number.isFinite(body.uptimeMs) &&
    body.uptimeMs >= 0 &&
    usage(body.memory) !== null &&
    usage(body.disk) !== null
  )
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    // Global (non-personalized) response: let the Vercel edge cache it so
    // thousands of concurrent viewers don't each hit Redis/the function.
    res.setHeader('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=30')
    const data = await kvGet()
    if (!data) return res.status(200).json({ online: false })

    const age = Date.now() - new Date(data.updatedAt).getTime()
    if (!Number.isFinite(age) || age > OFFLINE_AFTER_MS) {
      // Keep the last known identity so the terminal prompt stays familiar
      return res.status(200).json({
        online: false,
        lastSeen: data.updatedAt,
        hostname: data.hostname,
        user: data.user,
      })
    }
    return res.status(200).json({ online: true, ...data })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'method not allowed' })
  }

  // Fail closed: without a configured token, refuse pushes instead of
  // accepting anonymous writes.
  const expected = process.env.HOMELAB_TRACKER_TOKEN
  if (!expected) {
    return res.status(503).json({ error: 'tracker not configured (set HOMELAB_TRACKER_TOKEN)' })
  }
  const given = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (given !== expected) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'bad payload' })
  }
  if (!validPayload(body)) {
    return res.status(400).json({ error: 'bad payload' })
  }

  const cpu = body.cpu && typeof body.cpu === 'object' ? body.cpu : null
  const stats = {
    hostname: str(body.hostname, 64),
    user: str(body.user, 32),
    os: str(body.os, 128),
    host: str(body.host, 128),
    kernel: str(body.kernel, 128),
    uptimeMs: body.uptimeMs,
    cpu: cpu
      ? {
          model: str(cpu.model, 128),
          cores: Number.isFinite(cpu.cores) ? cpu.cores : null,
          maxFreqGHz: Number.isFinite(cpu.maxFreqGHz) ? cpu.maxFreqGHz : null,
        }
      : null,
    gpu: str(body.gpu, 160),
    memory: usage(body.memory),
    swap: usage(body.swap),
    disk: { ...usage(body.disk), fs: str(body.disk.fs, 32) },
    load: Array.isArray(body.load) ? body.load.slice(0, 3).filter(Number.isFinite) : null,
    ip: str(body.ip, 64),
    updatedAt: new Date().toISOString(),
  }

  await kvSet(stats)
  return res.status(200).json({ ok: true, hostname: stats.hostname })
}
