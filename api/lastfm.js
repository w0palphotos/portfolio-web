// Last.fm proxy. The browser only ever talks to /api/lastfm, so the API key
// stays on the server. Vite inlines every VITE_* value into the client bundle,
// which is why a VITE_LASTFM_API_KEY can never be a real secret (and why Vercel
// refuses to save it as one). The key here is intentionally called
// LASTFM_API_KEY, with no public framework prefix.

const TTL_MS = 30_000
const cache = new Map() // user -> { data, at }

async function fetchTrack(user, apiKey) {
  const url = new URL('https://ws.audioscrobbler.com/2.0/')
  url.searchParams.set('method', 'user.getrecenttracks')
  url.searchParams.set('user', user)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Last.fm HTTP ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(`Last.fm error ${data.error}`)

  const recent = data.recenttracks?.track?.[0]
  if (!recent || !recent['@attr']?.nowplaying) return null

  return {
    name: recent.name,
    artist: recent.artist?.['#text'] || '',
    album: recent.album?.['#text'] || '',
    image: recent.image?.[2]?.['#text'] || '',
    url: recent.url || '',
    nowplaying: true,
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30')

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method not allowed' })
  }

  const params = new URL(req.url || '/', 'http://localhost').searchParams
  const user = (params.get('user') || process.env.LASTFM_USERNAME || '').trim()
  const apiKey = (process.env.LASTFM_API_KEY || '').trim()

  if (!user || !apiKey) {
    return res.status(503).json({ error: 'Last.fm not configured (set LASTFM_API_KEY and LASTFM_USERNAME)' })
  }

  const cached = cache.get(user)
  if (cached && Date.now() - cached.at < TTL_MS) {
    return res.status(200).json({ track: cached.data })
  }

  try {
    const track = await fetchTrack(user, apiKey)
    cache.set(user, { data: track, at: Date.now() })
    return res.status(200).json({ track })
  } catch (err) {
    // Never log the URL: it contains the key.
    console.warn('[lastfm-api] upstream failed:', err.message)
    return res.status(502).json({ error: 'upstream unavailable' })
  }
}
