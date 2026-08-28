/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly APP_NAME?: string;
  readonly APP_TAGLINE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
