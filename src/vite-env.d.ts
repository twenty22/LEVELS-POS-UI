/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLOVER_MOCK_MODE?: string
  readonly VITE_LEVELS_BFF_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
