/// <reference types="vite/client" />
/// <reference path="./types/tonejs-midi.d.ts" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
