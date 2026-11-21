import { reactive } from 'vue'

export interface LightboxItem {
  src: string
  alt: string
  width?: number
  height?: number
  note?: string
}

const state = reactive({
  open: false,
  items: [] as LightboxItem[],
  index: 0,
})

export function useLightbox() {
  function show(items: LightboxItem[], index = 0) {
    if (!items.length) return
    state.items = items
    state.index = index
    state.open = true
  }

  function hide() {
    state.open = false
  }

  function step(delta: number) {
    if (!state.items.length) return
    state.index = (state.index + delta + state.items.length) % state.items.length
  }

  return { state, show, hide, step }
}
