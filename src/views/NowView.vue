<script setup lang="ts">
import T from '@/components/T.vue'
import { useStatusPage } from '@/composables/useStatusPage'
import { useAnkiStats } from '@/composables/useAnkiStats'
import AnkiStats from '@/components/AnkiStats.vue'
import AnkiDiscordCard from '@/components/AnkiDiscordCard.vue'
import HomelabTerminal from '@/components/HomelabTerminal.vue'
import { useI18n } from '@/i18n'

const { statusData } = useStatusPage()
const { stats } = useAnkiStats()
const { t } = useI18n()
</script>

<template>
  <main class="container page">
    <h1 class="page-title"><T path="now.title" /></h1>
    <p class="page-subtitle"><T path="now.subtitle" /></p>

    <section class="section">
      <h2 class="section-title"><T path="now.status" /></h2>
      <!-- Persistent rich presence: stays visible when Anki is closed,
           just without any activity -->
      <AnkiDiscordCard v-if="stats?.presence" :presence="stats.presence" />
      <div v-else class="waiting-card">
        <p class="empty"><T path="now.statusWaiting" /></p>
      </div>
    </section>

    <AnkiStats />

    <HomelabTerminal />

    <section class="section">
      <h2 class="section-title"><T path="now.goals" /></h2>
      <ul class="item-list">
        <li v-for="(goal, i) in statusData.goals" :key="i" class="item"><T :path="goal" /></li>
      </ul>
    </section>

    <section class="section">
      <h2 class="section-title"><T path="now.interests" /></h2>
      <ul class="item-list">
        <li v-for="(interest, i) in statusData.interests" :key="i" class="item"><T :path="interest" /></li>
      </ul>
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

.item-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item {
  position: relative;
  padding-left: 1.25rem;
  font-size: 0.9375rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.item::before {
  content: '-';
  position: absolute;
  left: 0;
  color: var(--text-muted);
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
