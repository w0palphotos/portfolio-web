<script setup lang="ts">
import { journey, experience, education } from '@/data/bio'
import { useI18n } from '@/i18n'

const { t } = useI18n()
</script>

<template>
  <main class="container page">
    <h1 class="page-title">{{ t('bio.title') }}</h1>
    <p class="page-subtitle">{{ t('bio.subtitle') }}</p>

    <section class="section">
      <h2 class="section-title">{{ t('about.journey') }}</h2>
      <ol class="timeline">
        <li v-for="(entry, i) in journey" :key="i" class="timeline-item">
          <span class="timeline-year">{{ entry.year ?? '·' }}</span>
          <span class="timeline-text">{{ t(entry.text) }}</span>
        </li>
      </ol>
    </section>

    <section class="section">
      <h2 class="section-title">{{ t('about.experience') }}</h2>
      <div v-if="experience.length" class="experience">
        <article v-for="(job, i) in experience" :key="i" class="job">
          <div class="job-head">
            <h3 class="job-role">{{ t(job.role) }}</h3>
            <span class="job-period">{{ t(job.period) }}</span>
          </div>
          <p class="job-org">{{ job.org }}</p>
          <p v-if="job.description" class="job-desc">{{ t(job.description) }}</p>
        </article>
      </div>
      <div v-else class="waiting-card">
        <p class="empty">{{ t('about.expEmpty') }}</p>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">{{ t('about.education') }}</h2>
      <div class="experience">
        <article v-for="(ed, i) in education" :key="i" class="job">
          <div class="job-head">
            <h3 class="job-role">{{ ed.school }}</h3>
            <span class="job-period">{{ t(ed.period) }}</span>
          </div>
          <p class="job-org">{{ t(ed.degree) }}</p>
        </article>
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
