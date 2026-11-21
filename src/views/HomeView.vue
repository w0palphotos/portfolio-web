<script setup lang="ts">
import { useI18n } from '@/i18n'

const { t } = useI18n()

const socialLinks = [
  { href: 'https://github.com/w0pal', label: 'GitHub' },
  { href: 'https://instagram.com/w0pal', label: 'Instagram' },
  { href: 'https://linkedin.com/in/w0pal', label: 'LinkedIn' },
  { href: 'mailto:me@w0pal.xyz', label: 'email' },
]
</script>

<template>
  <main class="container page">
    <h1 class="greeting">{{ t('home.greeting') }}</h1>

    <p class="bio">{{ t('home.bio1') }}</p>

    <div class="links">
      <a
        v-for="link in socialLinks"
        :key="link.label"
        :href="link.href"
        target="_blank"
        rel="noopener noreferrer"
        class="link-btn"
      >{{ link.label }}</a>
    </div>
  </main>
</template>

<style scoped>
.page {
  padding: 5rem 1.5rem 2rem;
}

.greeting {
  font-size: clamp(1.75rem, 5vw, 2.5rem);
  font-weight: 700;
  line-height: 1.15;
  margin-bottom: 0.5rem;
  text-wrap: balance;
}

.bio {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: var(--text-secondary);
  max-width: 66ch;
  margin-bottom: 1.25rem;
  text-wrap: pretty;
}

.links {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
}

.link-btn {
  display: inline-block;
  padding: 0.4375rem 1rem;
  font-size: 0.8125rem;
  border: 1px solid var(--border-subtle);
  border-radius: 0.375rem;
  color: var(--text-primary);
  transition: background 0.15s, border-color 0.15s;
}

.link-btn:hover {
  background: var(--bg-surface);
  border-color: var(--text-muted);
}
</style>
