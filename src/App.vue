<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import ImageLightbox from '@/components/ImageLightbox.vue'
import { useI18n } from '@/i18n'

const route = useRoute()
const { locale, t } = useI18n()

const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const nowPlayingVisible = ref(true)

function toggleNowPlaying() {
  nowPlayingVisible.value = !nowPlayingVisible.value
}

const lastfmUsername = import.meta.env.VITE_LASTFM_USERNAME || ''
const lastfmApiKey = import.meta.env.VITE_LASTFM_API_KEY || ''
</script>

<template>
  <div class="page-wrapper">
    <AppHeader
      v-if="!isAdminRoute"
      :now-playing-visible="nowPlayingVisible"
      :lastfm-username="lastfmUsername"
      :lastfm-api-key="lastfmApiKey"
      @toggle-now-playing="toggleNowPlaying"
    />
    <div class="content-area">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
      <footer v-if="locale === 'ja' && !isAdminRoute" class="translation-note">
        {{ t('lang.note') }}
      </footer>
    </div>
    <ImageLightbox />
  </div>
</template>

<style>
.page-wrapper {
  min-height: 100vh;
  background-color: var(--bg-primary);
}

/* Desktop: offset content by sidebar width */
@media (min-width: 768px) {
  .content-area {
    margin-left: 14rem;
  }
}

/* Mobile: offset content by mobile header height */
@media (max-width: 767px) {
  .content-area {
    padding-top: 0;
  }
}

.translation-note {
  padding: 1.5rem;
  text-align: center;
  font-size: 0.6875rem;
  color: var(--text-muted);
}
</style>
