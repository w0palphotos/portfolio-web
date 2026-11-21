<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useHomelabShell } from '@/composables/useHomelabShell'
import { useI18n } from '@/i18n'
import { useFurigana } from '@/composables/useFurigana'
import { furiganaHtml } from '@/utils/furigana'

const { lines, currentInput, busy, outputRef, handleKeydown, focus, prompt, ansiToHtml } = useHomelabShell()
const { t } = useI18n()
const { enabled } = useFurigana()

const renderedLines = computed(() =>
  lines.value.map((line) => ({
    ...line,
    html: ansiToHtml(furiganaHtml(line.text, enabled.value), { preEscaped: true }),
  })),
)

onMounted(() => {
  focus()
})
</script>

<template>
  <div class="terminal-page" @click="focus">
    <div ref="outputRef" class="terminal-output">
      <p
        v-for="(line, i) in renderedLines"
        :key="i"
        class="line"
        :class="line.type"
      ><span v-html="line.html"></span></p>
    </div>

    <div class="terminal-input-row">
      <div class="prompt-block">
        <div class="prompt-info">{{ prompt }}</div>
        <div class="prompt-input-line">
          <span class="prompt-char">$</span>
          <input
            v-model="currentInput"
            type="text"
            class="terminal-input"
            :placeholder="busy ? t('terminal.placeholderBusy') : t('terminal.placeholder')"
            :disabled="busy"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            @keydown="handleKeydown"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.terminal-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 3.25rem);
  height: calc(100dvh - 3.25rem);
  background: var(--bg-primary);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--text-primary);
  cursor: text;
  overscroll-behavior: none;
}

@media (min-width: 768px) {
  .terminal-page {
    height: 100vh;
    height: 100dvh;
  }
}

.terminal-output {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1.25rem 1.5rem 0.5rem;
  scroll-behavior: smooth;
}

.line {
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 1.6em;
}

.line.system {
  color: var(--accent-green);
}

.line.input {
  color: var(--text-primary);
}

.line.output {
  color: var(--text-primary);
}

.line.error {
  color: var(--accent-red);
}

.terminal-input-row {
  padding: 0 1.5rem 1rem;
  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.prompt-block {
  padding-top: 0.5rem;
}

.prompt-info {
  color: var(--accent-green);
  font-size: 0.75rem;
  user-select: none;
  line-height: 1.8;
}

.prompt-input-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.prompt-char {
  color: var(--accent-green);
  user-select: none;
  flex-shrink: 0;
  font-weight: 700;
}

.terminal-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  caret-color: var(--accent);
}

.terminal-input::placeholder {
  color: var(--text-muted);
}

.terminal-input:disabled {
  opacity: 0.6;
}
</style>
