<script setup lang="ts">
import { pictureGroups, type Picture } from '@/data/pictures'
import { useLightbox } from '@/composables/useLightbox'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const lightbox = useLightbox()
const shots: Picture[] = pictureGroups.flatMap((group) => group.items)

function open(shot: Picture) {
  lightbox.show(shots, shots.indexOf(shot))
}
</script>

<template>
  <main class="container page">
    <h1 class="page-title">{{ t('pictures.title') }}</h1>
    <p class="page-subtitle">{{ t('pictures.subtitle') }}</p>

    <section v-for="group in pictureGroups" :key="group.quarter" class="quarter">
      <h2 class="quarter-title">{{ group.quarter }}</h2>
      <div class="pictures">
        <figure
          v-for="shot in group.items"
          :key="shot.src"
          class="picture"
          :class="{ 'picture-phone': shot.portrait }"
        >
          <button
            type="button"
            class="picture-trigger"
            :aria-label="t('lightbox.open')"
            @click="open(shot)"
          >
            <img
              :src="shot.src"
              :alt="t(shot.alt)"
              :width="shot.width"
              :height="shot.height"
              loading="lazy"
            />
          </button>
          <figcaption v-if="shot.note" class="picture-note">{{ t(shot.note) }}</figcaption>
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

.quarter {
  margin-bottom: 2rem;
}

.quarter-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.pictures {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.5rem;
}

.picture {
  margin: 0;
}

.picture-trigger {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  cursor: zoom-in;
}

.picture-trigger:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.picture img {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  background: var(--bg-surface);
}

.picture-phone .picture-trigger {
  max-width: min(100%, 18rem);
  margin-inline: 0;
}

.picture-note {
  margin-top: 0.375rem;
  font-size: 0.6875rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.picture-phone .picture-note {
  max-width: 18rem;
  margin-inline: 0;
  font-size: 0.625rem;
}
</style>
