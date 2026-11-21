<script setup lang="ts">
import { computed } from 'vue'
import FuriganaText from '@/components/FuriganaText.vue'
import { useI18n } from '@/i18n'

const props = defineProps<{
  path?: string
  vars?: Record<string, string | number>
  text?: string
}>()

const { t } = useI18n()
const value = computed(() => props.text ?? (props.path ? t(props.path, props.vars) : ''))
</script>

<template>
  <FuriganaText :text="value" />
</template>
