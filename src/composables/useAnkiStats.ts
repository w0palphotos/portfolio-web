import { onMounted, onUnmounted, ref } from 'vue'

export interface AnkiPresence {
  status: 'online' | 'offline'
  state?: string
  details?: string
  startedAt?: number
  icon?: string
  updatedAt?: string
}

export interface AnkiStatsData {
  today: number
  totalReviews: number
  totalCards?: number
  currentStreak: number
  days: [string, number][]
  updatedAt: string
  topDeck?: { name: string } | string
  presence?: AnkiPresence
}

// Module-level singleton: the Status card and the Anki heatmap share one
// poll loop instead of each hitting the API separately.
const stats = ref<AnkiStatsData | null>(null)
const loading = ref(true)
let subscribers = 0
let pollTimer: ReturnType<typeof setInterval> | null = null

async function load() {
  const api = import.meta.env.VITE_ANKI_API || '/api/anki'
  try {
    const res = await fetch(api, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (Array.isArray(data.days)) {
      stats.value = data
      loading.value = false
    }
  } catch {
    // If not yet pushed, remains loading or shows waiting state
  }
}

export function useAnkiStats() {
  onMounted(() => {
    subscribers++
    if (subscribers === 1) {
      load()
      pollTimer = setInterval(load, 3_000)
    }
  })

  onUnmounted(() => {
    subscribers--
    if (subscribers <= 0 && pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
      subscribers = 0
    }
  })

  return { stats, loading }
}
