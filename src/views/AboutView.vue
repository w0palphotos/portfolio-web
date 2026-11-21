<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAboutPage } from '@/composables/useAboutPage'
import { machines } from '@/data/about'
import { useI18n } from '@/i18n'

const { aboutData } = useAboutPage()
const { t } = useI18n()

interface Usage { used: number; total: number }
interface HomelabStats {
  online: boolean
  lastSeen?: string
  host?: string | null
  hostname?: string | null
  user?: string | null
  cpu?: { model: string | null; cores: number | null; maxFreqGHz: number | null } | null
  memory?: Usage | null
  disk?: (Usage & { fs?: string | null }) | null
  gpu?: string | null
  os?: string | null
  kernel?: string | null
  uptimeMs?: number
  updatedAt?: string
}
interface SpecRow { label: string; value: string }

const homelabStats = ref<HomelabStats | null>(null)
const homelabState = ref<'loading' | 'online' | 'offline'>('loading')
let pollTimer: ReturnType<typeof setInterval> | null = null

async function loadHomelab() {
  const api = import.meta.env.VITE_HOMELAB_API || '/api/homelab'
  try {
    const res = await fetch(api, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as HomelabStats
    homelabStats.value = data
    homelabState.value = data.online ? 'online' : 'offline'
  } catch {
    homelabState.value = 'offline'
  }
}
onMounted(() => {
  loadHomelab()
  pollTimer = setInterval(loadHomelab, 3000)
})
onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

function fmtBytes(n: number | undefined | null): string {
  if (n == null || !Number.isFinite(n)) return '0 B'
  const gib = n / 1024 ** 3
  if (gib >= 1) return `${gib.toFixed(1)} GiB`
  const mib = n / 1024 ** 2
  if (mib >= 1) return `${mib.toFixed(0)} MiB`
  return `${(n / 1024).toFixed(0)} KiB`
}

function fmtUptime(ms: number): string {
  const mins = Math.floor(ms / 60_000)
  const days = Math.floor(mins / 1440)
  const hours = Math.floor((mins % 1440) / 60)
  const parts: string[] = []
  if (days) parts.push(`${days}d`)
  if (hours) parts.push(`${hours}h`)
  parts.push(`${mins % 60}m`)
  return parts.join(' ')
}

const homelabName = computed(() => homelabStats.value?.host || 'Homelab')
const homelabRows = computed<SpecRow[]>(() => {
  const s = homelabStats.value
  if (!s) return []
  const rows: SpecRow[] = []
  if (s.host) rows.push({ label: 'Host', value: s.host })
  if (s.user && s.hostname) rows.push({ label: 'Hostname', value: `${s.user}@${s.hostname}` })
  if (s.cpu?.model) {
    const cores = s.cpu.cores ? `, ${s.cpu.cores} cores` : ''
    const freq = s.cpu.maxFreqGHz ? ` @ ${s.cpu.maxFreqGHz} GHz` : ''
    rows.push({ label: 'CPU', value: `${s.cpu.model}${cores}${freq}` })
  }
  if (s.memory) rows.push({ label: 'RAM', value: `${fmtBytes(s.memory.used)} / ${fmtBytes(s.memory.total)}` })
  if (s.disk) rows.push({ label: 'Disk', value: `${fmtBytes(s.disk.used)} / ${fmtBytes(s.disk.total)}${s.disk.fs ? ` ${s.disk.fs}` : ''}` })
  if (s.gpu) rows.push({ label: 'GPU', value: s.gpu })
  if (s.os) rows.push({ label: 'OS', value: s.os })
  if (s.kernel) rows.push({ label: 'Kernel', value: s.kernel })
  if (s.uptimeMs) rows.push({ label: 'Uptime', value: fmtUptime(s.uptimeMs) })
  return rows
})
const homelabLastSeen = computed(() => {
  const raw = homelabStats.value?.lastSeen || homelabStats.value?.updatedAt
  if (!raw) return ''
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString()
})

function linkParts(text: string): { text: string; to: string | null }[] {
  const parts: { text: string; to: string | null }[] = []
  const re = /\[\[([^\]|]+)\|([^\]]+)\]\]/g
  let last = 0
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), to: null })
    parts.push({ text: m[1], to: m[2] })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), to: null })
  return parts
}
</script>

