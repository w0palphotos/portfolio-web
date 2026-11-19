// Public read-only homelab shell API.
//
// Visitors POST whitelisted commands; a worker container on the homelab
// long-polls the queue, executes them against read-only host mounts, and
// POSTs the output back. Visitors poll GET ?id= for the result.
//
// Same storage pattern as api/anki.js: Upstash Redis when configured,
// in-memory fallback for local dev. Worker endpoints are token-guarded;
// visitor endpoints are open but strictly whitelisted + rate-limited.

const QUEUE_KEY = 'homelab:shell:queue'
const RESULT_PREFIX = 'homelab:shell:result:'
const RL_PREFIX = 'homelab:shell:rl:'
const GLOBAL_RL_KEY = 'homelab:shell:rl:global'
const BTOP_CD_KEY = 'homelab:shell:cd:btop'
const RESULT_TTL_S = 300
const JOB_MAX_AGE_MS = 30_000
const MAX_OUTPUT = 65_536
const MAX_QUEUE = 5
const GLOBAL_MAX_PER_MIN = 60
const BTOP_COOLDOWN_S = 8

// Canonical forms only — the worker re-validates before executing.
const WHITELIST = new Map([
  ['fastfetch', 'fastfetch'],
  ['btop', 'btop'],
  ['df', 'df -h'],
  ['df -h', 'df -h'],
  ['free', 'free -h'],
  ['free -h', 'free -h'],
  ['uptime', 'uptime'],
  ['uname', 'uname -a'],
  ['uname -a', 'uname -a'],
  ['hostname', 'hostname'],
  ['date', 'date'],
  ['lsblk', 'lsblk'],
])

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

// --- In-memory shield: shed floods BEFORE spending any Redis command -----
// Per-instance buckets are not globally accurate, but they bound how much
// load a flood can push into Redis; the Lua admission below is the truth.
const memIpHits = new Map()
let memInstanceWindow = { count: 0, resetAt: 0 }
const INSTANCE_MAX_PER_SEC = 20

function memPreFilterLimited(ip) {
  const now = Date.now()
  const entry = memIpHits.get(ip)
  if (!entry || entry.resetAt < now) {
    memIpHits.set(ip, { count: 1, resetAt: now + 2000 })
  } else {
    entry.count++
    if (entry.count > 1) return 'per-ip'
  }
  if (memIpHits.size > 10_000) {
    for (const [k, v] of memIpHits) if (v.resetAt < now) memIpHits.delete(k)
  }
  if (memInstanceWindow.resetAt < now) memInstanceWindow = { count: 0, resetAt: now + 1000 }
  memInstanceWindow.count++
  if (memInstanceWindow.count > INSTANCE_MAX_PER_SEC) return 'global'
  return null
}

// Finished results are immutable: cache them so repeat polls are free.
const resultCache = new Map()
function cacheResult(id, result) {
  resultCache.set(id, { result, expiresAt: Date.now() + RESULT_TTL_S * 1000 })
  if (resultCache.size > 2000) {
    const now = Date.now()
    for (const [k, v] of resultCache) if (v.expiresAt < now) resultCache.delete(k)
  }
}
function cachedResult(id) {
  const entry = resultCache.get(id)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    resultCache.delete(id)
    return null
  }
  return entry.result
}

// Circuit breaker: when Redis fails (e.g. quota exhausted), stop calling it
// for a while instead of burning more commands on a dying backend.
const breaker = { failures: 0, openUntil: 0 }
const breakerOpen = () => Date.now() < breaker.openUntil
function redisOk() {
  breaker.failures = 0
}
function redisFail() {
  breaker.failures++
  if (breaker.failures >= 3) breaker.openUntil = Date.now() + 15_000
}

// One EVAL = ONE Upstash command for the whole admission decision
// (per-IP limit, global cap, btop cooldown, queue cap, enqueue).
const ADMISSION_LUA = `
local ipn = redis.call('INCR', KEYS[1])
if ipn == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
if ipn > 1 then return {429, 'per-ip'} end
local g = redis.call('INCR', KEYS[2])
if g == 1 then redis.call('EXPIRE', KEYS[2], ARGV[3]) end
if g > tonumber(ARGV[2]) then return {429, 'global'} end
if ARGV[6] == '1' then
  local ok = redis.call('SET', KEYS[4], '1', 'NX', 'EX', ARGV[7])
  if not ok then return {429, 'btop'} end
end
if redis.call('LLEN', KEYS[3]) >= tonumber(ARGV[4]) then return {429, 'queue'} end
redis.call('RPUSH', KEYS[3], ARGV[5])
return {200, 'ok'}
`

const LIMIT_MSG = {
  'per-ip': 'slow down: one command per 2 seconds',
  global: 'too many commands right now. try again in a minute',
  btop: 'btop is cooling down. try again in a few seconds',
  queue: 'queue busy. try again in a moment',
}

