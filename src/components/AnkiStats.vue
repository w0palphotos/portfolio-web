<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import AnkiDiscordCard from './AnkiDiscordCard.vue'

interface Presence {
  status: 'online' | 'offline'
  state?: string
  details?: string
  startedAt?: number
  icon?: string
}

interface AnkiStats {
  today: number
  totalReviews: number
  totalCards?: number
  currentStreak: number
  days: [string, number][]
  updatedAt: string
  topDeck?: { name: string } | string
  presence?: Presence
}

interface Cell {
  date: string
  count: number
  future: boolean
}

const stats = ref<AnkiStats | null>(null)
const displayStreak = computed(() => {
  if (stats.value?.currentStreak && stats.value.currentStreak > 0) return stats.value.currentStreak
  if (!stats.value?.days?.length) return 0
  const days = stats.value.days
  const start = days[0][1] > 0 ? 0 : 1
  let streak = 0
  for (let i = start; i < days.length; i++) {
    if (days[i][1] <= 0) break
    streak++
  }
  return streak
})
const loading = ref(true)
let pollTimer: ReturnType<typeof setInterval> | null = null

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', '']

function toISO(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const map = computed(() => new Map((stats.value?.days ?? []).map(([d, n]) => [d, n])))

const todayDate = new Date()
todayDate.setHours(0, 0, 0, 0)

const weeks = computed<Cell[][]>(() => {
  const end = new Date(todayDate)
  end.setDate(end.getDate() + (6 - end.getDay()))
  const start = new Date(end)
  start.setDate(start.getDate() - 52 * 7 - 6)

  const cols: Cell[][] = []
  const cur = new Date(start)
  let week: Cell[] = []
  while (cur <= end) {
    const iso = toISO(cur)
    week.push({ date: iso, count: map.value.get(iso) ?? 0, future: cur.getTime() > todayDate.getTime() })
    if (week.length === 7) {
      cols.push(week)
      week = []
    }
    cur.setDate(cur.getDate() + 1)
  }
  return cols
})

const maxCount = computed(() => {
  let m = 0
  for (const w of weeks.value) {
    for (const c of w) {
      if (!c.future && c.count > m) m = c.count
    }
  }
  return m
})

function level(count: number, future: boolean) {
  if (future || count <= 0) return 0
  const m = maxCount.value || 1
  const q = count / m
  if (q <= 0.25) return 1
  if (q <= 0.5) return 2
  if (q <= 0.75) return 3
  return 4
}

const monthLabels = computed(() => {
  const labels: { index: number; name: string }[] = []
  let last = -1
  weeks.value.forEach((w, i) => {
    const m = new Date(w[0].date + 'T00:00:00').getMonth()
    if (m !== last) {
      labels.push({ index: i, name: months[m] })
      last = m
    }
  })
  return labels.filter((l, i) => i === 0 || l.index - labels[i - 1].index >= 2)
})

const totalYear = computed(() => weeks.value.flat().reduce((s, c) => s + (c.future ? 0 : c.count), 0))

const updated = computed(() => {
  if (!stats.value?.updatedAt) return ''
  const d = new Date(stats.value.updatedAt)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString()
})

function title(c: Cell) {
  const n = c.count
  return `${n} review${n === 1 ? '' : 's'} on ${c.date}`
}

async function loadStats() {
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

onMounted(() => {
  loadStats()
  pollTimer = setInterval(loadStats, 3_000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <section class="section anki">
    <!-- Live Discord Presence Card when Anki is active on your device -->
    <AnkiDiscordCard v-if="stats?.presence?.status === 'online'" :presence="stats.presence" />

    <div class="head">
      <h2 class="section-title">Anki</h2>
    </div>

    <!-- Live Stats from Anki -->
    <template v-if="stats && stats.days.length">
      <p class="summary">
        <template v-if="stats.totalCards">{{ stats.totalCards.toLocaleString() }} cards · </template>
        {{ displayStreak }} day streak
        · {{ stats.today }} today
      </p>

      <div class="heat-wrap">
        <div class="heat" :style="{ '--cols': weeks.length }">
          <div class="months" aria-hidden="true">
            <span
              v-for="m in monthLabels"
              :key="`${m.index}-${m.name}`"
              class="month"
              :style="{ gridColumn: m.index + 2 }"
            >{{ m.name }}</span>
          </div>
          <div class="days" aria-hidden="true">
            <span v-for="(d, i) in dayLabels" :key="i" :style="{ gridRow: i + 2 }">{{ d }}</span>
          </div>
          <div class="grid" role="img" aria-label="Anki review activity in the last year">
            <template v-for="(week, wi) in weeks" :key="wi">
              <div
                v-for="(cell, di) in week"
                :key="cell.date"
                class="cell"
                :class="`l${level(cell.count, cell.future)}`"
                :style="{ gridColumn: wi + 2, gridRow: di + 2 }"
                :title="title(cell)"
              />
            </template>
          </div>
        </div>

        <div class="legend" aria-hidden="true">
          <span>Less</span>
          <i class="cell l0" /><i class="cell l1" /><i class="cell l2" /><i class="cell l3" /><i class="cell l4" />
          <span>More</span>
        </div>
      </div>

      <p v-if="updated" class="updated">Synced from Anki {{ updated }}</p>
    </template>

    <div v-else class="waiting-card">
      <p class="empty">Waiting for Anki sync… Open Anki to broadcast streak and review stats directly.</p>
    </div>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.summary {
  color: var(--text-secondary);
  font-size: 0.8125rem;
  margin-bottom: 0.75rem;
}

.heat-wrap {
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.heat {
  --size: 10px;
  --gap: 3px;
  --h0: var(--bg-surface);
  --h1: color-mix(in srgb, var(--accent) 22%, var(--bg-surface));
  --h2: color-mix(in srgb, var(--accent) 45%, var(--bg-surface));
  --h3: color-mix(in srgb, var(--accent) 72%, var(--bg-surface));
  --h4: var(--accent);
  display: inline-grid;
  grid-template-columns: auto repeat(var(--cols), var(--size));
  grid-template-rows: auto repeat(7, var(--size));
  gap: var(--gap);
  font-size: 10px;
  color: var(--text-muted);
}

.months,
.days,
.grid {
  display: contents;
}

.month {
  grid-row: 1;
  white-space: nowrap;
  line-height: 1;
  padding-bottom: 2px;
}

.days span {
  grid-column: 1;
  line-height: var(--size);
  padding-right: 6px;
}

.cell {
  width: var(--size);
  height: var(--size);
  border-radius: 2px;
  box-sizing: border-box;
}

.cell.l0 { background: var(--h0); box-shadow: inset 0 0 0 1px var(--border-subtle); }
.cell.l1 { background: var(--h1); }
.cell.l2 { background: var(--h2); }
.cell.l3 { background: var(--h3); }
.cell.l4 { background: var(--h4); }

.legend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 0.5rem;
  font-size: 10px;
  color: var(--text-muted);
}

.legend .cell {
  display: inline-block;
}

.updated,
.empty {
  margin-top: 0.5rem;
  color: var(--text-muted);
  font-size: 0.6875rem;
}

.waiting-card {
  padding: 1rem;
  border: 1px dashed var(--border-subtle);
  border-radius: 6px;
  margin-bottom: 1rem;
}
</style>
