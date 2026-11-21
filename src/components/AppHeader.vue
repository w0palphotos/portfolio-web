<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { navLinks, type NavLink } from '@/config/navigation'
import { Menu, X, Disc3, Languages } from 'lucide-vue-next'
import NowPlaying from '@/components/NowPlaying.vue'
import { useI18n } from '@/i18n'

defineProps<{
  nowPlayingVisible: boolean
  lastfmUsername: string
  lastfmApiKey: string
}>()

const emit = defineEmits<{
  'toggle-now-playing': []
}>()

const route = useRoute()
const { t, toggle } = useI18n()
const mobileOpen = ref(false)

function closeMobile() {
  mobileOpen.value = false
}

function isActive(link: NavLink) {
  return route.path === link.href || (link.href !== '/' && route.path.startsWith(link.href + '/'))
}
</script>

<template>
  <!-- Mobile top bar -->
  <header class="mobile-header">
    <router-link to="/" class="mobile-brand" @click="closeMobile">w0pal</router-link>
    <button
      class="hamburger"
      @click="mobileOpen = !mobileOpen"
      :aria-expanded="mobileOpen"
      :aria-label="t('aria.toggleNav')"
    >
      <Menu v-if="!mobileOpen" :size="18" />
      <X v-else :size="18" />
    </button>
  </header>

  <!-- Mobile overlay -->
  <transition name="fade">
    <div
      v-if="mobileOpen"
      class="mobile-overlay"
      @click="closeMobile"
    />
  </transition>

  <!-- Sidebar (desktop fixed + mobile slide-in drawer) -->
  <aside class="sidebar" :class="{ open: mobileOpen }">
    <div class="sidebar-scroll">
      <router-link to="/" class="sidebar-brand" @click="closeMobile">w0pal</router-link>
      <nav class="sidebar-nav" :aria-label="t('aria.primaryNav')">
        <router-link
          v-for="link in navLinks"
          :key="link.href"
          :to="link.href"
          class="nav-item"
          :class="{ active: isActive(link) }"
          :aria-current="isActive(link) ? 'page' : undefined"
          @click="closeMobile"
        >
          {{ t(link.label) }}
        </router-link>
      </nav>
    </div>
    <div class="sidebar-footer">
      <button
        class="lang-toggle"
        @click="toggle"
        :aria-label="t('lang.switch')"
      >
        <Languages :size="14" />
        <span>{{ t('lang.target') }}</span>
      </button>
      <button
        class="now-playing-toggle"
        :class="{ active: nowPlayingVisible }"
        @click="emit('toggle-now-playing')"
        :aria-label="t('aria.toggleNowPlaying')"
      >
        <Disc3 :size="14" />
        <span>{{ t('nowPlaying.toggle') }}</span>
      </button>
      <NowPlaying
        v-if="nowPlayingVisible"
        :username="lastfmUsername"
        :api-key="lastfmApiKey"
      />
    </div>
  </aside>
</template>

<style scoped>
/* ===== Mobile top bar ===== */
.mobile-header {
  position: sticky;
  top: 0;
  /* Above the drawer (z-50) so the hamburger/X stays visible and clickable
     while the menu is open */
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.25rem;
  height: 3.25rem;
  background-color: var(--bg-header);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-subtle);
}

.mobile-brand {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.hamburger {
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: 0.375rem;
  display: flex;
  align-items: center;
}

/* ===== Mobile overlay ===== */
.mobile-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.5);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ===== Sidebar: hidden by default, slide-in drawer on mobile ===== */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 50;
  width: 14rem;
  height: 100vh;
  height: 100dvh;
  background: var(--bg-primary);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.25s ease-out;
}

.sidebar.open {
  transform: translateX(0);
}

/* Mobile: full-width drawer, content starts below the persistent header */
@media (max-width: 767px) {
  .sidebar.open {
    width: 100%;
  }

  .sidebar {
    padding-top: 3.25rem;
  }

  /* Header already shows the brand while the drawer is open */
  .sidebar .sidebar-brand {
    display: none;
  }
}

/* Desktop: always visible, hide mobile elements */
@media (min-width: 768px) {
  .sidebar {
    transform: translateX(0);
  }

  .mobile-header,
  .mobile-overlay {
    display: none;
  }
}

.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 2rem 1.5rem 0;
}

.sidebar-brand {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2.5rem;
  display: inline-block;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  font-size: 0.875rem;
  color: var(--text-muted);
  padding: 0.5rem 0;
  transition: color 0.15s;
}

.nav-item:hover {
  color: var(--text-primary);
}

.nav-item.active {
  color: var(--accent);
}

/* ===== Sidebar footer ===== */
.sidebar-footer {
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.now-playing-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: color 0.15s;
}

.lang-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: color 0.15s;
}

.lang-toggle:hover {
  color: var(--text-primary);
}

.now-playing-toggle:hover {
  color: var(--text-primary);
}

.now-playing-toggle.active {
  color: var(--accent);
}
</style>