// In-memory fallback (local dev without Redis)
const memQueue = []
const memResults = new Map()
const memRate = new Map()
let memGlobal = { count: 0, resetAt: 0 }
let memBtopReadyAt = 0

async function redis(command) {
  if (breakerOpen()) throw new Error('circuit open')
  try {
    const res = await fetch(redisUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) throw new Error(`redis HTTP ${res.status}`)
    const json = await res.json()
    if (json.error) throw new Error(json.error)
    redisOk()
    return json.result
  } catch (err) {
    redisFail()
    throw err
  }
}

const hasRedis = () => Boolean(redisUrl && redisToken)

async function enqueue(job) {
  if (hasRedis()) {
    const len = await redis(['LLEN', QUEUE_KEY])
    if (len >= MAX_QUEUE) return false
    await redis(['RPUSH', QUEUE_KEY, JSON.stringify(job)])
    return true
  }
  if (memQueue.length >= MAX_QUEUE) return false
  memQueue.push(job)
  return true
}

async function dequeue() {
  if (hasRedis()) {
    // Block up to 5s so the worker wakes immediately on new jobs
    const res = await redis(['BLPOP', QUEUE_KEY, '5'])
    if (!res) return null
    try {
      return JSON.parse(res[1])
    } catch {
      return null
    }
  }
  return memQueue.shift() || null
}

async function setResult(id, result) {
  if (hasRedis()) {
    await redis(['SET', RESULT_PREFIX + id, JSON.stringify(result), 'EX', String(RESULT_TTL_S)])
    return
  }
  memResults.set(id, { ...result, expiresAt: Date.now() + RESULT_TTL_S * 1000 })
}

async function getResult(id) {
  if (hasRedis()) {
    const raw = await redis(['GET', RESULT_PREFIX + id])
    return raw ? JSON.parse(raw) : null
  }
  const entry = memResults.get(id)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    memResults.delete(id)
    return null
  }
  return entry
}

// Max 1 command per 2s per IP
async function rateLimited(ip) {
  if (hasRedis()) {
    const key = RL_PREFIX + ip
    const count = await redis(['INCR', key])
    if (count === 1) await redis(['EXPIRE', key, '2'])
    return count > 1
  }
  const now = Date.now()
  const entry = memRate.get(ip)
  if (!entry || entry.resetAt < now) {
    memRate.set(ip, { count: 1, resetAt: now + 2000 })
    return false
  }
  entry.count++
  return entry.count > 1
}

// Global cap so a many-IP flood cannot burn the queue/Redis budget
async function globalRateLimited() {
  if (hasRedis()) {
    const count = await redis(['INCR', GLOBAL_RL_KEY])
    if (count === 1) await redis(['EXPIRE', GLOBAL_RL_KEY, '60'])
    return count > GLOBAL_MAX_PER_MIN
  }
  const now = Date.now()
  if (memGlobal.resetAt < now) memGlobal = { count: 0, resetAt: now + 60_000 }
  memGlobal.count++
  return memGlobal.count > GLOBAL_MAX_PER_MIN
}

// btop is the expensive command (3s capture): global cooldown
async function btopOnCooldown() {
  if (hasRedis()) {
    const ok = await redis(['SET', BTOP_CD_KEY, '1', 'NX', 'EX', String(BTOP_COOLDOWN_S)])
    return ok === null
  }
  const now = Date.now()
  if (now < memBtopReadyAt) return true
  memBtopReadyAt = now + BTOP_COOLDOWN_S * 1000
  return false
}

function clientIp(req) {
  // Vercel's edge sets x-vercel-forwarded-for to the true client IP.
  // Client-supplied x-forwarded-for is NOT trusted — it is spoofable and
  // would let an attacker rotate fake IPs to bypass the per-IP limit.
  const vercel = req.headers['x-vercel-forwarded-for']
  if (typeof vercel === 'string' && vercel.length > 0) return vercel.trim()
  const real = req.headers['x-real-ip']
  if (typeof real === 'string' && real.length > 0) return real.trim()
  return req.socket?.remoteAddress || 'unknown'
}

function ipBucket(ip) {
  // IPv6: limit the whole /64 — individual addresses are trivial to rotate
  if (ip.includes(':')) return ip.split(':').slice(0, 4).join(':') + '::/64'
  return ip
}

