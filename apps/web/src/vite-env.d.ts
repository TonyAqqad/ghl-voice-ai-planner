/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GHL_CLIENT_ID: string
  readonly VITE_GHL_CLIENT_SECRET: string
  readonly VITE_GHL_SHARED_SECRET: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
