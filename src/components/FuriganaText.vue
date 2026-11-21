<script setup lang="ts">
import { computed } from 'vue'
import { furiganaParts } from '@/utils/furigana'
import { useFurigana } from '@/composables/useFurigana'

const props = defineProps<{ text: string }>()
const { enabled } = useFurigana()

const parts = computed(() => furiganaParts(props.text, enabled.value))
</script>

<template>
  <template v-for="(part, i) in parts" :key="i">
    <ruby v-if="part.reading">{{ part.text }}<rt>{{ part.reading }}</rt></ruby>
    <template v-else>{{ part.text }}</template>
  </template>
</template>

<style scoped>
rt {
  font-size: 0.6em;
  color: var(--text-muted);
  line-height: 1;
}
</style>
