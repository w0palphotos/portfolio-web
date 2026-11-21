import { ref } from 'vue'

const STORAGE_KEY = 'furigana-preference'

function readPreference(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === null ? true : stored === 'on'
  } catch {
    return true
  }
}

const enabled = ref(readPreference())

export function useFurigana() {
  function set(value: boolean) {
    enabled.value = value
    try {
      localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off')
    } catch {
      // storage unavailable, the in-memory preference still applies
    }
  }

  function toggle() {
    set(!enabled.value)
  }

  return { enabled, set, toggle }
}