function workerAuthorized(req) {
  const expected = process.env.HOMELAB_SHELL_TOKEN
  if (!expected) return false
  const given = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  return given === expected
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const url = new URL(req.url, 'http://localhost')

  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store')

    // Worker long-poll
    if (url.searchParams.get('worker') === 'poll') {
      if (!workerAuthorized(req)) {
        return res.status(401).json({ error: 'unauthorized' })
      }
      try {
        const job = await dequeue()
        if (job && Date.now() - job.createdAt > JOB_MAX_AGE_MS) {
          return res.status(200).json({ job: null })
        }
        return res.status(200).json({ job: job || null })
      } catch (err) {
        console.warn('[terminal-api] dequeue failed:', err.message)
        return res.status(200).json({ job: null })
      }
    }

    // Visitor result poll
    const id = url.searchParams.get('id')
    if (id && /^[a-zA-Z0-9-]{8,64}$/.test(id)) {
      const cached = cachedResult(id)
      if (cached) return res.status(200).json({ status: 'done', ...cached })
      try {
        const result = await getResult(id)
        if (result) {
          cacheResult(id, result)
          return res.status(200).json({ status: 'done', ...result })
        }
        return res.status(200).json({ status: 'pending' })
      } catch (err) {
        console.warn('[terminal-api] result read failed:', err.message)
        return res.status(200).json({ status: 'pending' })
      }
    }

    return res.status(400).json({ error: 'missing id' })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'method not allowed' })
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'bad payload' })
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'bad payload' })
  }

  // Worker posting a result
  if (body.action === 'result') {
    if (!workerAuthorized(req)) {
      return res.status(401).json({ error: 'unauthorized' })
    }
    const { id, output, exitCode, command, durationMs } = body
    if (
      typeof id !== 'string' || !/^[a-zA-Z0-9-]{8,64}$/.test(id) ||
      typeof output !== 'string' || output.length > MAX_OUTPUT ||
      !Number.isInteger(exitCode)
    ) {
      return res.status(400).json({ error: 'bad payload' })
    }
    await setResult(id, {
      output,
      exitCode,
      command: typeof command === 'string' ? command.slice(0, 64) : null,
      durationMs: Number.isFinite(durationMs) ? durationMs : null,
      finishedAt: new Date().toISOString(),
    })
    return res.status(200).json({ ok: true })
  }

  // Visitor submitting a command
  if (body.action === 'run') {
    const raw = typeof body.command === 'string' ? body.command : ''
    const normalized = raw.trim().toLowerCase().replace(/\s+/g, ' ')
    const canonical = WHITELIST.get(normalized)
    if (!canonical) {
      return res.status(400).json({
        error: 'command not allowed',
        allowed: [...new Set(WHITELIST.values())],
      })
    }
    const ip = ipBucket(clientIp(req))

    // Zero-cost shield first: hot floods die in memory, never reach Redis.
    const preLimited = memPreFilterLimited(ip)
    if (preLimited) {
      return res.status(429).json({ error: LIMIT_MSG[preLimited] })
    }
    if (breakerOpen()) {
      return res.status(503).json({ error: 'tracker busy. try again shortly' })
    }

    const job = {
      id: crypto.randomUUID(),
      command: canonical,
      createdAt: Date.now(),
    }

    if (hasRedis()) {
      // Single atomic EVAL: one Upstash command for the entire admission.
      try {
        const verdict = await redis([
          'EVAL', ADMISSION_LUA, '4',
          RL_PREFIX + ip, GLOBAL_RL_KEY, QUEUE_KEY, BTOP_CD_KEY,
          '2', String(GLOBAL_MAX_PER_MIN), '60', String(MAX_QUEUE),
          JSON.stringify(job), canonical === 'btop' ? '1' : '0', String(BTOP_COOLDOWN_S),
        ])
        const code = Array.isArray(verdict) ? verdict[0] : 500
        if (code === 429) {
          return res.status(429).json({ error: LIMIT_MSG[verdict[1]] || 'busy' })
        }
        if (code !== 200) {
          return res.status(503).json({ error: 'tracker busy. try again shortly' })
        }
        return res.status(200).json({ id: job.id, command: canonical })
      } catch (err) {
        console.warn('[terminal-api] submit failed:', err.message)
        return res.status(503).json({ error: 'tracker busy. try again shortly' })
      }
    }

    // In-memory fallback (local dev without Redis)
    try {
      if (await rateLimited(ip)) {
        return res.status(429).json({ error: LIMIT_MSG['per-ip'] })
      }
      if (await globalRateLimited()) {
        return res.status(429).json({ error: LIMIT_MSG.global })
      }
      if (canonical === 'btop' && (await btopOnCooldown())) {
        return res.status(429).json({ error: LIMIT_MSG.btop })
      }
      const queued = await enqueue(job)
      if (!queued) {
        return res.status(429).json({ error: LIMIT_MSG.queue })
      }
      return res.status(200).json({ id: job.id, command: canonical })
    } catch (err) {
      console.warn('[terminal-api] submit failed:', err.message)
      return res.status(503).json({ error: 'tracker busy. try again shortly' })
    }
  }

  return res.status(400).json({ error: 'unknown action' })
}
