<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useLightbox } from '@/composables/useLightbox'

const { t } = useI18n()
const { state, hide, step } = useLightbox()

const zoom = ref(1)
const pan = ref({ x: 0, y: 0 })
const dragging = ref(false)
const closeButton = ref<HTMLButtonElement | null>(null)
let lastTrigger: HTMLElement | null = null
let dragStart = { x: 0, y: 0, px: 0, py: 0 }
let pinchStart = { distance: 0, zoom: 1 }
let suppressClick = false
const pointers = new Map<number, { x: number; y: number }>()

const active = computed(() =>
  state.open && state.items.length ? state.items[state.index] : null,
)
const counter = computed(() =>
  state.open ? `${state.index + 1} / ${state.items.length}` : '',
)
const zoomPercent = computed(() => `${Math.round(zoom.value * 100)}%`)

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function resetView() {
  zoom.value = 1
  pan.value = { x: 0, y: 0 }
  dragging.value = false
  pinchStart = { distance: 0, zoom: 1 }
  suppressClick = false
  pointers.clear()
}

function zoomBy(delta: number) {
  zoom.value = clamp(zoom.value + delta, 1, 4)
  if (zoom.value === 1) pan.value = { x: 0, y: 0 }
}

function onStageClick() {
  if (suppressClick) {
    suppressClick = false
    return
  }
  if (zoom.value > 1) {
    zoom.value = 1
    pan.value = { x: 0, y: 0 }
  } else {
    zoom.value = 2
  }
}

function onWheel(event: WheelEvent) {
  event.preventDefault()
  zoomBy(event.deltaY < 0 ? 0.25 : -0.25)
}

function onPointerDown(event: PointerEvent) {
  const stage = event.currentTarget as HTMLElement
  stage.setPointerCapture(event.pointerId)
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  suppressClick = false

  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    pinchStart = { distance: distance(a, b), zoom: zoom.value }
    dragging.value = false
  } else if (pointers.size === 1 && zoom.value > 1) {
    dragging.value = true
    dragStart = { x: event.clientX, y: event.clientY, px: pan.value.x, py: pan.value.y }
  }
}

function onPointerMove(event: PointerEvent) {
  if (!pointers.has(event.pointerId)) return
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

  if (pointers.size >= 2 && pinchStart.distance > 0) {
    const [a, b] = [...pointers.values()]
    zoom.value = clamp(pinchStart.zoom * (distance(a, b) / pinchStart.distance), 1, 4)
    suppressClick = true
    if (zoom.value === 1) pan.value = { x: 0, y: 0 }
    return
  }

  if (dragging.value) {
    pan.value = {
      x: dragStart.px + event.clientX - dragStart.x,
      y: dragStart.py + event.clientY - dragStart.y,
    }
  }
}

function onPointerUp(event: PointerEvent) {
  pointers.delete(event.pointerId)
  if (pointers.size < 2) pinchStart = { distance: 0, zoom: 1 }
  if (pointers.size === 0) dragging.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (!state.open) return
  if (event.key === 'Escape') hide()
  else if (event.key === 'ArrowRight') {
    event.preventDefault()
    step(1)
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    step(-1)
  } else if (event.key === '+' || event.key === '=') zoomBy(0.25)
  else if (event.key === '-') zoomBy(-0.25)
}

watch(
  () => state.open,
  async (open) => {
    resetView()
    if (open) {
      lastTrigger = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'
      await nextTick()
      closeButton.value?.focus()
    } else {
      document.body.style.overflow = ''
      await nextTick()
      lastTrigger?.focus()
    }
  },
)

