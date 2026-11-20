<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from '@/i18n'

interface Presence {
  status: 'online' | 'offline'
  state?: string
  details?: string
  startedAt?: number
  icon?: string
}

const props = defineProps<{
  presence: Presence
}>()

const { t } = useI18n()
const now = ref(Date.now())
let ticker: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  ticker = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (ticker) clearInterval(ticker)
})

const elapsedTime = computed(() => {
  if (!props.presence?.startedAt) return '0:00'
  const seconds = Math.max(0, Math.floor((now.value - props.presence.startedAt * 1000) / 1000))
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${mins}:${String(secs).padStart(2, '0')}`
})
</script>

<template>
  <div class="discord-activity-card" :class="{ offline: presence.status !== 'online' }">
    <div class="card-header">
      <span class="header-label">{{ presence.status === 'online' ? t('ankiCard.playing') : t('ankiCard.offline') }}</span>
    </div>

    <div class="activity-body">
      <!-- Left icon box with badge -->
      <div class="icon-container">
        <!-- Anki logo svg -->
        <svg class="anki-logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" rx="22" fill="#2B2D31" />
          <path d="M50 15L61.2 37.8L86.2 41.5L68.1 59.1L72.4 84L50 72.2L27.6 84L31.9 59.1L13.8 41.5L38.8 37.8L50 15Z" fill="#3B82F6" stroke="#60A5FA" stroke-width="4" stroke-linejoin="round"/>
          <path d="M68 28L73.6 39.4L86.1 41.2L77 50L79.2 62.5L68 56.6L56.8 62.5L59 50L49.9 41.2L62.4 39.4L68 28Z" fill="#93C5FD" opacity="0.8"/>
        </svg>

        <!-- Badge status icon -->
        <div class="status-badge" :title="presence.status === 'online' ? presence.icon : 'offline'">
          <span v-if="presence.status !== 'online'" class="badge-offline" aria-label="offline" />
          <span v-else-if="presence.icon === 'zzz'" class="badge-text">💤</span>
          <span v-else-if="presence.icon === 'search'" class="badge-text">🔍</span>
          <span v-else-if="presence.icon === 'tick-dark'" class="badge-text">✓</span>
          <span v-else class="badge-text">⋯</span>
        </div>
      </div>

      <!-- Right details text -->
      <div class="activity-info">
        <div class="app-title">Anki</div>
        <template v-if="presence.status === 'online'">
          <div class="app-state">{{ presence.state || t('ankiCard.chilling') }}</div>
          <div class="app-details">{{ presence.details || t('ankiCard.studying') }}</div>
          <div class="app-time">
            <span class="gamepad-icon">🎮</span>
            <span class="timer-text">{{ t('ankiCard.elapsed', { time: elapsedTime }) }}</span>
          </div>
        </template>
        <template v-else>
          <div class="app-state idle">{{ t('ankiCard.notStudying') }}</div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.discord-activity-card {
  background: #1e1f22;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  font-family: 'gg sans', 'Noto Sans', system-ui, -apple-system, sans-serif;
  max-width: 380px;
}

.card-header {
  margin-bottom: 8px;
}

.header-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: #b5bac1;
  letter-spacing: 0.02em;
}

.activity-body {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-container {
  position: relative;
  width: 58px;
  height: 58px;
  flex-shrink: 0;
}

.anki-logo {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  display: block;
}

.status-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  background: #111214;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #1e1f22;
}

.badge-text {
  font-size: 10px;
  line-height: 1;
}

.badge-offline {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #80848e;
}

.discord-activity-card.offline .anki-logo {
  filter: grayscale(0.6) brightness(0.8);
}

.discord-activity-card.offline .header-label {
  color: #80848e;
}

.app-state.idle {
  color: #949ba4;
}

.activity-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 2px;
}

.app-title {
  color: #f2f3f5;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
}

.app-state,
.app-details {
  color: #dbdee1;
  font-size: 13px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-time {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #23a55a;
  font-size: 12px;
  font-weight: 600;
  margin-top: 2px;
}

.gamepad-icon {
  font-size: 12px;
}

.timer-text {
  color: #23a55a;
  font-family: inherit;
}
</style>
