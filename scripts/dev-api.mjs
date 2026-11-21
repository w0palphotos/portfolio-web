// Local dev API for `vite dev` (which proxies /api/* to localhost:3001).
// Serves the same Vercel-style handlers used in production, backed by the
// in-memory fallback when Upstash is not configured.
//
// Run: node --env-file=.env scripts/dev-api.mjs

import { createServer } from 'node:http'
import anki from '../api/anki.js'
import homelab from '../api/homelab.js'
import terminal from '../api/terminal.js'
import lastfm from '../api/lastfm.js'

const routes = new Map([
  ['/api/anki', anki],
  ['/api/homelab', homelab],
  ['/api/terminal', terminal],
  ['/api/lastfm', lastfm],
])

function parseBody(raw, contentType) {
  if (!raw) return undefined
  if ((contentType || '').includes('application/json')) {
    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  }
  return raw
}

const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname
  const handler = routes.get(pathname)
  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: 'not found' }))
  }

  let raw = ''
  for await (const chunk of req) raw += chunk

  const adaptedReq = {
    method: req.method,
    headers: req.headers,
    url: req.url,
    socket: req.socket,
    body: parseBody(raw, req.headers['content-type']),
  }

  const adaptedRes = {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(obj) {
      this.setHeader('Content-Type', 'application/json')
      res.writeHead(this.statusCode, this.headers)
      res.end(JSON.stringify(obj))
    },
    end(payload) {
      res.writeHead(this.statusCode, this.headers)
      res.end(payload)
    },
  }

  try {
    await handler(adaptedReq, adaptedRes)
  } catch (err) {
    console.error(`[dev-api] ${pathname} failed:`, err)
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'internal error' }))
    }
  }
})

const port = Number(process.env.PORT) || 3001
server.listen(port, () => {
  console.log(`[dev-api] listening on http://localhost:${port} (routes: ${[...routes.keys()].join(', ')})`)
})