watch(() => state.index, resetView)

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="active"
      class="lightbox"
      role="dialog"
      aria-modal="true"
      :aria-label="t('lightbox.title')"
      @click.self="hide"
    >
      <button
        ref="closeButton"
        type="button"
        class="lightbox-btn lightbox-close"
        :aria-label="t('lightbox.close')"
        @click="hide"
      >
        <X :size="18" />
      </button>

      <button
        v-if="state.items.length > 1"
        type="button"
        class="lightbox-btn lightbox-nav lightbox-prev"
        :aria-label="t('lightbox.prev')"
        @click="step(-1)"
      >
        <ChevronLeft :size="20" />
      </button>
      <button
        v-if="state.items.length > 1"
        type="button"
        class="lightbox-btn lightbox-nav lightbox-next"
        :aria-label="t('lightbox.next')"
        @click="step(1)"
      >
        <ChevronRight :size="20" />
      </button>

      <div
        class="lightbox-stage"
        :class="{ zoomed: zoom > 1, dragging }"
        @click="onStageClick"
        @wheel.prevent="onWheel"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @dragstart.prevent
      >
        <img
          :src="active.src"
          :alt="t(active.alt)"
          :width="active.width"
          :height="active.height"
          :style="{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }"
        />
      </div>

      <div v-if="active.note" class="lightbox-note">{{ t(active.note) }}</div>

      <div class="lightbox-controls">
        <button
          v-if="state.items.length > 1"
          type="button"
          class="lightbox-text-btn"
          :aria-label="t('lightbox.prev')"
          @click="step(-1)"
        >
          <ChevronLeft :size="14" />
          <span>{{ t('lightbox.prevShort') }}</span>
        </button>
        <span class="lightbox-counter">{{ counter }}</span>
        <button
          v-if="state.items.length > 1"
          type="button"
          class="lightbox-text-btn"
          :aria-label="t('lightbox.next')"
          @click="step(1)"
        >
          <span>{{ t('lightbox.nextShort') }}</span>
          <ChevronRight :size="14" />
        </button>
      </div>

      <div class="lightbox-zoom-controls">
        <button
          type="button"
          class="lightbox-btn"
          :aria-label="t('lightbox.zoomOut')"
          :disabled="zoom <= 1"
          @click="zoomBy(-0.25)"
        >
          <ZoomOut :size="18" />
        </button>
        <span class="lightbox-zoom-level">{{ zoomPercent }}</span>
        <button
          type="button"
          class="lightbox-btn"
          :aria-label="t('lightbox.zoomIn')"
          :disabled="zoom >= 4"
          @click="zoomBy(0.25)"
        >
          <ZoomIn :size="18" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3.5rem 1rem 7rem;
  background: rgba(0, 0, 0, 0.92);
}

.lightbox-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  background: var(--bg-surface);
  color: var(--text-primary);
  cursor: pointer;
}

.lightbox-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.lightbox-btn:focus-visible,
.lightbox-text-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.lightbox-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.lightbox-prev {
  left: 1rem;
}

.lightbox-next {
  right: 1rem;
}

.lightbox-controls {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transform: translateX(-50%);
}

.lightbox-text-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 0.8125rem;
  cursor: pointer;
}

.lightbox-counter {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.lightbox-note {
  position: absolute;
  bottom: 4.5rem;
  left: 50%;
  max-width: min(100%, 32rem);
  font-size: 0.6875rem;
  color: var(--text-muted);
  text-align: center;
  transform: translateX(-50%);
}

.lightbox-zoom-controls {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lightbox-zoom-level {
  min-width: 3.5ch;
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: center;
}

.lightbox-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  max-height: 100%;
  cursor: zoom-in;
  touch-action: none;
}

.lightbox-stage.zoomed {
  cursor: grab;
}

.lightbox-stage.dragging {
  cursor: grabbing;
}

.lightbox-stage img {
  display: block;
  max-width: 100%;
  max-height: calc(100vh - 12rem);
  object-fit: contain;
  transform-origin: center;
  transition: transform 0.15s ease;
  user-select: none;
}

.lightbox-stage.dragging img {
  transition: none;
}

@media (max-width: 640px) {
  .lightbox-nav {
    display: none;
  }

  .lightbox-controls {
    bottom: 4.5rem;
    width: calc(100% - 2rem);
    justify-content: space-between;
    gap: 0.5rem;
  }

  .lightbox-note {
    bottom: 7.5rem;
  }

  .lightbox-zoom-controls {
    bottom: 1rem;
  }
}
</style>
