<script setup lang="ts">
import T from '@/components/T.vue'
import { Search } from 'lucide-vue-next'
import BlogCard from '@/components/BlogCard.vue'
import { useBlogPosts } from '@/composables/useBlogPosts'
import { useI18n } from '@/i18n'

const { searchQuery, loading, filteredPosts } = useBlogPosts()
const { t } = useI18n()
</script>

<template>
  <main class="container page">
    <h1 class="page-title"><T path="blog.title" /></h1>
    <p class="page-subtitle"><T path="blog.subtitle" /></p>

    <div class="search-wrapper">
      <Search :size="14" class="search-icon" />
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('blog.search')"
        class="search-input"
      />
    </div>

    <div v-if="loading" class="empty-state"><T path="blog.loading" /></div>

    <div v-else-if="filteredPosts.length > 0" class="blog-list">
      <BlogCard v-for="post in filteredPosts" :key="post.id" :post="post" />
    </div>

    <div v-else class="empty-state">
      {{ searchQuery ? t('blog.noMatch') : t('blog.noPosts') }}
    </div>
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

.search-wrapper {
  position: relative;
  margin-bottom: 2rem;
  max-width: 22rem;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  font-size: 0.8125rem;
  font-family: var(--font-mono);
  border: 1px solid var(--border-subtle);
  border-radius: 0.375rem;
  background: transparent;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s;
}

.search-input:focus {
  border-color: var(--accent);
}

.empty-state {
  color: var(--text-muted);
  padding: 3rem 0;
  font-size: 0.9375rem;
}

.blog-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
</style>
