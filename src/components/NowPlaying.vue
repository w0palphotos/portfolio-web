<script setup lang="ts">
import T from '@/components/T.vue'
import { ref, onMounted, onUnmounted } from 'vue'
import { Music } from 'lucide-vue-next'
import { useI18n } from '@/i18n'

const props = defineProps<{
  username: string
}>()

const { t } = useI18n()

interface Track {
  name: string
  artist: string
  album?: string
  image?: string
  url?: string
  nowplaying?: boolean
}

const track = ref<Track | null>(null)
let interval: ReturnType<typeof setInterval> | null = null

async function fetchNowPlaying() {
  if (!props.username) return
  try {
    // The key lives on the server; this request never contains it.
    const url = `/api/lastfm?user=${encodeURIComponent(props.username)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    track.value = data.track || null
  } catch {
    track.value = null
  }
}

onMounted(() => {
  fetchNowPlaying()
  interval = setInterval(fetchNowPlaying, 30_000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

<template>
  <div class="now-playing-card">
    <div class="now-playing-inner">
      <img
        v-if="track?.image"
        :src="track.image"
        :alt="track?.name"
        class="now-playing-art"
      />
      <div v-else class="now-playing-art-placeholder">
        <Music :size="14" />
      </div>
      <div class="now-playing-info">
        <template v-if="track">
          <span class="now-playing-label"><T path="nowPlaying.playing" /></span>
          <a
            :href="track.url"
            target="_blank"
            rel="noopener noreferrer"
            class="now-playing-track"
          >{{ track.name }}</a>
          <span class="now-playing-artist">{{ track.artist }}</span>
        </template>
        <template v-else>
          <span class="now-playing-label"><T path="nowPlaying.nothing" /></span>
          <span class="now-playing-idle"><T path="nowPlaying.checkBack" /></span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.now-playing-card {
  padding: 0.5rem 0;
}

.now-playing-inner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.now-playing-art {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  object-fit: cover;
  flex-shrink: 0;
}

.now-playing-art-placeholder {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background: #21262d;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8b949e;
  flex-shrink: 0;
}

.now-playing-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.now-playing-label {
  font-size: 0.6875rem;
  color: #8b949e;
}

.now-playing-track {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #58a6ff;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.now-playing-track:hover {
  color: #79c0ff;
}

.now-playing-artist {
  font-size: 0.6875rem;
  color: #6e7681;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.now-playing-idle {
  font-size: 0.75rem;
  color: #6e7681;
}
</style>
