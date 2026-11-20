<script setup lang="ts">
import { useAboutPage } from '@/composables/useAboutPage'
import { machines, journey, experience, education } from '@/data/about'
import { useI18n } from '@/i18n'

const { aboutData } = useAboutPage()
const { t } = useI18n()
</script>

<template>
  <main class="container page">
    <h1 class="page-title">{{ t('about.title') }}</h1>
    <p class="page-subtitle">{{ t('about.subtitle') }}</p>

    <section class="section">
      <p v-for="(para, i) in aboutData.aboutParagraphs" :key="i" class="bio">{{ t(para) }}</p>
    </section>

    <section class="section">
      <h2 class="section-title">{{ t('about.machines') }}</h2>
      <div class="machines">
        <article v-for="m in machines" :key="m.name" class="machine" :class="{ retired: m.retired }">
          <div class="machine-head">
            <h3 class="machine-name">{{ m.name }}</h3>
            <span class="machine-role">{{ t(m.role) }}<template v-if="m.retired"> · {{ t('about.retired') }}</template></span>
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
      <h2 class="section-title">{{ t('about.journey') }}</h2>
      <ol class="timeline">
        <li v-for="(entry, i) in journey" :key="i" class="timeline-item">
          <span class="timeline-year">{{ entry.year ?? '—' }}</span>
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

.bio {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: var(--text-secondary);
  max-width: 66ch;
  margin-bottom: 1rem;
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
  grid-template-columns: 5.5ch 1fr;
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
