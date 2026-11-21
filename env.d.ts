/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_LASTFM_USERNAME: string
  readonly VITE_MEDIUM_USERNAME: string
  readonly VITE_ANKI_API?: string
  readonly VITE_HOMELAB_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
