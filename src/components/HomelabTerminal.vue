<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

interface Usage {
  used: number
  total: number
}

interface HomelabStats {
  online: boolean
  lastSeen?: string
  hostname?: string
  user?: string
  os?: string | null
  host?: string | null
  kernel?: string | null
  uptimeMs?: number
  cpu?: { model: string | null; cores: number | null; maxFreqGHz: number | null } | null
  gpu?: string | null
  memory?: Usage | null
  swap?: Usage | null
  disk?: (Usage & { fs?: string | null }) | null
  load?: number[] | null
  ip?: string | null
  updatedAt?: string
}

interface Row {
  key: string
  value: string
}

// Real fastfetch Alpine Linux logo (fastfetch --logo Alpine)
const LOGO = [
  '       .hddddddddddddddddddddddh.',
  '      :dddddddddddddddddddddddddd:',
  '     /dddddddddddddddddddddddddddd/',
  '    +dddddddddddddddddddddddddddddd+',
  '  `sdddddddddddddddddddddddddddddddds`',
  ' `ydddddddddddd++hdddddddddddddddddddy`',
  '.hddddddddddd+`  `+ddddh:-sdddddddddddh.',
  'hdddddddddd+`      `+y:    .sddddddddddh',
  'ddddddddh+`   `//`   `.`     -sddddddddd',
  'ddddddh+`   `/hddh/`   `:s-    -sddddddd',
  'ddddh+`   `/+/dddddh/`   `+s-    -sddddd',
  'ddd+`   `/o` :dddddddh/`   `oy-    .yddd',
  'hdddyo+ohddyosdddddddddho+oydddy++ohdddh',
  '.hddddddddddddddddddddddddddddddddddddh.',
  ' `yddddddddddddddddddddddddddddddddddy`',
  '  `sdddddddddddddddddddddddddddddddds`',
  '    +dddddddddddddddddddddddddddddd+',
  '     /dddddddddddddddddddddddddddd/',
  '      :dddddddddddddddddddddddddd:',
  '       .hddddddddddddddddddddddh.',
].join('\n')

// Catppuccin Mocha ANSI palette — the color blocks fastfetch prints last
const PALETTE = ['#45475a', '#f38ba8', '#a6e3a1', '#f9e2af', '#89b4fa', '#f5c2e7', '#94e2d5', '#bac2de']

const stats = ref<HomelabStats | null>(null)
const state = ref<'loading' | 'online' | 'offline'>('loading')
const now = ref(Date.now())
let pollTimer: ReturnType<typeof setInterval> | null = null
let tickTimer: ReturnType<typeof setInterval> | null = null

