<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

interface AnkiStats {
  today: number
  totalReviews: number
  currentStreak: number
  days: [string, number][]
  updatedAt: string
  demo?: boolean
}

const stats = ref<AnkiStats | null>(null)
const failed = ref(false)

const days = computed(() => [...(stats.value?.days ?? [])].reverse())
const max = computed(() => Math.max(1, ...days.value.map(([, n]) => n)))
const updated = computed(() => {
  if (!stats.value?.updatedAt) return ''
  const d = new Date(stats.value.updatedAt)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString()
})

onMounted(async () => {
  try {
    const res = await fetch('/anki.json', { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data.days)) throw new Error('Bad stats payload')
    stats.value = data
  } catch {
    failed.value = true
  }
})
</script>

<template>
  <section class="section anki">
    <div class="head">
      <h2 class="section-title">Anki</h2>
      <span v-if="stats?.demo" class="badge">sample data</span>
    </div>

    <p v-if="failed" class="empty">Stats unavailable. Run <code>npm run anki</code> to export.</p>

    <template v-else-if="stats">
      <div class="metrics">
        <div><strong>{{ stats.today }}</strong><span>today</span></div>
        <div><strong>{{ stats.currentStreak }}</strong><span>day streak</span></div>
        <div><strong>{{ stats.totalReviews }}</strong><span>reviews</span></div>
      </div>

      <div class="chart" role="img" aria-label="Reviews per day, last 30 days">
        <div
          v-for="[date, count] in days"
          :key="date"
          class="bar-wrap"
          :title="`${date}: ${count} reviews`"
        >
          <div class="bar" :style="{ height: `${Math.max(2, (count / max) * 100)}%` }" />
        </div>
      </div>

      <p v-if="updated" class="updated">Updated {{ updated }}</p>
    </template>

    <p v-else class="empty">Loading stats…</p>
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

.badge {
  margin-bottom: 0.75rem;
  padding: 0.0625rem 0.375rem;
  border: 1px solid var(--border-subtle);
  border-radius: 0.25rem;
  color: var(--text-muted);
  font-size: 0.625rem;
}

.metrics {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.metrics div {
  display: flex;
  flex-direction: column;
}

.metrics strong {
  color: var(--text-accent);
  font-size: 1.125rem;
  line-height: 1.2;
}

.metrics span {
  color: var(--text-muted);
  font-size: 0.6875rem;
}

.chart {
  display: flex;
  align-items: flex-end;
  gap: 0.25rem;
  height: 4rem;
}

.bar-wrap {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
}

.bar {
  width: 100%;
  background: var(--accent);
  border-radius: 0.125rem 0.125rem 0 0;
  opacity: 0.8;
}

.updated,
.empty {
  margin-top: 0.5rem;
  color: var(--text-muted);
  font-size: 0.6875rem;
}

.empty code {
  color: var(--text-accent);
}
</style>
