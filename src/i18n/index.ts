import { reactive, toRef } from 'vue'
import en from './en'
import ja from './ja'
import id from './id'

export type Locale = 'en' | 'id' | 'ja'

const dicts: Record<Locale, unknown> = { en, id, ja }
const STORAGE_KEY = 'locale-preference'

export const i18n = reactive<{ locale: Locale }>({ locale: 'en' })

function lookup(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => {
    if (o && typeof o === 'object' && k in (o as Record<string, unknown>)) {
      return (o as Record<string, unknown>)[k]
    }
    return undefined
  }, obj)
}

// Translate a dot-path key, falling back to English, then to the key itself.
// Optional {var} interpolation: t('now.synced', { date: '...' }).
export function t(path: string, vars?: Record<string, string | number>): string {
  const raw = lookup(dicts[i18n.locale], path) ?? lookup(dicts.en, path)
  if (typeof raw !== 'string') return path
  let s: string = raw
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split(`{${k}}`).join(String(v))
    }
  }
  return s
}

export function setLocale(locale: Locale) {
  i18n.locale = locale
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // storage unavailable (private mode etc.) — locale still applies in-memory
  }
  document.documentElement.lang = locale
}

export function initLocale() {
  let stored: string | null = null
  try {
    stored = localStorage.getItem(STORAGE_KEY)
  } catch {
    stored = null
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en'
  const locale: Locale =
    stored === 'en' || stored === 'id' || stored === 'ja'
      ? stored
      : nav.toLowerCase().startsWith('id')
        ? 'id'
        : nav.toLowerCase().startsWith('ja')
          ? 'ja'
          : 'en'
  setLocale(locale)
}

export function useI18n() {
  return {
    t,
    locale: toRef(i18n, 'locale'),
    setLocale,
    toggle: () => setLocale(i18n.locale === 'en' ? 'id' : i18n.locale === 'id' ? 'ja' : 'en'),
  }
}