async function load() {
  const api = import.meta.env.VITE_HOMELAB_API || '/api/homelab'
  try {
    const res = await fetch(api, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: HomelabStats = await res.json()
    stats.value = data
    state.value = data.online ? 'online' : 'offline'
  } catch {
    state.value = 'offline'
  }
}

onMounted(() => {
  load()
  pollTimer = setInterval(load, 3_000)
  tickTimer = setInterval(() => {
    now.value = Date.now()
  }, 1_000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (tickTimer) clearInterval(tickTimer)
})

const user = computed(() => stats.value?.user || 'tomori')
const hostname = computed(() => stats.value?.hostname || 'homelab')

function fmtBytes(n: number | undefined | null): string {
  if (n == null || !Number.isFinite(n)) return '—'
  const gib = n / 1024 ** 3
  if (gib >= 1) return `${gib.toFixed(2)} GiB`
  const mib = n / 1024 ** 2
  if (mib >= 1) return `${mib.toFixed(2)} MiB`
  return `${(n / 1024).toFixed(2)} KiB`
}

function fmtUptime(ms: number): string {
  const mins = Math.floor(ms / 60_000)
  const days = Math.floor(mins / 1440)
  const hours = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  const parts: string[] = []
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`)
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`)
  if (m > 0 || parts.length === 0) parts.push(`${m} min${m === 1 ? '' : 's'}`)
  return parts.join(', ')
}

function usageText(u: Usage): string {
  const pct = Math.round((u.used / u.total) * 100)
  return `${fmtBytes(u.used)} / ${fmtBytes(u.total)} (${pct}%)`
}

// Uptime ticks locally between polls so it reads as live
const liveUptimeMs = computed(() => {
  const s = stats.value
  if (!s?.uptimeMs || !s.updatedAt) return 0
  const pushedAt = new Date(s.updatedAt).getTime()
  const elapsed = Math.max(0, now.value - pushedAt)
  return s.uptimeMs + elapsed
})

const rows = computed<Row[]>(() => {
  const s = stats.value
  if (!s?.online) return []
  const out: Row[] = []
  if (s.os) out.push({ key: 'OS', value: s.os })
  if (s.host) out.push({ key: 'Host', value: s.host })
  if (s.kernel) out.push({ key: 'Kernel', value: s.kernel })
  out.push({ key: 'Uptime', value: fmtUptime(liveUptimeMs.value) })
  if (s.cpu?.model) {
    const cores = s.cpu.cores ? ` (${s.cpu.cores})` : ''
    const freq = s.cpu.maxFreqGHz ? ` @ ${s.cpu.maxFreqGHz.toFixed(2)} GHz` : ''
    out.push({ key: 'CPU', value: `${s.cpu.model}${cores}${freq}` })
  }
  if (s.gpu) out.push({ key: 'GPU', value: s.gpu })
  if (s.memory) out.push({ key: 'Memory', value: usageText(s.memory) })
  if (s.swap) out.push({ key: 'Swap', value: usageText(s.swap) })
  if (s.disk) {
    const fs = s.disk.fs ? ` - ${s.disk.fs}` : ''
    out.push({ key: 'Disk', value: `${usageText(s.disk)}${fs}` })
  }
  if (s.load?.length) out.push({ key: 'Load', value: s.load.map((l) => l.toFixed(2)).join(', ') })
  if (s.ip) out.push({ key: 'IP', value: s.ip })
  return out
})

const titleLine = computed(() => `${user.value}@${hostname.value}`)
const separator = computed(() => '─'.repeat(titleLine.value.length))

function agoText(iso: string | undefined): string {
  if (!iso) return ''
  const ts = new Date(iso).getTime()
  if (!Number.isFinite(ts)) return ''
  const secs = Math.max(0, Math.floor((now.value - ts) / 1000))
  if (secs < 5) return t('homelab.ago.now')
  if (secs < 60) return t('homelab.ago.s', { n: secs })
  const mins = Math.floor(secs / 60)
  if (mins < 60) return t('homelab.ago.m', { m: mins })
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t('homelab.ago.h', { h: hours })
  return t('homelab.ago.d', { d: Math.floor(hours / 24) })
}

const lastSeenText = computed(() => agoText(stats.value?.lastSeen || stats.value?.updatedAt))
</script>

<template>
  <section class="section homelab">
    <h2 class="section-title">{{ t('now.homelab') }}</h2>

    <div class="fetchbox" :aria-label="state === 'online' ? 'Live fastfetch output from the homelab' : 'Homelab status (offline)'">
      <template v-if="state === 'online' && stats">
        <div class="fetch">
          <pre class="logo" aria-hidden="true">{{ LOGO }}</pre>
          <div class="info">
            <p class="title-line">{{ titleLine }}</p>
            <p class="sep" aria-hidden="true">{{ separator }}</p>
            <p v-for="row in rows" :key="row.key" class="row">
              <span class="k">{{ row.key }}:</span>
              <span class="v">{{ row.value }}</span>
            </p>
            <p class="palette" aria-hidden="true">
              <i v-for="c in PALETTE" :key="c" :style="{ background: c }" />
            </p>
          </div>
        </div>
      </template>

      <template v-else-if="state === 'offline'">
        <p class="err">{{ t('homelab.offline') }}</p>
        <p v-if="lastSeenText" class="hint">{{ t('homelab.lastSeen', { time: lastSeenText }) }}</p>
      </template>

      <template v-else>
        <p class="hint">{{ t('homelab.connecting') }}</p>
      </template>
    </div>
  </section>
</template>

<style scoped>
.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

/* Pure fastfetch output on a dark surface — no window chrome */
.fetchbox {
  background: #1e1e2e;
  border: 1px solid #313244;
  border-radius: 6px;
  padding: 1rem 1.125rem;
  color: #cdd6f4;
  font-size: 0.75rem;
  line-height: 1.55;
  overflow-x: auto;
}

.fetch {
  display: flex;
  gap: 3ch;
  align-items: flex-start;
}

.logo {
  color: #89b4fa;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  margin: 0;
  flex-shrink: 0;
}

.info {
  min-width: 0;
}

.title-line {
  font-weight: 700;
  color: #89b4fa;
  white-space: pre;
}

.sep {
  color: #45475a;
  white-space: pre;
}

.row {
  white-space: pre;
}

.k {
  display: inline-block;
  min-width: 8ch;
  color: #89b4fa;
  font-weight: 700;
}

.v {
  color: #cdd6f4;
}

.palette {
  display: flex;
  gap: 0;
  margin-top: 0.5rem;
}

.palette i {
  width: 2.2ch;
  height: 0.85em;
  display: inline-block;
}

.err {
  color: #f38ba8;
  white-space: pre-wrap;
}

.hint {
  color: #6c7086;
  white-space: pre-wrap;
}

@media (max-width: 640px) {
  .fetchbox {
    font-size: 0.7rem;
  }

  .logo {
    display: none;
  }
}
</style>