<template>
  <main class="container page">
    <h1 class="page-title">{{ t('about.title') }}</h1>
    <p class="page-subtitle">{{ t('about.subtitle') }}</p>

    <section class="section">
      <template v-for="(para, i) in aboutData.aboutParagraphs" :key="i">
        <p v-if="para !== 'about.cameraPhoto' && t(para)" class="bio">
          <template v-for="(part, j) in linkParts(t(para))" :key="j">
            <router-link v-if="part.to" :to="part.to">{{ part.text }}</router-link>
            <template v-else>{{ part.text }}</template>
          </template>
        </p>
        <figure v-else-if="para === 'about.cameraPhoto'" class="camera-photo">
          <img src="/images/fujifilm-x-t10.webp" :alt="t('about.photoAlt')" loading="lazy" width="1067" height="1600" />
          <figcaption v-if="t('about.photoCaption')">{{ t('about.photoCaption') }}</figcaption>
        </figure>
      </template>
    </section>

    <section class="section">
      <h2 class="section-title">{{ t('about.machines') }}</h2>
      <div class="machines">
        <article class="machine">
          <div class="machine-head">
            <h3 class="machine-name">{{ homelabName }}</h3>
          </div>
          <template v-if="homelabState === 'online' && homelabStats">
            <dl class="specs">
              <template v-for="row in homelabRows" :key="row.label">
                <dt>{{ row.label }}</dt>
                <dd>{{ row.value }}</dd>
              </template>
            </dl>
            <p class="machine-note">{{ t('about.note.homelabLive') }}</p>
          </template>
          <p v-else-if="homelabState === 'offline'" class="machine-note">
            {{ t('homelab.offline') }}
            <template v-if="homelabLastSeen">{{ t('homelab.lastSeen', { time: homelabLastSeen }) }}</template>
          </p>
          <p v-else class="machine-note">{{ t('homelab.connecting') }}</p>
        </article>
        <article v-for="m in machines" :key="m.name" class="machine" :class="{ retired: m.retired }">
          <div class="machine-head">
            <h3 class="machine-name">{{ m.name }}</h3>
          </div>
          <dl class="specs">
            <template v-for="s in m.specs" :key="s.label">
              <dt>{{ s.label }}</dt>
              <dd>{{ s.value }}</dd>
            </template>
          </dl>
          <p v-if="m.note" class="machine-note">{{ t(m.note) }}</p>
        </article>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">{{ t('about.desk') }}</h2>
      <div class="desk-photos">
        <figure class="wide">
          <img src="/images/desk-setup.webp" :alt="t('about.deskAlt1')" loading="lazy" width="1600" height="1200" />
        </figure>
        <figure>
          <img src="/images/homelab-desk.webp" :alt="t('about.deskAlt2')" loading="lazy" width="1600" height="1200" />
        </figure>
        <figure>
          <img src="/images/laptop-setup.webp" :alt="t('about.laptopAlt')" loading="lazy" width="1600" height="1200" />
        </figure>
      </div>
    </section>

  </main>
</template>

<style scoped>
.page {
  padding: 3rem 1.5rem;
}

.page-title {
  font-size: clamp(1.3rem, 4vw, 1.7rem);
  font-weight: 700;
  margin-bottom: 0.375rem;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 0.9375rem;
  margin-bottom: 2rem;
}

.section {
  margin-bottom: 2.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.bio {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: var(--text-secondary);
  max-width: 66ch;
  margin-bottom: 1rem;
}

.bio a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.bio a:hover {
  color: var(--accent-hover);
}

.bio a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.camera-photo {
  margin: 0 0 1rem;
}

.camera-photo img {
  display: block;
  width: auto;
  max-width: min(100%, 22rem);
  max-height: 34rem;
  height: auto;
  margin-inline: 0;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
}

.camera-photo figcaption {
  margin-top: 0.375rem;
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.desk-photos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.desk-photos figure {
  margin: 0;
}

.desk-photos .wide {
  grid-column: 1 / -1;
}

.desk-photos img {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
}

@media (max-width: 640px) {
  .desk-photos {
    grid-template-columns: 1fr;
  }
}

/* Machines */
.machines {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.machine {
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 0.875rem 1rem;
  background: var(--bg-surface);
}

.machine.retired {
  opacity: 0.75;
}

.machine-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.machine-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.machine-role {
  font-size: 0.6875rem;
  color: var(--accent);
}

.specs {
  display: grid;
  grid-template-columns: 9ch minmax(0, 1fr);
  gap: 0.125rem 0.75rem;
  font-size: 0.75rem;
  margin: 0;
}

.specs dt {
  color: var(--text-muted);
}

.specs dd {
  color: var(--text-secondary);
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}

.machine-note {
  margin-top: 0.5rem;
  font-size: 0.6875rem;
  color: var(--text-muted);
  line-height: 1.6;
}

/* Journey timeline */
.timeline {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.timeline-item {
  display: grid;
  grid-template-columns: 4.5ch 1fr;
  gap: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.6;
}

.timeline-year {
  color: var(--accent);
  font-size: 0.75rem;
  padding-top: 0.125rem;
}

.timeline-text {
  color: var(--text-secondary);
}

/* Experience */
.experience {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.job {
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 0.875rem 1rem;
  background: var(--bg-surface);
}

.job-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.job-role {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.job-period {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.job-org {
  font-size: 0.75rem;
  color: var(--accent);
  margin-top: 0.125rem;
}

.job-desc {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.375rem;
  line-height: 1.6;
}

.waiting-card {
  padding: 1rem;
  border: 1px dashed var(--border-subtle);
  border-radius: 6px;
}

.empty {
  color: var(--text-muted);
  font-size: 0.6875rem;
}
</style>
